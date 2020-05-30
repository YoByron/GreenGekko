// **********************************************************************************
// *** T5cloudstrat.js                                                            ***
// **********************************************************************************
// * Purpose: A trading bot strategy to receive candles and advices from the 
// * Gekko Cloud infrastructure. The Gekko Cloud server is designed to add new 
// * possibilities for Gekko open source users. It is following the "give and take" 
// * principles by allowing strategy developers to share their trading signals into 
// * channels (without sharing any strategy code). Channel subscribers are able
// * to receive trading advices (and candles) in realtime for processing and
// * execution within their local bot strategies.
// * Writing and runnning a bot to publish trading signals will enable you to
// * subscribe to other community channels; give and take. Beside this "fair-use"
// * there will be instantly free and pay-per-use channels. The signal publisher
// * determines the channel type.
// *
// * This strategy showcases how to instantly execute Gekko Cloud advices.
// **********************************************************************************


const _ = require('lodash');
const moment = require('moment');
const util = require ('../core/util.js');
const dirs = util.dirs();
const log = require('../core/log.js');
const config = util.getConfig();

var cloudStrat = {};
var myPair = config.watch.asset.toLowerCase() + config.watch.currency.toLowerCase();
var myExchange = config.watch.exchange.toLowerCase();

cloudStrat.init = function () {
    this.name = 'T5 cloud strategy';
}


// ***************************************************************************
// * 1 Min. candle event
cloudStrat.onCandle = async function (candle) {
    //we receive this candle from the gekko core to build our own, local trading strategy
    //place your code here to calculate own indicators like rsi and macd
    //and combine with or confirm remote Gekko Cloud advices if needed.
    //subscribed remote advices are received in the function below: onRemoteAdvice
    //see T5
}


cloudStrat.onRemoteAdvice = function (radvice) {
    //instead of writing our own trading strategy, we take the remote advice
    //and use it for own trade execution
    
    var myPair = config.watch.asset.toLowerCase() + config.watch.currency.toLowerCase();
    var myExchange = config.watch.exchange.toLowerCase();

    log.info('We received a trading advice from the Gekko Cloud to go: ' + radvice.advice.recommendation);

    if (radvice.pair !== myPair) {
        log.info('The remote advice is for trading pair ' + radvice.pair + '. Local configuration is ' + myPair + '. Mismatch: Skip advice.');
        return;
    }

    if (radvice.exchange !== myExchange) {
        log.info('The remote advice is for exchange ' + radvice.exchange + '. Local exchange config is ' + myExchange + '. Mismatch: Skip advice.');
        return;
    }

    this.advice(radvice.advice);
}


cloudStrat.onRemoteCandle = function (rcandle) {
    //we could write our own stategy with 1M remotes candles here
    log.debug('Received remote candle:', rcandle.close);
}


cloudStrat.onRemoteOrderbook = function (ob) {
    //we could write our own stategy with remote orderbook snapshots here
    log.debug('Received remote Orderbook, best ask price:', ob.asks[0][0]);
}


cloudStrat.update = function (candle) {
    //no need for strat update, we work with onCandle custom batching 
}


cloudStrat.check = function (candle) {
   //no need for strat check, we work with onCandle custom batching and strat execution
}


module.exports = cloudStrat;
