import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';
import {setTimeout} from 'timers/promises';

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

    const operationsJson = await fs.readFile(operationsPath, 'utf8');
    const operations = JSON.parse(operationsJson);

    let lastOperationHash;
    let transactions = [];
    let indexOfLastOperationHash = -1;

    if(existsSync(transactionsPath)) {
        const transactionsStr = await fs.readFile(transactionsPath, 'utf8');
        transactions = JSON.parse(`[${transactionsStr.slice(0, -2)}]`);
        if(transactions.length) {
            lastOperationHash = transactions[transactions.length - 1][0].hash;
            indexOfLastOperationHash = operations.findIndex(o => o.hash === lastOperationHash);
        }
    }

    let i = indexOfLastOperationHash + 1;
    const l = operations.length;

    for(; i < l; i++) {
        console.log('iter', i, l);
        const operation = operations[i];
        try {
            const transaction = await fetchTransaction(operation.hash);
            await fs.writeFile(transactionsPath, `${JSON.stringify(transaction)},\n`, { flag: "a" });
            await setTimeout(5);
        } catch(e) {
            console.log(e);
        }
    }

}

async function fetchTransaction(operationHash) {
    const operationsUrl = `${tzktUrl}/operations/transactions/${operationHash}`;
    const response = await fetch(operationsUrl);
    return await response.json();
}
