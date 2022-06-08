import {join} from 'path';
import {outDir} from '../constants.js';
import getCsv from './get-csv.js';

export default async function getTransactionsCsv() {
    const path = join(outDir, 'transactions', 'transactions.csv');
    return await getCsv(path);
}
