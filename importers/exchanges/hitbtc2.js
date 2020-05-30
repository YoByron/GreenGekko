var util = require('../../core/util.js');
var _ = require('lodash');
var moment = require('moment');
var log = require('../../core/log');
var request = require('request');

var config = util.getConfig();

var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'hitbtc2');

var batchSize = 60 * 2; // 2 hour
var overlapSize = 10; // 10 minutes

var PUBLIC_API_URL = 'api.hitbtc.com/api/2/public';
var PRIVATE_API_URL = 'api.hitbtc.com/api/2/trading';
var API_SCHEMA = 'https://';
var USER_AGENT = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0';

// Helper methods
function joinCurrencies(currencyA, currencyB) {
  if (currencyA == 'USDT') currencyA = 'USD';
  return currencyB + '' + currencyA;
}

// Make an API request
    function _request(options, callback) {
      if (!('headers' in options)) {
        options.headers = {};
      }

      options.json = true;
      options.headers['User-Agent'] = USER_AGENT;
      //   options.strictSSL = Hitbtc.STRICT_SSL;

      request(options, function(err, response, body) {
        // Empty response
        if (!err && (typeof body === 'undefined' || body === null)) {
          err = 'Empty response';
        }

        callback(err, body);
      });

      return this;
    }

    // Make a public API request
    function _public(path, parameters, callback) {
      var options;

      if (typeof parameters === 'function') {
        callback = parameters;
        parameters = {};
      }

      parameters || (parameters = {});
      options = {
        method: 'GET',
        url: API_SCHEMA + PUBLIC_API_URL + '/' + path,
        qs: parameters,
      };

      return _request(options, callback);
    }

// patch getTrades..
Fetcher.prototype.getTrades = function(range, callback) {
  var args = _.toArray(arguments);
  var process = function(err, result) {
    if (err || result.error || !Array.isArray(result)) {
      console.log('HitBtc trade error:', err, result);
      return this.retry(this.getTrades, args);
    }
    // console.log('HitBtc trade:', result);
    if (_.size(result) === 50000) {
      // to many trades..
      util.die('too many trades..');
    }

    result = _.map(result, function(trade) {
      return {
        tid: trade.id,
        amount: +trade.quantity,
        date: moment.utc(trade.timestamp).format('X'),
        price: +trade.price,
      };
    });

    callback(result.reverse());
  }.bind(this);

  var params = {};

  params.from = range.from.unix();
  params.till = range.to.unix();
  params.by = 'timestamp';
  params.limit = 1000;
  // console.log(joinCurrencies(this.currency, this.asset));
  _public(
    'trades/' + joinCurrencies(this.currency, this.asset),
    params,
    process
  );
};

util.makeEventEmitter(Fetcher);

var iterator = false;
var end = false;
var done = false;

var fetcher = new Fetcher(config.watch);

var fetch = () => {
  log.info(
    config.watch.currency,
    config.watch.asset,
    'Requesting data from',
    iterator.from.format('YYYY-MM-DD HH:mm:ss') + ',',
    'to',
    iterator.to.format('YYYY-MM-DD HH:mm:ss')
  );

  if (util.gekkoEnv === 'child-process') {
    let msg = [
      'Requesting data from',
      iterator.from.format('YYYY-MM-DD HH:mm:ss') + ',',
      'to',
      iterator.to.format('YYYY-MM-DD HH:mm:ss'),
    ].join('');
    process.send({ type: 'log', log: msg });
  }
  fetcher.getTrades(iterator, handleFetch);
};

var handleFetch = trades => {
  iterator.from.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');
  iterator.to.add(batchSize, 'minutes').subtract(overlapSize, 'minutes');

  if (!_.size(trades)) {
    // fix https://github.com/askmike/gekko/issues/952
    if (iterator.to.clone().add(batchSize * 4, 'minutes') > end) {
      fetcher.emit('done');
    }

    return fetcher.emit('trades', []);
  }

  var last = moment.unix(_.last(trades).date);

  if (last > end) {
    fetcher.emit('done');

    var endUnix = end.unix();
    trades = _.filter(trades, t => t.date <= endUnix);
  }

  fetcher.emit('trades', trades);
};

module.exports = function(daterange) {
  iterator = {
    from: daterange.from.clone(),
    to: daterange.from.clone().add(batchSize, 'minutes'),
  };
  end = daterange.to.clone();

  return {
    bus: fetcher,
    fetch: fetch,
  };
};
