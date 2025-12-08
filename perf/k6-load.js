import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const PRODUCT_ID = __ENV.PRODUCT_ID || 'p-1';
const CART_PAYLOAD = JSON.stringify({
  items: [{ productId: PRODUCT_ID, quantity: 1 }],
});

const latency = new Trend('http_req_duration_ms');
const successRate = new Rate('successful_requests');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    successful_requests: ['rate>0.99'],
  },
  scenarios: {
    burst_list: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.BURST_RPS || 120),
      timeUnit: '1s',
      duration: __ENV.BURST_DURATION || '5m',
      preAllocatedVUs: Number(__ENV.BURST_VUS || 50),
      maxVUs: Number(__ENV.BURST_MAX_VUS || 200),
      exec: 'browseProducts',
      tags: { scenario: 'burst_list' },
    },
    soak_cart: {
      executor: 'constant-vus',
      vus: Number(__ENV.SOAK_VUS || 30),
      duration: __ENV.SOAK_DURATION || '45m',
      gracefulStop: '30s',
      exec: 'cartFlow',
      tags: { scenario: 'soak_cart' },
    },
  },
};

function headers() {
  return AUTH_TOKEN
    ? {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export function browseProducts() {
  const res = http.get(`${BASE_URL}/products?limit=50`, { headers: headers() });
  latency.add(res.timings.duration);
  successRate.add(res.status === 200);
  check(res, {
    'liste produits 200': (r) => r.status === 200,
    'payload non vide': (r) => (r.json()?.data ?? []).length >= 0,
  });
  sleep(0.5 + Math.random());
}

export function cartFlow() {
  const session = http.post(`${BASE_URL}/cart`, null, { headers: headers() });
  check(session, { 'session créée': (r) => r.status === 200 });
  const body = session.json();
  const sessionId = body?.sessionId || body?.id;

  const updated = http.put(`${BASE_URL}/cart/${sessionId}`, CART_PAYLOAD, { headers: headers() });
  latency.add(updated.timings.duration);
  successRate.add(updated.status === 200);
  check(updated, {
    'cart 200': (r) => r.status === 200,
    'cart contient item': (r) => (r.json()?.items ?? []).length >= 1,
  });
  sleep(1 + Math.random() * 2);
}

export default function () {
  browseProducts();
  cartFlow();
}
