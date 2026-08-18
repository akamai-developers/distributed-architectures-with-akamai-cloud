import { Order } from "./types";

export async function processOrder(_order: Order): Promise<void> {
  const delayMs = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
