import { processEmailQueue } from "./store";

export async function runEmailWorkerBatch(limit = 20) {
  return processEmailQueue(limit);
}
