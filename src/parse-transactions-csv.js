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
            const tokenData = transactionParameterSwitch(transaction, addresses);
            if(tokenData) data.push(tokenData);
        }
    }
    const csv = Papa.unparse({
        fields: [
            'operation',
            'entrypoint',
            'targetAlias',
            'targetContract',
            'tokenId',
            'fa2',
            'value',
            'royalties',
            'editions'],
        data
    });

    await fs.writeFile(transactionsCsv, csv);
}

// Todo: Create contract/marketplace switch

function logAndExit(transaction) {
    console.dir(transaction, {depth: null});
    process.exit(0);
}

// Todo: One of these switches per contract
function transactionParameterSwitch(transaction, addresses) {
    // Todo: We're only handling named entrypoint transactions. Parameter is undefined on many.
    //       Will need to workout how to identify them and pull out anything useful, eg possibly royalty values
    switch(transaction.parameter?.entrypoint) {
        case 'listing_accept':
            // logAndExit(transaction);
            return makeFxHashListingAcceptRow(transaction);
        case 'collect':
            // logAndExit(transaction);
            // Todo: handle multiple endpoints
            return makeFxHashCollectRow(transaction);
        case 'swap':
            // logAndExit(transaction);
            return makeHenSwapRow(transaction);
        case 'ask':
            // logAndExit(transaction);
            return makeObjktAskRow(transaction);
        case 'fulfill_bid':
            // logAndExit(transaction);
            return makeObjktFulfillBidRow(transaction);
        case 'fulfill_ask':
            // logAndExit(transaction);
            return makeObjktFulfillAskRow(transaction, addresses);
        case 'conclude_auction':
            // logAndExit(transaction);
            return makeObjktConcludeAuctionRow(transaction);
        case 'cancel_swap':
            // logAndExit(transaction);
            // Todo: handle multiple endpoints
            // return makeHenCancelSwapRow(transaction);
            return null;
        case 'mint_OBJKT':
            // logAndExit(transaction);
            // return makeObjktMintRow(transaction);
            return null;
        case 'bid':
            // logAndExit(transaction);
            // Todo: handle multiple endpoints
            return makeObjktBidRow(transaction);
        case 'buy':
            // logAndExit(transaction);
            // Todo: Handle Objkt auction buy endpoint
            return make8BidouBuyRow(transaction);
        case 'trade_in':
            // logAndExit(transaction);
            // return makePirateTradeInRow(transaction);
            return null;
        case 'collect_swap':
            // logAndExit(transaction);
            return makeVersumCollectSwapRow(transaction);
        case 'fulfill_offer':
            // logAndExit(transaction);
            return makeObjktFulfillOfferRow(transaction, addresses);
        case 'pay_royalties_xtz':
            // logAndExit(transaction);
            return makeVersumPayRoyaltiesRow(transaction);
        case 'batch_fwd_xtz':
            // logAndExit(transaction);
            return makeVersumBatchFwdXtxRow(transaction);
        case 'create_swap':
            // logAndExit(transaction);
            return makeVersumCreateSwapRow(transaction);
        case 'offer':
            // logAndExit(transaction);
            return makeObjktOfferRow(transaction, addresses);
        case 'mintFromCrowdsale':
            // logAndExit(transaction);
            return makeDogamiMintRow(transaction);
        case 'accept_offer':
            // logAndExit(transaction);
            return makeVersumAcceptOfferRow(transaction);
        case 'claim_materia':
            // logAndExit(transaction);
            return null;
            // return makeVersumClaimMateriaRow(transaction);
        case 'match_orders':
            // Todo: extract data
            // logAndExit(transaction);
            return null;
            // return makeRow(
            //     ...makeGenericData(transaction),
            //     null, // token id
            //     null, // contract address
            //     transaction.parameter.value.order_left.take_asset.asset_value, // value
            //     null, // royalties
            //     null, // amount of tokens
            // );
        case 'tokenToTezPayment':
            // Todo: figure out what to do with QuipuSwap transfers
            // logAndExit(transaction);
            return null;
            // return makeRow(
            //     ...makeGenericData(transaction),
            //     null, // token id
            //     null, // contract address
            //     null, // value
            //     null, // royalties
            //     null, // amount of tokens
            // );
        case 'tezToTokenPayment':
            // Todo: figure out what to do with QuipuSwap transfers
            // logAndExit(transaction);
            return null;
            // return makeRow(
            //     ...makeGenericData(transaction),
            //     null, // token id
            //     null, // contract address
            //     null, // value
            //     null, // royalties
            //     null, // amount of tokens
            // );
        case 'sell':
            // logAndExit(transaction);
            return makeUnknownSellTokenSet(transaction);
        case 'x': // Template
            // Note: Template
            logAndExit(transaction);
            return makeRow(
                ...makeGenericData(transaction),
                null, // token id
                null, // contract address
                null, // value
                null, // royalties
                null, // amount of tokens
            );
        // Generic endpoint data
        case 'redeem':
        case 'claim_reverse_record':
        case 'default':
        case 'create_artist_collection':
        case 'update_profile':
        case 'put':
        case 'remove':
        case 'burn':
        case 'set_metadata':
        case 'update_operators_for_all':
        case 'update_issuer':
        case 'update_artist_metadata':
        case 'mint_artist':
        case 'cancel':
        case 'do_transfers':
        case 'match_and_transfer':
        case 'cancel_auction':
        case 'registry':
        case 'set_child_record':
        case 'create_auction':
        case 'claim_verification':
        case 'vote':
        case 'retract_ask':
        case 'update_record':
        case 'burn_supply':
        case 'execute':
        case 'curate':
        case 'commit':
        case 'update_reverse_record':
        case 'assignMetadata':
        case '_charge_materia': // Todo: should account for this, it's money out
        case 'claim_bees':
        case 'mint_issuer':
        case 'update_operators':
        case 'add':
        case 'hDAO_batch':
        case 'transfer': // Todo: could be useful for recipient data
        case 'mint': // Todo: could handle these to get token ids/royalties/supply
            // logAndExit(transaction);
            // return makeGenericRow(transaction);
            return null;
        default:
            if(transaction.parameter?.entrypoint)
                console.log(transaction.parameter?.entrypoint);
            // return makeGenericRow(transaction);
            return null;
    }
}

function makeRow(
    operation, entrypoint, targetAlias,
    targetContract, tokenId, fa2, value,
    royalties, editions
) {
    return [
        operation,
        entrypoint,
        targetAlias,
        targetContract,
        tokenId,
        fa2,
        value,
        royalties,
        editions
    ];
}

function makeGenericRow(transaction) {
    return makeRow([
        ...makeGenericData(transaction),
        null,
        null,
        null,
        null, // Note: these generics shouldn't contain shares or xtz transfer
        null
    ]);
}

/**
 *
 * @param transaction
 * @returns {[string, string, string, string]}
 */
function makeGenericData(transaction) {
    return [
        transaction.hash,
        transaction.parameter?.entrypoint,
        transaction.target.alias,
        transaction.target.address
    ];
}

function makeDogamiMintRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        getDogamiTokenIds(transaction),
        null,
        null,
        null, // Note: these generics shouldn't contain shares or xtz transfer
        null
    );
}

function makeObjktOfferRow(transaction, addresses) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.token?.token_id,
        transaction.diffs?.[0].content.value.token?.address,
        transaction.diffs?.[0].content.value.amount,
        getShareOfTransaction(
            transaction.diffs?.[0].content.value.shares,
            addresses
        ), // loop the shares and find matching addresses
        null
    );
}

function makeVersumCreateSwapRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.parameter?.value.token.nat,
        transaction.parameter?.value.token.address,
        null,
        null,
        null
    );
}

function makeVersumBatchFwdXtxRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        null,
        null,
        transaction.parameter?.value.receivers.amount,
        null,
        null
    );
}

function makeVersumPayRoyaltiesRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.parameter.value.token_id,
        null,
        null,
        null,
        null
    );
}

function makeObjktFulfillOfferRow(transaction, addresses) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.token_id,
        transaction.diffs?.[0].content.value.address,
        transaction.diffs?.[0].content.value.amount,
        getShareOfTransaction(
            transaction.diffs?.[0].content.value.shares,
            addresses
        ), // loop the shares and find matching addresses
        null
    );
}

function makeVersumCollectSwapRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.key.nat,
        transaction.diffs?.[0].content.key.address,
        transaction.diffs?.[0].content.ending_price_in_nat,
        null,
        null
    );
}

function makePirateTradeInRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.parameter.value.join,
        null,
        null,
        null,
        null
    );
}

function make8BidouBuyRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.nft_id,
        transaction.diffs?.[0].content.value.nft_contract_address,
        transaction.diffs?.[0].content.value.payment,
        transaction.diffs?.[0].content.value.royalties,
        null
    );
}

function makeObjktBidRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.objkt_id,
        transaction.diffs?.[0].content.value.fa2,
        transaction.diffs?.[0].content.value.xtz_per_objkt,
        transaction.diffs?.[0].content.value.royalties,
        null
    );
}

function makeObjktMintRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.storage?.objkt_id,
        transaction.storage?.objkt,
        null,
        transaction.parameter?.value.royalties,
        transaction.parameter?.value.amount
    );
}

function makeHenCancelSwapRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.objkt_id, // Todo: Could be multiple tokens here…
        transaction.diffs?.[0].content.value.fa2,
        null,
        null,
        transaction.diffs?.[0].content.value.objkt_amount
    );
}

function makeObjktConcludeAuctionRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.objkt_id,
        '???',
        transaction.diffs?.[0].content.value.current_price, // Todo: verify this…
        transaction.diffs?.[0].content.value.royalties,
        1 // Todo: verify this…
    );
}

function makeObjktFulfillAskRow(transaction, addresses) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.token?.token_id,
        transaction.diffs?.[0].content.value.token?.address,
        transaction.diffs?.[0].content.value.amount,
        getShareOfTransaction(
            transaction.diffs?.[0].content.value.shares, addresses), // loop the shares and find matching addresses
        transaction.diffs?.[0].content.value.editions
    );
}

function makeObjktFulfillBidRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.objkt_id,
        '???',
        transaction.diffs?.[0].content.value.xtz_per_objkt,
        transaction.diffs?.[0].content.value.royalties,
        transaction.diffs?.[0].content.value.objkt_amount
    );
}

function makeObjktAskRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.parameter?.value.objkt_id,
        transaction.parameter?.value.fa2,
        transaction.parameter?.value.price,
        transaction.parameter.value.royalties,
        transaction.parameter.value.amount
    );
}

function makeHenSwapRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.parameter?.value.objkt_id,
        '???',
        transaction.parameter?.value.xtz_per_objkt,
        transaction.parameter?.value.royalties,
        transaction.parameter?.value.objkt_amount
    );
}

function makeFxHashCollectRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs?.[0].content.value.objkt_id,
        '???',
        transaction.diffs?.[0].content.value.price,
        transaction.diffs?.[0].content.value.royalties,
        transaction.diffs?.[0].content.value.objkt_amount
    );
}

function makeFxHashListingAcceptRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs[0].content.value.gentk.id,
        '???',
        transaction.diffs[0].content.value.price,
        null,
        null
    );
}

function makeVersumAcceptOfferRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.diffs[0].content.value.token.nat,
        transaction.diffs[0].content.value.token.address,
        transaction.diffs[0].content.value.price_in_nat,
        null,
        transaction.diffs[0].content.value.token_amount
    );
}

function makeVersumClaimMateriaRow(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        null,
        null,
        transaction.parameter.value.amount + ' Materia',
        null,
        null
    );
}

function makeUnknownSellTokenSet(transaction) {
    return makeRow(
        ...makeGenericData(transaction),
        transaction.value?.sale_token_param_tez.token_for_sale_token_id, // token id
        transaction.value?.sale_token_param_tez.token_for_sale_address, // contract address
        transaction.value?.sale_price, // value
        null, // royalties
        null // amount of tokens
    );
}

function getShareOfTransaction(shares, addresses) {
    if(!shares?.length) return null;
    return shares.reduce((sum, share) =>
            addresses.includes(share?.recipient)
                ? sum + share.amount
                : sum,
        0);
}

function getDogamiTokenIds(transaction) {
    return transaction.diffs.filter(d => d.content.path === 'name_list')
        .map(d => d.content.key)
        .join(', ');
}
