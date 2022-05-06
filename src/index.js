import fetch from 'node-fetch';
import {promises as fs} from 'fs';
import {setTimeout} from 'timers/promises';
import { readFile } from 'fs/promises';

const addresses = ['tz1KySTBB8RXWVraggfXWLaLR9H3K3JBEbgt'];
// separate your 
const staking_payout_addresses = ['tz1W1en9UpMCH4ZJL8wQCh8JDKCZARyVx2co']; // everstake

(async() => {
    // await getReport();
    await getOperations();
	const json = JSON.parse(
	  await readFile(
		new URL('./operations.json', import.meta.url)
	  )
	);
	await parseOperationsToCSV(json)
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

async function parseOperationsToCSV (json) {
	let csv = 'Timestamp (UTC), Type, Base Currency, Base Amount, Quote Currency, Quote Amount \r\n'
	for (let row of json) {
		const { timestamp, type, initiator, sender, target, quote, amount } = row
		const tez = amount / 1000000
		let transactionType = 'unsure'
		// figure out the type of operation | buy, sell, transfer-in, transfer out
		// for sale, initiator != addresses && target.address
		// if there's no initiator it's direct funds transfer
		if (!addresses.includes(initiator?.address) && addresses.includes(target?.address)) transactionType = 'sale'
		if (addresses.includes(initiator?.address) && !addresses.includes(target?.address)) transactionType = 'buy'
		if (staking_payout_addresses.includes(sender?.address)) transactionType = 'staking reward'
		if (!staking_payout_addresses.includes(sender?.address) && !initiator && !addresses.includes(target?.address)) transactionType = 'payment'
		
		csv += `${timestamp}, ${transactionType}, XTZ, ${tez}, GBP, ${tez * quote.gbp} \r\n`
	}
	await fs.writeFile('operations.csv', csv);
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
