import {existsSync, promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';
import {addresses} from './config.js';
import Papa from 'papaparse';
import getTransactionsCsv from './utilities/get-transactions-csv.js';
import getOperationsCsv from './utilities/get-operations-csv.js';

(async() => {
    await createCombinedCsv(addresses);
})();

function makeOperationRow(operation) {
    return [
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
        null
    ];
}

function makeCombinationRow(operation, transaction) {
    return [
        operation.timestamp,
        operation.operation,
        operation.type,
        operation.currency,
        operation.amount,
        operation.fiatCurrency,
        operation.fiatAmount,
        transaction.entrypoint,
        transaction.targetAlias,
        transaction.targetContract,
        transaction.tokenId,
        transaction.fa2,
        transaction.value,
        transaction.royalties,
        transaction.editions
    ];
}

/**
 *
 * @param {string[]} addresses
 * @returns {Promise<void>}
 */
async function createCombinedCsv(addresses) {
    let operations = await getOperationsCsv();
    let transactions = await getTransactionsCsv();
    const data = [];

    if(!operations) throw new Error('Failed to load operations.csv');
    if(!transactions) throw new Error('Failed to load transactions.csv');

    const sortByOperations = (a, b) => a.operation.localeCompare(b.operation);
    operations = operations.sort(sortByOperations);
    transactions = transactions.sort(sortByOperations);

    for(const operation of operations) {
        const matchingTransactions = transactions.filter(t => t.operation === operation.operation);
        if(!matchingTransactions.length) {
            data.push(makeOperationRow(operation));
            continue;
        }
        for(const transaction of matchingTransactions) {
            data.push(makeCombinationRow(operation, transaction));
        }
    }

    const csv = Papa.unparse({
        fields: [
            'Timestamp (UTC)',
            'Operation',
            'Type',
            'Base Currency',
            'Base Amount',
            'Quote Currency',
            'Quote Amount',
            'Entrypoint',
            'Target Alias',
            'Target Contract',
            'Token ID',
            'Token FA2',
            'Token Editions',
            'Transaction Value',
            'Transaction Royalties'
        ],
        data: data.sort((a, b) => a[0].localeCompare(b[0]))
    });
    const combinedDir = join(outDir, 'combined');
    if(!existsSync(combinedDir)) {
        await fs.mkdir(combinedDir, {recursive: true});
    }
    const combinedCsv = join(combinedDir, 'combined.csv');
    await fs.writeFile(combinedCsv, csv);
}
