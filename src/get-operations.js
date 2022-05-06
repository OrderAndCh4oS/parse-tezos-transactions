import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {setTimeout} from 'timers/promises';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';
import {addresses} from './config.js';

(async() => {
    await getOperations(addresses);
})();

async function getOperations(addresses) {
    const searchParams = {quote: 'gbp'};
    const operations = [];
    while(true) {
        try {
            const {
                data,
                lastId
            } = await fetchOperations(addresses, searchParams);
            operations.push(...data);
            if(!lastId) break;
            searchParams['lastId'] = lastId;
        } catch(e) {
            console.log(e);
        }
        await setTimeout(50);
    }

    const operationsDir = join(outDir, 'operations');
    if(!existsSync(operationsDir)) {
        await fs.mkdir(operationsDir, {recursive: true});
    }
    const operationsJson = join(operationsDir, 'operations.json');
    await fs.writeFile(operationsJson, JSON.stringify(operations));
}

async function fetchOperations(addresses, searchParams) {
    const paramsStr = objktToSearchParams(searchParams);
    const operationsUrl = `${tzktUrl}/accounts/${addresses[0]}/operations?${paramsStr}`;
    const response = await fetch(operationsUrl);
    const data = await response.json();
    const lastId = data.slice(-1)?.[0]?.id || null;
    return {data, lastId};
}

function objktToSearchParams(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
}