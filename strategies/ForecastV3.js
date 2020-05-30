var _ = require('lodash');
var log = require('../core/log.js');
const util = require('../core/util');
const TULIPASYNC = require('../strategies/indicators/TulipAsync.js');
const TALIBASYNC = require('../strategies/indicators/TalibAsync.js');


function getScale(val) {
  if (isNaN(val) || val === null || val === undefined || val === 0) {
    return 1;
  } else if (Math.abs(val) >= 1) {
    return Math.pow(10, Math.trunc(val).toString().length - 3);
  } else {
    return Math.pow(10, Math.abs(val).toString().match(/0\.0?/)[0].length + 1);
  }
}


var strat = {};

strat.init = function () {
  this.name = 'Forecast';
  this.trendFC = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  }

  this.Scale = null;
  this.Period = 13;

  this.requiredHistory = this.tradingAdvisor.historySize;

  this.tulipFOSC = new TULIPASYNC({ indicator: 'fosc', length: 500, candleinput: 'close', options:[ this.Period ] });
  this.talibHTDCPERIOD = new TALIBASYNC({ indicator: 'ht_dcperiod', length: 500, options:[ this.Period ] });
  this.talibHTtrendLINE = new TALIBASYNC({ indicator: 'ht_trendline', length: 500, options:[ this.Period ] });
  this.tulipMSW = new TULIPASYNC({ indicator: 'msw', length: 500, candleinput: 'close', options:[ this.Period ] });
  this.tulipTSF = new TULIPASYNC({ indicator: 'tsf', length: 500, candleinput: 'close', options:[ this.Period ] });
}


strat.update = async function (candle) {
  if (!this.Scale) 
     this.Scale = getScale(candle.close);
  
  this.talibHTDCPERIOD.result = await this.talibHTDCPERIOD.update(candle);
  this.Period = Math.round(this.talibHTDCPERIOD.result);

  this.talibHTtrendLINE.result = await this.talibHTtrendLINE.update(candle);
  this.ht_trendline = Math.round(this.talibHTtrendLINE.result * this.Scale) / this.Scale;
  
  this.tulipFOSC.result = await this.tulipFOSC.update(candle);
  this.fosc = Math.round(this.tulipFOSC.result[0] * this.Scale) / this.Scale;

  this.tulipMSW.result = await this.tulipMSW.update(candle);
  this.mswSine = Math.round(this.tulipMSW.result[0] * this.Scale) / this.Scale;
  this.mswLead = Math.round(this.tulipMSW.result[1] * this.Scale) / this.Scale;

  this.tulipTSF.result = await this.tulipTSF.update(candle);
  this.tsf = Math.round(this.tulipTSF.result[0] * this.Scale) / this.Scale;
}


strat.loggg = function (candle) {
  log.info('\t\r')
  log.info('\t', 'close:', candle.close)
  log.info('\t', 'Forecast Oscillator:', this.fosc)
  log.info('\t', 'Modified Sine Wave:', this.mswSine, this.mswLead)
  log.info('\t', 'trendline:', this)
  log.info('\t', 'Time Series Forecast:', this.tsf)
  log.info('\t\r')
}


strat.check = function (candle) {  
  const all_long = [
    this.mswSine > this.mswLead,
    this.tsf > this.ht_trendline && typeof(this.tsf) === typeof(this.ht_trendline),
    this.fosc > 1,
    this.trendFC.direction !== 'up'
  ].reduce((total, long) => long && total, true)

  const all_short = [
    //this.mswSine < this.mswLead,
    this.tsf < this.ht_trendline && typeof(this.tsf) === typeof(this.ht_trendline),
    this.fosc < -0.5,
    this.trendFC.direction !== 'down'
  ].reduce((total, short) => short && total, true)

  if (all_long) {
    if (this.trendFC.direction !== 'up')
      this.trendFC = {
        duration: 0,
        persisted: false,
        direction: 'up',
        adviced: false
      }
    this.trendFC.duration++
    //log.debug('In uptrendFC since', this.trendFC.duration, 'candle(s)')
    if (this.trendFC.duration >= 1)
      this.trendFC.persisted = true
    if (this.trendFC.persisted && !this.trendFC.adviced && !this.exposedFC) {
      this.trendFC.adviced = true;
      this.exposedFC = true;
      log.debug('BUY with Forecast strategy...');
      this.advice('long');
    }
  } else if (all_short) {
    if (this.trendFC.direction !== 'down')
      this.trendFC = {
        duration: 0,
        persisted: false,
        direction: 'down',
        adviced: false
      }
    this.trendFC.duration++;
    //log.debug('In downtrend since', this.trendFC.duration, 'candle(s)')
    if (this.trendFC.duration >= 1)
      this.trendFC.persisted = true;
    if (this.trendFC.persisted && !this.trendFC.adviced && this.exposedFC) {
      this.trendFC.adviced = true;
      this.exposedFC = false;
      log.debug('SELL with Forecast strategy...');
      this.advice('short');
    }
  }
}

module.exports = strat;