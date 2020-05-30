var _ = require('lodash');
const util = require('../../core/util');
const config = util.getConfig();


var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;
  done();
}

Store.prototype.writeCandles = function() {
  return;
}

var processCandle = function(candle, done) {
  done();
};

var finalize = function(done) {
  done();
}

if(config.candleWriter.enabled) {
  Store.prototype.processCandle = processCandle;
  Store.prototype.finalize = finalize;
}

module.exports = Store;
