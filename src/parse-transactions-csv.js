import {addresses, delegateAddresses} from './config.js';
import getTransactionsJson from './utilities/get-transactions-json.js';
import Papa from 'papaparse';
import {promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';

const ignoredEndpoints = ['update_operators'];

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
            const tokenData = handlerSwitch(transaction, addresses);
            if(tokenData) data.push(tokenData);
        }
    }
    const csv = Papa.unparse({
        fields: ['operation', 'entrypoint', 'targetAlias', 'targetContract', 'tokenId', 'fa2', 'value', 'royalties', 'editions'],
        data
    })

    await fs.writeFile(transactionsCsv, csv);
}

function handlerSwitch(transaction, addresses) {
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
                getShareOfTransaction(transaction.diffs?.[0].content.value.shares, addresses), // loop the shares and find matching addresses
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
        case 'bid':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id,
                transaction.diffs?.[0].content.value.fa2,
                transaction.diffs?.[0].content.value.xtz_per_objkt,
                transaction.diffs?.[0].content.value.royalties,
                null
            );
        case 'buy':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.nft_id,
                transaction.diffs?.[0].content.value.nft_contract_address,
                transaction.diffs?.[0].content.value.payment,
                transaction.diffs?.[0].content.value.royalties,
                null
            );
        case 'trade_in':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.parameter.value.join,
                null,
                null,
                null,
                null
            );
        case 'collect_swap':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.key.nat,
                transaction.diffs?.[0].content.key.address,
                transaction.diffs?.[0].content.ending_price_in_nat,
                null,
                null
            );
        case 'fulfill_offer':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.token_id,
                transaction.diffs?.[0].content.value.address,
                transaction.diffs?.[0].content.value.amount,
                getShareOfTransaction(transaction.diffs?.[0].content.value.shares, addresses), // loop the shares and find matching addresses
                null
            );
        case 'pay_royalties_xtz':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.parameter.value.token_id,
                null,
                null,
                null,
                null
            );
        case 'batch_fwd_xtz':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                null,
                null,
                transaction.parameter?.value.receivers.amount,
                null,
                null
            );
        case 'create_swap':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.parameter?.value.token.nat,
                transaction.parameter?.value.token.address,
                null,
                null,
                null
            );
        case 'offer':
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
                getShareOfTransaction(transaction.diffs?.[0].content.value.shares, addresses), // loop the shares and find matching addresses
                null
            );
        // Generic endpoint data
        case '_charge_materia':
        case 'claim_bees':
        case 'mint_issuer':
        case 'update_operators':
        case 'add':
            // console.dir(transaction, {depth: null});
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                null,
                null,
                null,
                getShareOfTransaction(transaction.diffs?.[0].content.value.shares, addresses), // loop the shares and find matching addresses // Todo: this is wrong, need to loop the shares and find matching addresses
                null
            );
        default:
            if(transaction.parameter?.entrypoint)
                console.log(transaction.parameter?.entrypoint);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target?.alias,
                transaction.target?.address,
                null,
                null,
                null,
                null,
                null
            );
    }
}

function getShareOfTransaction (shares, addresses) {
    return [ ...(shares || []) ].reduce((prev, curr) => {
        if (addresses.includes(curr.recipient)) {
            prev += curr.amount
        }
        return prev
    }, 0)
}

function makeTokenSet(operation, entrypoint, targetAlias, targetContract, tokenId, fa2, value, royalties, editions) {
    return [operation, entrypoint, targetAlias, targetContract, tokenId, fa2, value, royalties, editions];
}
