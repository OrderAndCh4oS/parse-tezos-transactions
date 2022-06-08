import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';
import {addresses} from './config.js';
import Papa from 'papaparse';
import getTransactionsCsv from './utilities/get-transactions-csv.js';
import getOperationsCsv from './utilities/get-operations-csv.js';
import crypto from 'crypto';

(async() => {
    await createCombinedCsv(addresses);
})();

function hashArr(arr) {
    return crypto.createHash('md5').update(JSON.stringify(arr)).digest('hex');
}

function makeOperationRow(operation) {
    const arr = [
        operation.timestamp,
        operation.operation,
        operation.type,
        operation.currency,
        operation.amount,
        operation.fiatCurrency,
        operation.fiatAmount,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    ];

    const hash = hashArr(arr);
    return {hash, arr};
}

function makeCombinationRow(operation, transaction) {
    const arr = [
        operation.timestamp,
        operation.operation,
        operation.type,
        operation.currency,
        operation.amount,
        operation.fiatCurrency,
        operation.fiatAmount,
        transaction.operation,
        transaction.entrypoint,
        transaction.targetAlias,
        transaction.targetContract,
        transaction.tokenId,
        transaction.fa2,
        transaction.value,
        transaction.royalties,
        transaction.editions
    ];

    const hash = hashArr(arr);
    return {hash, arr};
}

/**
 *
 * @param {string[]} addresses
 * @returns {Promise<void>}
 */
async function createCombinedCsv(addresses) {
    let operations = await getOperationsCsv();
    let transactions = await getTransactionsCsv();
    const data = {};

    if(!operations) throw new Error('Failed to load operations.csv');
    if(!transactions) throw new Error('Failed to load transactions.csv');

    const sortByOperations = (a, b) => a.operation.localeCompare(b.operation);
    operations = operations.sort(sortByOperations);
    transactions = transactions.sort(sortByOperations);

    for(const operation of operations) {
        const matchingTransactions = transactions.filter(t => t.operation === operation.operation);
        if(!matchingTransactions.length) {
            const {hash, arr} = makeOperationRow(operation);
            data[hash] = arr;
            continue;
        }
        for(const transaction of matchingTransactions) {
            const {hash, arr} = makeCombinationRow(operation, transaction);
            data[hash] = arr;
        }
    }



    const csv = Papa.unparse({
        fields: [
            'timestamp',
            'operation',
            'type',
            'currency',
            'amount',
            'fiatCurrency',
            'fiatAmount',
            'operation',
            'entrypoint',
            'targetAlias',
            'targetContract',
            'tokenId',
            'fa2',
            'value',
            'royalties',
            'editions'
        ],
        data: Object.values(data).sort((a, b) => a[0].localeCompare(b[0]))
    });
    const combinedDir = join(outDir, 'combined');
    if(!existsSync(combinedDir)) {
        await fs.mkdir(combinedDir, {recursive: true});
    }
    const combinedCsv = join(combinedDir, 'combined.csv');
    await fs.writeFile(combinedCsv, csv);
}
