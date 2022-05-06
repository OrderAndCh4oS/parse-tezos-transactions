import fetch from 'node-fetch';
import {promises as fs} from 'fs';
import {setTimeout} from 'timers/promises';

const addresses = ['tz1KySTBB8RXWVraggfXWLaLR9H3K3JBEbgt'];
(async() => {
    // await getReport();
    await getOperations();
})();

async function getOperations() {
    const searchParams = {quote: 'gbp'};
    const operations = [];
    while(true) {
        try {
            const {data, lastId} = await fetchOperations(searchParams);
            operations.push(...data);
            if(!lastId) break;
            searchParams['lastId'] = lastId;
        } catch(e) {
            console.log(e);
        }
        await setTimeout(50);
    }
    console.log(operations.length);
    await fs.writeFile('operations.json', JSON.stringify(operations));
}

async function fetchOperations(searchParams) {
    const response = await fetch(
        `https://api.tzkt.io/v1/accounts/${addresses[0]}/operations?${objktToSearchParams(
            searchParams
        )}`
    );
    const data = await response.json();
    const lastId = data.slice(-1)?.[0]?.id || null;
    return {data, lastId};
}

async function getReport() {
    const from = '2021-04-01';
    const to = '2021-12-01';
    const searchParams = {
        currency: 'gbp',
        historical: true,
        from,
        to
    };
    try {
        const response = await fetch(
            `https://api.tzkt.io/v1/accounts/${addresses[0]}/report?${objktToSearchParams(
                searchParams)}`
        );
        const data = await response.text();
        console.log(data);
    } catch(e) {
        console.log(e);
    }
}

function objktToSearchParams(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
}
