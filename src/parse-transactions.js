import {addresses, delegateAddresses} from './config.js';
import getTransactionsJson from './utilities/get-transactions-json.js';

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

    const transactionData = [];

    for(const operationGroup of transactions) {
        for(const transaction of operationGroup) {
            const data = handlerSwitch(transaction);
            if(data) transactionData.push(data);
        }
    }

    console.log(transactionData);
}

function getFxHashContract(transaction) {
    return transaction.diffs[0].content.value.gentk.version === '1'
        ? 'v1 fxhash contract'
        : 'v2 fxhash contract';
}

function makeTokenSet(operation, entrypoint, targetAlias, contract, tokenId) {
    return {operation, entrypoint, targetAlias, contract, tokenId};
}

function handlerSwitch(transaction) {
    switch(transaction.parameter?.entrypoint) {
        case 'listing_accept':
            console.log(transaction.storage);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs[0].content.value.gentk.id
            )
        case 'collect':
            // console.log(transaction);
            // console.log(transaction.diffs[0]);
            // process.exit(0);
            return makeTokenSet(
                transaction.hash,
                transaction.parameter?.entrypoint,
                transaction.target.alias,
                transaction.target.address,
                transaction.diffs?.[0].content.value.objkt_id || '???',
            );
        default:
            if(transaction.parameter?.entrypoint)
                console.log(transaction.parameter?.entrypoint);
            return null;
    }
}
