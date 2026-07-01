export function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}

export function jsonData<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      data,
      requestId: createRequestId(),
    },
    init,
  );
}

export function jsonError(
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  },
  init?: ResponseInit,
) {
  return Response.json(
    {
      error,
      requestId: createRequestId(),
    },
    init,
  );
}
