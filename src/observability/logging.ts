import { NextFunction, Response } from 'express';
import type { RequestWithId } from './metrics';

export function loggingMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const entry = {
      level: 'info',
      msg: 'http_request',
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
      request_id: req.requestId ?? null,
      user_agent: req.headers['user-agent'],
      content_length: res.getHeader('content-length') ?? null,
    };

    console.log(JSON.stringify(entry));
  });

  next();
}
