import cron from 'node-cron';

export function startMarketScanner() {
  cron.schedule('0 * * * *', async () => {
    console.log('Running hourly market scan...');
  });
}
