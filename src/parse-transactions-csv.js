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
    // Todo: We're only handling named entrypoint transactions. Parameter is undefined on many.
    //       Will need to workout how to identify them and pull out anything useful, eg possibly royalty values
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
        case 'fulfill_bid':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id,
                '???',
                transaction.diffs?.[0].content.value.xtz_per_objkt,
                transaction.diffs?.[0].content.value.royalties,
                transaction.diffs?.[0].content.value.objkt_amount,
            );
        case 'fulfill_ask':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.token?.token_id,
                transaction.diffs?.[0].content.value.token?.address,
                transaction.diffs?.[0].content.value.amount,
                transaction.diffs?.[0].content.value.shares?.[0].amount, // Todo: this is wrong, need to loop the shares and find matching addresses
                transaction.diffs?.[0].content.value.editions,
            );
        case 'conclude_auction':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id,
                '???',
                transaction.diffs?.[0].content.value.current_price, // Todo: verify this…
                transaction.diffs?.[0].content.value.royalties,
                1, // Todo: verify this…
            );
        case 'transfer':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.key.nat, // Todo: Could be multiple tokens here…
                null,
                null,
                null,
                null
            );
        case 'cancel_swap':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id, // Todo: Could be multiple tokens here…
                transaction.diffs?.[0].content.value.fa2,
                null,
                null,
                transaction.diffs?.[0].content.value.objkt_amount
            );
        case 'mint_OBJKT':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.storage.objkt_id,
                transaction.storage.objkt,
                null,
                transaction.parameter?.value.royalties,
                transaction.parameter?.value.amount
            );
        case 'mint':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            // Todo: Multiple marketplaces call a mint entrypoint with varying data
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                null,
                null,
                null,
                null,
                null
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
