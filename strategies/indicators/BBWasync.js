// Bollinger Band Width Indicator

const TALIBASYNC = require('../indicators/TalibAsync.js');

var Indicator = function(config) {
  this.result = 0;
  this.bbLength = config.bbLength;
  this.bbDevUp = config.bbDevUp;
  this.bbDevDown = config.bbDevDown;
  
  this.bb = new TALIBASYNC({ indicator: 'bbands', length: 1000, options: { optInTimePeriod: this.bbLength, optInNbDevUp: this.bbDevUp, optInNbDevDn: this.bbDevDown, optInMAType: 0 } });
  this.bb.count = 0;
}
 
Indicator.prototype.update = async function (candle) {
  this.bb.result = await this.bb.update(candle);
  this.bb.count++;
  //check for sufficient history
  if (this.bb.count >= this.bbLength) {
    this.bb.lowerBand = this.bb.result['outRealLowerBand'][this.bb.result['outRealLowerBand'].length-1];
    this.bb.middleBand = this.bb.result['outRealMiddleBand'][this.bb.result['outRealMiddleBand'].length-1];
    this.bb.upperBand = this.bb.result['outRealUpperBand'][this.bb.result['outRealUpperBand'].length-1];
    this.bb.bbwidth = this.result = ((this.bb.upperBand - this.bb.lowerBand) / candle.close);
    return this.bb.bbwidth;
  } else {
      return false;
  }
}

module.exports = Indicator;