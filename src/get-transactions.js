import fetch from 'node-fetch';
import {promises as fs} from 'fs';
import {setTimeout} from 'timers/promises';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';

(async() => {
    await getTransactions();
})();

async function getTransactions() {
    const operationsDir = join(outDir, 'operations');
    const operationsJson = join(operationsDir, 'operations.json');
    const transactionsJson = join(operationsDir, 'transactions.json');

    const operations = JSON.parse(
        await fs.readFile(new URL(operationsJson, import.meta.url))
    );

    const transactions = [];
    for(const operation of operations) {
        try {
            const transaction = await fetchTransaction(operation.hash);
            // console.dir(transaction.data[1].diffs, {depth: null});
            transactions.push(transaction);
        } catch(e) {
            console.log(e);
        }
    }

    await fs.writeFile(transactionsJson, JSON.stringify(transactions));
}

async function fetchTransaction(operationHash) {
    const operationsUrl = `${tzktUrl}/operations/transactions/${operationHash}`;
    const response = await fetch(operationsUrl);
    const data = await response.json();
    await setTimeout(50);
    return data;
}
