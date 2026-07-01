import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  try {
    const url = new URL(databaseUrl);
    return Boolean(url.hostname && url.hostname.toLowerCase() !== "host");
  } catch {
    return false;
  }
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
}

const globalForPrisma = globalThis as GlobalWithPrisma;

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
