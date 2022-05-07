import fetch from 'node-fetch';
import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {outDir, tzktUrl} from './constants.js';
import getTransactionsJson from './utilities/get-transactions-json.js';
import getOperationsJson from './utilities/get-operations-json.js';
import {setTimeout} from 'timers/promises';

(async() => {
    await getTransactions();
})();

/**
 *
 * @param {number | null} rateLimit
 */
async function getTransactions(rateLimit = null) {
    const transactionsDir = join(outDir, 'transactions');
    const transactionsPath = join(transactionsDir, 'transactions.json');

    if(!existsSync(transactionsDir)) {
        await fs.mkdir(transactionsDir);
    }

    const operations = getOperationsJson();
    let lastOperationHash;
    let transactions = [];
    let indexOfLastOperationHash = -1;

    if(existsSync(transactionsPath)) {
        transactions = await getTransactionsJson();
        if(transactions.length) {
            lastOperationHash = transactions[transactions.length - 1][0].hash;
            indexOfLastOperationHash = operations.findIndex(o => o.hash === lastOperationHash);
        }
    }

    let i = indexOfLastOperationHash + 1;
    const l = operations.length;

    for(; i < l; i++) {
        const operation = operations[i];
        try {
            const transaction = await fetchTransaction(operation.hash);
            await fs.writeFile(transactionsPath, `${JSON.stringify(transaction)},\n`, { flag: "a" });
            if(rateLimit) {
                await setTimeout(rateLimit);
            }
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
