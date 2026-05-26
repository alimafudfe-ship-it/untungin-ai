
import cron from 'node-cron';
import { runMarketScanner } from '../services/marketScanner';
export const startMarketScheduler=(deps)=>
 cron.schedule('0 */6 * * *',()=>runMarketScanner(deps.connectors,deps.cache));
