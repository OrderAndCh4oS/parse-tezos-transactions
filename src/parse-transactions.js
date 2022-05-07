import {addresses, delegateAddresses} from './config.js';
import getTransactionsJson from './utilities/get-transactions-json.js';
import Papa from 'papaparse';
import {promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';

(async() => {
    await parseTransactions(addresses, delegateAddresses);
})();

/**
 *
 * @param {string[]} addresses
 * @param {string[]} delegateAddresses
 * @returns {Promise<void>}
 */
async function parseTransactions(addresses, delegateAddresses) {
    const transactions = await getTransactionsJson();
    const transactionsCsv = join(outDir, 'transactions', 'transactions.csv');
    const data = [];

    for(const operationGroup of transactions) {
        for(const transaction of operationGroup) {
            const tokenData = handlerSwitch(transaction);
            if(tokenData) data.push(tokenData);
        }
    }
    const csv = Papa.unparse({
        fields: ['operation', 'entrypoint', 'targetAlias', 'targetContract', 'tokenId', 'fa2'],
        data
    })

    await fs.writeFile(transactionsCsv, csv);
}

function handlerSwitch(transaction) {
    switch(transaction.parameter?.entrypoint) {
        case 'listing_accept':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs[0].content.value.gentk.id,
                '???'
            )
        case 'collect':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id,
                '???'
            );
        case 'ask':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.parameter?.value.objkt_id,
                transaction.parameter?.value.fa2,
            );
        default:
            if(transaction.parameter?.entrypoint)
                console.log(transaction.parameter?.entrypoint);
            return null;
    }
}

function makeTokenSet(operation, entrypoint, targetAlias, targetContract, tokenId, fa2) {
    return [operation, entrypoint, targetAlias, targetContract, tokenId, fa2];
}
