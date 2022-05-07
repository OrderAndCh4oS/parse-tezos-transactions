import {join} from 'path';
import {outDir} from '../constants.js';
import getJson from './get-json.js';

export default async function getOperationsJson() {
    const path = join(outDir, 'operations', 'operations.json');
    return await getJson(path);
}
