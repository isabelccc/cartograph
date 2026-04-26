/** Align plugin sources with core-api request context (R-NF-2). */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId: string | null;
    }
  }
}

export {};
