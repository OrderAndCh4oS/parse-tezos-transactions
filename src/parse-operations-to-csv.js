import {promises as fs} from 'fs';
import {join} from 'path';
import {outDir} from './constants.js';
import {addresses, delegateAddresses} from './config.js';
import Papa from 'papaparse';
import getOperationsJson from './utilities/get-operations-json.js';

(async() => {
    await parseOperationsToCsv(addresses, delegateAddresses);
})();

function makeRow(
    timestamp, operationHash, transactionType, fromCurrency, xtz, toCurrency, fiatValue
) {
    return [
        timestamp,
        operationHash,
        transactionType,
        fromCurrency,
        xtz,
        toCurrency,
        fiatValue
    ];
}

/**
 *
 * @param {string[]} addresses
 * @param {string[]} delegateAddresses
 * @returns {Promise<void>}
 */
async function parseOperationsToCsv(addresses, delegateAddresses) {
    const operationsDir = join(outDir, 'operations');

    const operations = await getOperationsJson();

    const operationsCsv = join(operationsDir, 'operations.csv');
    let data = [];
    for(let operation of operations) {
        const {
            hash,
            timestamp,
            type,
            initiator,
            sender,
            target,
            quote,
            amount
        } = operation;

        const xtz = amount / 1e6;
        const fiatValue = xtz * quote.gbp;
        const transactionType = getTransactionType(
            addresses,
            delegateAddresses,
            initiator,
            target,
            sender
        );

        data.push(
            makeRow(timestamp, hash, transactionType, 'XTZ', xtz, 'GBP', fiatValue)
        );
    }
    const csv = Papa.unparse({
        fields: [
            'timestamp',
            'operation',
            'type',
            'currency',
            'amount',
            'fiatCurrency',
            'fiatAmount'
        ],
        data
    })
    await fs.writeFile(operationsCsv, csv);
}

function getTransactionType(addresses, delegateAddresses, initiator, target, sender) {
    switch(true) {
        case isSale(addresses, initiator, target):
            return 'sale';
        case isPurchase(addresses, initiator, target):
            return 'purchase';
        case isStakingReward(sender):
            return 'staking_reward';
        case isPayment(initiator, addresses, target):
            return 'staking_reward';
        default:
            return 'unsure';
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
