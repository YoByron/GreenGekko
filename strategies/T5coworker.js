// ****************************************************************************
// *** T5coworker.js                                                        ***
// ****************************************************************************
// * Purpose: strategy to automate manual trading advices in conjunction with
// * the telegram bot plugin. It does not contain any own strategy logic but 
// * follows remote advices from Gekko Cloud (set config).
// * When this strategy is run within a container and other strategies, it will
// * monitor manual settings to stop-losses and take-profits. The "normal"
// * gekko strategy will run side-by-side.
// * You can adjust these settings from inside the telegram bot dynamically   
// * whitout the need to restart gekko. This coworker strategy will monitor
// * and execute these settings when the price matches the "take profit"
// * or "stop loss" condition.
// ****************************************************************************


const _ = require('lodash');
const moment = require('moment');
const util = require ('../core/util.js');
const dirs = util.dirs();
const log = require('../core/log.js');
const config = util.getConfig();

var objcontext;
var stratCW = {};
var myPair = config.watch.asset.toLowerCase() + config.watch.currency.toLowerCase();
var myExchange = config.watch.exchange.toLowerCase();


stratCW.init = function (context) {
    if(context === undefined) {
        objcontext = this;
    } else {
        objcontext = context;
    }

    this.requiredHistory = objcontext.tradingAdvisor.historySize;
    this.intCandleSize = objcontext.tradingAdvisor.candleSize;
    this.candleCount = 0;
    this.name = 'T5 coworker strategy';
    
    objcontext.t5coworker = {
        slvalue: 0,
        tpvalue: 0
    };
}


// ***************************************************************************
// * 1 Min. candle event
stratCW.onCandle = async function (candle) {
    this.candleCount++;

    if (this.candleCount < this.requiredHistory*this.intCandleSize) {
        if (this.candleCount/10 % this.intCandleSize == 0) log.debug('T5coworker strategy warmup with history data:', this.candleCount/60, '/', this.requiredHistory*this.intCandleSize/60, ' (', this.requiredHistory*this.intCandleSize/60/24, 'days )');
        return;
    }

    //console.log('!!!!! T5coworker, OK, candle after warmup', this.candleCount, candle.close);
    
    if (objcontext.t5coworker.slvalue > 0 && candle.close < objcontext.t5coworker.slvalue) {
        objcontext.t5coworker.slvalue = 0;
        objcontext.advice({ direction: 'short', setTakerLimit: config[config.tradingAdvisor.method].setTakerLimit, setSellAmount: config[config.tradingAdvisor.method].setSellAmount, origin: 'T5coworker', date: moment(), infomsg: 'Manual stop-Loss condition was met, current price: ' + candle.close + '. The strategy T5coworker gave advice to go SHORT. Note: previous stop-loss setting is now deleted.' });
    }

    if (objcontext.t5coworker.tpvalue > 0 && candle.close > objcontext.t5coworker.tpvalue) {
        objcontext.t5coworker.tpvalue = 0;
        objcontext.advice({ direction: 'short', setTakerLimit: config[config.tradingAdvisor.method].setTakerLimit, setSellAmount: config[config.tradingAdvisor.method].setSellAmount, origin: 'T5coworker', date: moment(), infomsg: 'Manual take-Profit condition was met, current price: ' + candle.close + '. The strategy T5coworker gave advice to go LONG. Note: previous take-profit setting is now deleted.' });
    }
}


// ***************************************************************************
// * 1 Remote Orderbook from Gekko Cloud
stratCW.onRemoteOrderbook = async function (ob) {
    if (ob.pair == myPair && ob.exchange == myExchange) {
        let ask = Number(ob.orderbook.asks[0][0]);

        //in case orderbook price info is available, this event is faster than onCandle event
        if (objcontext.t5coworker.slvalue > 0 && ask < objcontext.t5coworker.slvalue) {
            objcontext.t5coworker.slvalue = 0;
            objcontext.advice({ direction: 'short', setTakerLimit: config[config.tradingAdvisor.method].setTakerLimit, setSellAmount: config[config.tradingAdvisor.method].setSellAmount, origin: 'T5coworker', date: moment(), infomsg: 'Manual stop-Loss condition was met, current price: ' + ask + '. The strategy T5coworker gave advice to go SHORT. Note: previous stop-loss setting is now deleted.' });
        }
    
        if (objcontext.t5coworker.tpvalue > 0 && ask > objcontext.t5coworker.tpvalue) {
            objcontext.t5coworker.tpvalue = 0;
            objcontext.advice({ direction: 'short', setTakerLimit: config[config.tradingAdvisor.method].setTakerLimit, setSellAmount: config[config.tradingAdvisor.method].setSellAmount, origin: 'T5coworker', date: moment(), infomsg: 'Manual take-Profit condition was met, current price: ' + ask + '. The strategy T5coworker gave advice to go LONG. Note: previous take-profit setting is now deleted.' });
        }
    }
}


// ***************************************************************************
// * receive our own or foreign advices, e.g. from telegram bot
// * we use the advice event here to share infos between plugins
stratCW.onAdvice = function (advice) {
    if (advice.origin === 'telegrambot' && advice.setconfig !== undefined) {
        if (advice.setconfig.slvalue !== undefined) objcontext.t5coworker.slvalue = advice.setconfig.slvalue;
        if (advice.setconfig.tpvalue !== undefined) objcontext.t5coworker.tpvalue = advice.setconfig.tpvalue;
    }
}


stratCW.onRemoteAdvice = function (radvice) {
    //instead of writing our own trading strategy, we take the remote advice
    //and use it for own trade execution

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


stratCW.onRemoteCandle = function (rcandle) {
    //we could write our own stategy with 1M remotes candles here
}


stratCW.update = function (candle) {
    //no need for strat update, we work with onCandle custom batching 
}


stratCW.check = function (candle) {
   //no need for strat check, we work with onCandle custom batching and strat execution
}


module.exports = stratCW;
