import { Queue, Worker } from "bullmq"

export const syncQueue = new Queue("marketplace-sync", {
  connection: {
    url: process.env.REDIS_URL
  }
})

new Worker(
  "marketplace-sync",
  async job => {
    console.log("Processing sync:", job.data)
  },
  {
    connection: {
      url: process.env.REDIS_URL
    }
  }
)
