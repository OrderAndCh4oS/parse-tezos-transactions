import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {addresses} from './config.js';
import {outDir, tzktUrl} from './constants.js';

(async() => {
    const from = '2021-04-01';
    const to = '2021-12-01';
    await getReportsFor(addresses, from, to);
})();

/**
 *
 * @param {string[]} addresses
 * @param {string} from
 * @param {string} to
 * @param {string} currency
 * @returns {Promise<void>}
 */
async function getReportsFor(addresses, from, to, currency = 'gbp') {
    const searchParams = {
        from,
        to,
        currency,
        historical: true
    };

    const reportsDir = join(outDir, 'reports');

    if(!existsSync(reportsDir)) {
        await fs.mkdir(reportsDir, {recursive: true});
    }

    for(const address of addresses) {
        try {
            const paramsStr = objktToSearchParams(searchParams);
            const reportUrl = `${tzktUrl}/accounts/${address}/report?${paramsStr}`;
            const response = await fetch(reportUrl);
            const report = await response.text();
            const reportCsv = join(reportsDir, `${address}-report.csv`);
            await fs.writeFile(reportCsv, report);
        } catch(e) {
            console.log(e);
        }
    }
}

function objktToSearchParams(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
}
