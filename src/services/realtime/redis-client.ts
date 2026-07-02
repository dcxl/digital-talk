import net from "node:net";

const defaultRedisUrl = "redis://localhost:6379";

interface RedisConnectionOptions {
  database?: number;
  host: string;
  password?: string;
  port: number;
}

function getRedisUrl() {
  return process.env.REDIS_URL?.trim() || defaultRedisUrl;
}

function parseRedisUrl(): RedisConnectionOptions {
  const url = new URL(getRedisUrl());

  return {
    database: url.pathname ? Number(url.pathname.replace("/", "")) : undefined,
    host: url.hostname || "localhost",
    password: url.password ? decodeURIComponent(url.password) : undefined,
    port: url.port ? Number(url.port) : 6379,
  };
}

function encodeCommand(parts: string[]) {
  return Buffer.from(
    `*${parts.length}\r\n${parts
      .map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`)
      .join("")}`,
  );
}

function parseBulkString(buffer: Buffer, offset: number) {
  const lengthEnd = buffer.indexOf("\r\n", offset, "utf8");
  if (lengthEnd < 0) return undefined;

  const length = Number(buffer.subarray(offset, lengthEnd).toString("utf8"));
  if (length === -1) return { nextOffset: lengthEnd + 2, value: null };

  const start = lengthEnd + 2;
  const end = start + length;
  if (buffer.length < end + 2) return undefined;

  return {
    nextOffset: end + 2,
    value: buffer.subarray(start, end).toString("utf8"),
  };
}

function parseRedisValue(
  buffer: Buffer,
  offset: number,
): { nextOffset: number; value: unknown } | undefined {
  const type = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf("\r\n", offset, "utf8");
  if (lineEnd < 0) return undefined;

  if (type === "+") {
    return {
      nextOffset: lineEnd + 2,
      value: buffer.subarray(offset + 1, lineEnd).toString("utf8"),
    };
  }
  if (type === ":") {
    return {
      nextOffset: lineEnd + 2,
      value: Number(buffer.subarray(offset + 1, lineEnd).toString("utf8")),
    };
  }
  if (type === "-") {
    throw new Error(buffer.subarray(offset + 1, lineEnd).toString("utf8"));
  }
  if (type === "$") return parseBulkString(buffer, offset + 1);
  if (type === "*") {
    const count = Number(buffer.subarray(offset + 1, lineEnd).toString("utf8"));
    if (count === -1) return { nextOffset: lineEnd + 2, value: null };

    const values: unknown[] = [];
    let nextOffset = lineEnd + 2;

    for (let index = 0; index < count; index += 1) {
      const parsed = parseRedisValue(buffer, nextOffset);
      if (!parsed) return undefined;
      values.push(parsed.value);
      nextOffset = parsed.nextOffset;
    }

    return { nextOffset, value: values };
  }

  throw new Error("Unsupported Redis response");
}

function parseRedisResponse(buffer: Buffer): unknown {
  return parseRedisValue(buffer, 0)?.value;
}

async function sendRawCommand(parts: string[]) {
  const options = parseRedisUrl();
  const commands = [
    ...(options.password ? [["AUTH", options.password]] : []),
    ...(Number.isFinite(options.database) && options.database !== undefined
      ? [["SELECT", String(options.database)]]
      : []),
    parts,
  ];

  return new Promise<unknown>((resolve, reject) => {
    const socket = net.createConnection({
      host: options.host,
      port: options.port,
    });
    let buffer = Buffer.alloc(0);
    let commandIndex = 0;
    let settled = false;

    function finish(error?: Error, value?: unknown) {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    }

    socket.setTimeout(5000);
    socket.on("timeout", () => finish(new Error("Redis command timed out")));
    socket.on("error", (error) => finish(error));
    socket.on("connect", () => {
      socket.write(encodeCommand(commands[commandIndex]));
    });
    socket.on("data", (chunk) => {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      buffer = Buffer.concat([buffer, data]);

      try {
        const value = parseRedisResponse(buffer);
        if (value === undefined) return;

        buffer = Buffer.alloc(0);
        commandIndex += 1;

        if (commandIndex < commands.length) {
          socket.write(encodeCommand(commands[commandIndex]));
        } else {
          finish(undefined, value);
        }
      } catch (error) {
        finish(error instanceof Error ? error : new Error("Redis parse failed"));
      }
    });
  });
}

export async function redisCommand(...parts: string[]) {
  return sendRawCommand(parts);
}
