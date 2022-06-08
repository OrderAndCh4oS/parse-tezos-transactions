import {join} from 'path';
import {outDir} from '../constants.js';
import getCsv from './get-csv.js';

export default async function getOperationsCsv() {
    const path = join(outDir, 'operations', 'operations.csv');
    return await getCsv(path);
}
