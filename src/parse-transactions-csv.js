import {addresses, delegateAddresses} from './config.js';
import getTransactionsJson from './utilities/get-transactions-json.js';
import Papa from 'papaparse';
import {promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';

(async() => {
    await parseTransactionsCsv(addresses, delegateAddresses);
})();

/**
 *
 * @param {string[]} addresses
 * @param {string[]} delegateAddresses
 * @returns {Promise<void>}
 */
async function parseTransactionsCsv(addresses, delegateAddresses) {
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
        fields: ['operation', 'entrypoint', 'targetAlias', 'targetContract', 'tokenId', 'fa2', 'value', 'royalties', 'editions'],
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
                '???',
                transaction.diffs[0].content.value.price,
                null,
                null
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
                '???',
                transaction.diffs?.[0].content.value.price,
                transaction.diffs?.[0].content.value.royalties,
                transaction.diffs?.[0].content.value.objkt_amount

            );
        case 'swap':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.parameter?.value.objkt_id,
                '???',
                transaction.parameter?.value.xtz_per_objkt,
                transaction.parameter?.value.royalties,
                transaction.parameter?.value.objkt_amount,
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
                transaction.parameter?.value.price,
                transaction.parameter.value.royalties,
                transaction.parameter.value.amount
            );
        default:
            if(transaction.parameter?.entrypoint)
                console.log(transaction.parameter?.entrypoint);
            return null;
    }
}

function makeTokenSet(operation, entrypoint, targetAlias, targetContract, tokenId, fa2, value, royalties, editions) {
    return [operation, entrypoint, targetAlias, targetContract, tokenId, fa2, value, royalties, editions];
}
