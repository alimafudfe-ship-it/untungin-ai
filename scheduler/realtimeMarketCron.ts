import cron from 'node-cron';
import { runShopeeRealtimeWorker } from '../workers/shopeeRealtimeWorker';

const keywords = ['sepatu','skincare','tas','fashion wanita','jam tangan'];

cron.schedule('*/15 * * * *', async () => {
  for (const keyword of keywords) {
    console.log('Scanning keyword:', keyword);
    await runShopeeRealtimeWorker(keyword);
  }
});
