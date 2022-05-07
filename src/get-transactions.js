import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {setTimeout} from 'timers/promises';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';

(async() => {
    await getTransactions();
})();

async function getTransactions() {
    const operationsDir = join(outDir, 'operations');
    const operationsPath = join(operationsDir, 'operations.json');
    const transactionsDir = join(outDir, 'transactions');
    const transactionsPath = join(transactionsDir, 'transactions.json');

    if(!existsSync(transactionsDir)) {
        await fs.mkdir(transactionsDir);
    }

    const operationsJson = await fs.readFile(operationsPath, 'utf8')
    const operations = JSON.parse(operationsJson);

    let lastOperationHash;
    let transactions = [];
    let indexOfLastOperationHash = -1;

    if(existsSync(transactionsPath)) {
        const transactionsJson = await fs.readFile(transactionsPath, 'utf8')
        if(transactionsJson.length) {
            lastOperationHash = transactionsJson[transactionsJson.length - 1].hash
        }
        transactions = JSON.parse(await fs.readFile(transactionsPath));
        indexOfLastOperationHash = transactions.findIndex(o => o.hash === lastOperationHash)
    }

    let i = indexOfLastOperationHash + 1;
    const l = operations.length

    for(; i < l; i++) {
        const operation = operations[i];
        try {
            const transaction = await fetchTransaction(operation.hash);
            // console.dir(transaction.data[1].diffs, {depth: null});
            transactions.push(transaction);
        } catch(e) {
            console.log(e);
        }
    }

    await fs.writeFile(transactionsPath, JSON.stringify(transactions));
}

async function fetchTransaction(operationHash) {
    const operationsUrl = `${tzktUrl}/operations/transactions/${operationHash}`;
    const response = await fetch(operationsUrl);
    const data = await response.json();
    await setTimeout(50);
    return data;
}
