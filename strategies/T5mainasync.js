// ****************************************************************************
// *** T5mainasync.js                                                       ***
// ****************************************************************************
// * Purpose: strategy to showcase effective indicator 
// * combinations using the tulib and talib libraries
// * Requirements: Async/await gekko core extension
// ****************************************************************************


const _ = require('lodash');
const util = require('util');
const log = require('../core/log.js');
const config = require ('../core/util.js').getConfig();
const candleBatcher = require('../core/candleBatcher');
const TEMA = require('../strategies/indicators/TEMA.js');
const TULIPASYNC = require('../strategies/indicators/TulipAsync.js');
const TALIBASYNC = require('../strategies/indicators/TalibAsync.js');
var obj;

var stratMain = {};


stratMain.init = function (context) {
    if(context === undefined) { 
        this.context = this;
    } else {
        this.context = context;
    }

    obj = this;
    this.name = 'T5mainasync';
    
    this.context.exposedMain = false;
    this.context.trendMain = {
        direction: 'none',
        duration: 0,
        persisted: false,
        adviced: false
    };

    this.cb60 = new candleBatcher(60);
    this.cb60.on('candle', this.onCandle60M);
    this.requiredHistory = this.context.tradingAdvisor.historySize;
    this.intCandleSize = this.context.tradingAdvisor.candleSize;

    this.RSIhigh = this.context.settings.thresholds.RSIhigh;
    this.RSIlow = this.context.settings.thresholds.RSIlow;
    this.MACDhigh = this.context.settings.thresholds.MACDhigh;
    this.MACDlow = this.context.settings.thresholds.MACDlow;
    this.TEMAmin = this.context.settings.thresholds.TEMAmin;
    this.persistance = this.context.settings.thresholds.persistance;

    const MACDSettings = this.context.settings.MACD;
    const EMAshortSettings = this.context.settings.EMAshort;
    const EMAlongSettings = this.context.settings.EMAlong;
    const STOCHSettings = this.context.settings.STOCH;
    const RSISettings = this.context.settings.RSI;

    this.macd60M = new TULIPASYNC({ indicator: 'macd', length: 500, candleinput: 'close', options:[ MACDSettings.optInFastPeriod, MACDSettings.optInSlowPeriod, MACDSettings.optInSignalPeriod ] });
    this.emashort60M = new TULIPASYNC({ indicator: 'ema', length: 500, candleinput: 'close', options:[ EMAshortSettings.optInTimePeriod ] });
    this.emalong60M = new TULIPASYNC({ indicator: 'ema', length: 500, candleinput: 'close', options:[ EMAlongSettings.optInTimePeriod ] });
    this.rsi60M = new TULIPASYNC({ indicator: 'rsi', length: 500, candleinput: 'close', options:[ RSISettings.optInTimePeriod ] });
    this.stoch60M = new TULIPASYNC({ indicator: 'stoch', length: 500, candleinput: 'high,low,close', options:[ STOCHSettings.optInFastKPeriod, STOCHSettings.optInSlowKPeriod, STOCHSettings.optInSlowDPeriod ] });
    this.mfi60M = new TALIBASYNC({ indicator: 'mfi', length: 5000, options: { optInTimePeriod: 14 } });
    this.tema60M = new TEMA({ weight: 440 });
    this.tema60M.count = 0;
}


// ***************************************************************************
// * 1 Min candles - candle batching
stratMain.onCandle = async function (candle) {
    this.cb60.write([candle]);
    this.cb60.flush();
}


// ***************************************************************************
// * 60 Min candles - strong market strat
stratMain.onCandle60M = async function (candle) { 
    obj.tema60M.update(candle.close);
    obj.tema60M.count++;
    await obj.update60M(candle);

    if (obj.tema60M.count < obj.requiredHistory) {
        if (obj.tema60M.count % 10 == 0) log.debug('Warmup indicators with history data:', obj.tema60M.count, '/', obj.requiredHistory, ' (', obj.intCandleSize*obj.requiredHistory/60/24, 'days )');
        return;
    }

    //check in uptrends only
    if ((obj.tema60M.trend > this.TEMAmin) || obj.exposedMain) {
        obj.check60M(candle);
    }       
}


// ***************************************************************************
// * 60 Min candles - update
stratMain.update60M = async function (candle) {
    this.macd60M.result = await this.macd60M.update(candle);
       this.macd60M.macd = this.macd60M.result[0]; 
    this.emashort60M.result = (await this.emashort60M.update(candle))[0];
    this.emalong60M.result = (await this.emalong60M.update(candle))[0];
    this.rsi60M.result = (await this.rsi60M.update(candle))[0];
    this.mfi60M.result = await this.mfi60M.update(candle);
    this.stoch60M.result = await this.stoch60M.update(candle);
       this.stoch60M.stochk = this.stoch60M.result[0];
       this.stoch60M.stochd = this.stoch60M.result[1];
}


// ***************************************************************************
// * 60 Min candles - check
stratMain.check60M = function(candle) {
    /*
    log.debug (
        '60M CANDLES:',
        candle.start.format(),
        candle.close,
        'macd',
        this.macd60M.macd,
        'emaShort',
        this.emashort60M.result,
        'emaLong',
        this.emalong60M.result,
        'rsi',
        this.rsi60M.result,
        'mfi',
        this.mfi60M.result,
        'stoch',
        this.stoch60M.stochk,
        this.stoch60M.stochd
    );
    */

    if (this.emashort60M.result > this.emalong60M.result && this.stoch60M.stochk > this.stoch60M.stochd && this.macd60M.macd > this.MACDhigh && this.rsi60M.result > this.RSIhigh) {
        if (this.context.trendMain.direction !== 'up') {
            this.context.trendMain = {
                duration: 0,
                persisted: false,
                direction: 'up',
                adviced: false
            };
        }

        this.context.trendMain.duration++;

        if (this.context.trendMain.duration >= this.persistance) {
            this.context.trendMain.persisted = true;
        }

        if (this.context.trendMain.persisted && !this.context.trendMain.adviced) {
            this.context.trendMain.adviced = true;
            this.context.exposedMain = true;
            log.debug('BUY with 60M main strategy...');
            this.context.advice('long');
        }
    } else if (this.emashort60M.result < this.emalong60M.result && this.stoch60M.stochk < this.stoch60M.stochd && this.macd60M.macd < this.MACDlow && this.rsi60M.result < this.RSIlow) {
        if (this.context.trendMain.direction !== 'down') {
            this.context.trendMain = {
                duration: 0,
                persisted: false,
                direction: 'down',
                adviced: false
            };
        }

        this.context.trendMain.duration++;

        if (this.context.trendMain.duration >= this.persistance) {
            this.context.trendMain.persisted = true;
        }

        if (this.context.trendMain.persisted && !this.context.trendMain.adviced) {
            this.context.trendMain.adviced = true;
            this.context.exposedMain = false;
            log.debug('SELL with 60M main strategy...');
            this.context.advice('short');
        }
    }
}


// ***************************************************************************
// * Receive orderbook data on every tick
stratMain.onOrderbook = function(ob) {
    let bid = Number(ob.bids[0][0]);
    let ask = Number(ob.asks[0][0]);

    log.debug('Strategy debug log, bid/ask price:', bid, '/', ask);
}


stratMain.log = function () {
}


stratMain.update = function (candle) {
    //no need for strat update, we work with onCandle custom batching
}


stratMain.check = function (candle) {
   //no need for strat check, we work with onCandle custom batching and strat execution
}


module.exports = stratMain;
