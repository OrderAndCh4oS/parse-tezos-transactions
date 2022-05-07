import {join} from 'path';
import {outDir} from '../constants.js';
import {promises as fs} from 'fs';

export default async function getTransactionsJson() {
    const transactionsPath = join(outDir, 'transactions', 'transactions.json');
    const transactionsStr = await fs.readFile(transactionsPath, 'utf-8');
    return JSON.parse(`[${transactionsStr.slice(0, -2)}]`);
}
