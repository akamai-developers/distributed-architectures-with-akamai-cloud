// Order type + validation.
//
// NOTE: This is intentionally duplicated from the `order-processor` app.
// For this demo we prefer a little duplication over sharing a package across
// two very different runtimes (Node worker vs. Spin/Wasm component).
export interface Order {
  id: string; // pattern: order-\d+
  customerId: string;
  total: number;
}

export function isOrder(obj: unknown): obj is Order {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o['id'] === 'string' &&
    /^order-\d+$/.test(o['id']) &&
    typeof o['customerId'] === 'string' &&
    o['customerId'].length > 0 &&
    typeof o['total'] === 'number'
  );
}
