import { Hono } from 'hono';
import { fire } from 'hono/service-worker';
import type { Context } from 'hono';
import { type AppEnv, configMiddleware } from './config';
import { isOrder } from './types';
import { submitOrder, getMetrics, nukeMetrics } from './store';

const app = new Hono<AppEnv>();


app.use('/api/*', configMiddleware);

app.post('/api/orders', async (c: Context<AppEnv>) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }

  if (!isOrder(body)) {
    return c.json(
      {
        error:
          'Invalid order. Expected { Id: "order-<n>", CustomerId: string, Total: number }',
      },
      400,
    );
  }

  const order = body;
  const messageId = submitOrder(c.get('config'), order);

  console.log(`Order ${order.id} (Total: ${order.total}) has been submitted`);

  return c.json({ status: 'accepted', messageId, order }, 202);
});

app.get('/api/metrics', (c: Context<AppEnv>) => {
  return c.json(getMetrics(c.get('config')));
});

app.delete('/api/metrics', (c: Context<AppEnv>) => {
  nukeMetrics(c.get('config'))
  c.status(204);
  return c.body(null);
});

app.notFound((c: Context<AppEnv>) => {
  return c.json({ error: 'Not Found' }, 404);
});

fire(app, { fetch: undefined });
