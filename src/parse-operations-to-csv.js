import {promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';
import {addresses, delegateAddresses} from './config.js';

(async() => {
    await parseOperationsToCsv(addresses, delegateAddresses)
})();

async function parseOperationsToCsv (addresses, delegateAddresses) {
    const operationsDir = join(outDir, 'operations');
    const operationsJson = join(operationsDir, 'operations.json');
    const operationsCsv = join(operationsDir, 'operations.csv');

    const json = JSON.parse(
        await fs.readFile(new URL(operationsJson, import.meta.url))
    );

    let csv = 'Timestamp (UTC), Type, Base Currency, Base Amount, Quote Currency, Quote Amount \r\n'
    for (let row of json) {
        const { timestamp, type, initiator, sender, target, quote, amount } = row
        const tez = amount / 1e6
        // figure out the type of operation | buy, sell, transfer-in, transfer out
        // for sale, initiator != addresses && target.address
        // if there's no initiator it's direct funds transfer
        let transactionType = getTransactionType(addresses, delegateAddresses, initiator, target, sender);

        csv += `${timestamp}, ${transactionType}, XTZ, ${tez}, GBP, ${tez * quote.gbp} \r\n`
    }
    await fs.writeFile(operationsCsv, csv);
}

function getTransactionType(addresses, delegateAddresses, initiator, target, sender) {
    switch(true) {
        case isSale(addresses, initiator, target):
            return 'sale'
        case isPurchase(addresses, initiator, target):
            return 'purchase'
        case isStakingReward(sender):
            return 'staking_reward'
        case isPayment(initiator, addresses, target):
            return 'staking_reward'
        default:
            return 'unsure'
    }
}

function isSale(addresses, initiator, target) {
    // Todo: check if both clauses required with the switch
    return !addresses.includes(initiator?.address) &&
        addresses.includes(target?.address);
}

function isPurchase(addresses, initiator, target) {
    // Todo: check if both clauses required with the switch
    return addresses.includes(initiator?.address) &&
        !addresses.includes(target?.address);
}

function isStakingReward(sender) {
    return delegateAddresses.includes(sender?.address);
}

function isPayment(initiator, addresses, target) {
    return !initiator && !addresses.includes(target?.address);
}
