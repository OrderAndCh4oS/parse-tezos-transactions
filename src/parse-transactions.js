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
    console.log(transactions[0]);
    const operationGroup = transactions[0];
    console.log('++++++++++')
    console.log('++++++++++')
    console.log('++++++++++')
    console.log('++++++++++')
    for(const transaction of operationGroup) {
        console.log(transaction.parameter || 'No parameter');
        if(transaction.diffs) {
            for(const diff of transaction?.diffs) {
                console.dir(diff, {depth: null});
            }
        } else {
            console.log('No diffs')
        }
        console.log('------------')
    }

}
