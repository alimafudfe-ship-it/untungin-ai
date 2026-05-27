
import cron from 'node-cron'

cron.schedule('*/5 * * * *', async () => {
  console.log('Realtime ingestion running...')
})

console.log('Realtime scheduler active')
