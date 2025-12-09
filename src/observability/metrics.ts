import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

export interface RequestWithId extends Request {
  requestId?: string;
}

type RequestWithRoute = Omit<RequestWithId, 'route'> & {
  route?: { path?: string };
};

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: 'api_core_' });

const httpHistogram = new client.Histogram({
  name: 'api_core_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

const httpCounter = new client.Counter({
  name: 'api_core_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

export function metricsMiddleware(
  req: RequestWithRoute,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();
  const routeFromHandler =
    typeof req.route?.path === 'string' ? req.route.path : undefined;
  const route = routeFromHandler ?? req.path ?? 'unknown';

  res.on('finish', () => {
    const diff = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = { method: req.method, route, status: `${res.statusCode}` };
    httpHistogram
      .labels(labels.method, labels.route, labels.status)
      .observe(diff);
    httpCounter.labels(labels.method, labels.route, labels.status).inc();
  });

  next();
}

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.length > 0
      ? incoming
      : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export async function metricsHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
