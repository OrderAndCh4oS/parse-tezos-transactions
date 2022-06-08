import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';
import {addresses} from './config.js';
import {setTimeout} from 'timers/promises';

(async() => {
    await getOperations(addresses);
})();

/**
 *
 * @param {string[]} addresses
 * @param {number | null} rateLimit
 * @returns {Promise<void>}
 */
async function getOperations(addresses, rateLimit = null) {
    const searchParams = {quote: 'gbp'};
    const operations = [];
    for(const address of addresses) {
        while(true) {
            try {
                const {
                    data,
                    lastId
                } = await fetchOperations(address, searchParams);
                operations.push(...({address, data}));
                if(!lastId) break;
                searchParams['lastId'] = lastId;
            } catch(e) {
                console.log(e);
            }
            if(rateLimit) {
                await setTimeout(50);
            }
        }
    }


    const operationsDir = join(outDir, 'operations');
    if(!existsSync(operationsDir)) {
        await fs.mkdir(operationsDir, {recursive: true});
    }
    const operationsJson = join(operationsDir, 'operations.json');
    await fs.writeFile(operationsJson, JSON.stringify(operations));
}

async function fetchOperations(address, searchParams) {
    const paramsStr = objktToSearchParams(searchParams);
    const operationsUrl = `${tzktUrl}/accounts/${address}/operations?${paramsStr}`;
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
