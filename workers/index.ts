import "./sourceWorker";
import "./scoringWorker";
import "./analyticsWorker";
import { startScheduler } from "./scheduler";

async function start() {
  console.log("🚀 Worker running...");
  await startScheduler();
}

start();
