const moment = require('moment');
const util = require('../../core/util.js');
const _ = require('lodash');
const log = require('../../core/log');

var config = util.getConfig();
var dirs = util.dirs();

var Fetcher = require(dirs.exchanges + 'huobipro');

util.makeEventEmitter(Fetcher);

var end = false;
var done = false;
var from = false;
var days = 0;

var fetcher = new Fetcher(config.watch);
var request = require('request');
var trades = [];

function getCmcDay(url) {
   return new Promise((resolve, reject) => {
        let mytrades = [];
        
        request(url, { json: true }, (err, res, body) => {
          if (err) { 
            util.die(err);
          }
          //log.debug('Candle size from coinmarketcap: ' + Math.round((body.price_usd[1][0] - body.price_usd[0][0]) / 60000) + ' Min.');

          for(let i=0; i<body.price_usd.length; i++) {
            // we need trades in this format:
            // { tid: '4746260', amount: 450.079, date: 1531828822, price: 0.6001 }
            //we got one 5 Min candle, so add 5x 1 Min candles
            for(var j=0; j<5; j++) {
                // we need trades in this format:
                // { tid: '4746260', amount: 450.079, date: 1531828822, price: 0.6001 }
                let obj = {
                  tid: '',
                  amount: body.volume_usd[i][1] / 24 / 60, //1 Min candles
                  date: (body.price_usd[i][0] / 1000) + j*60, //body.price_usd[i][0].toString().substring(0, body.price_usd[i][0].toString().length-3),
                  price: body.price_usd[i][1]
                }   
                mytrades.push(obj);
            } 
          }
          resolve(mytrades);
        });
   });
}


async function handleCmc(slug, days, end) {
   for (let k=1; k<=days; k++) {
      let currend = moment(end*1000).subtract(days-k, 'days').valueOf(); // - (days+k)*86400; // -1 day;
      let currstart = moment(end*1000).subtract(days-k+1, 'days').valueOf(); // - (days+k+1)*86400;

      log.info('Fetching from ' + moment(currstart).format('YYYY-MM-DD HH:mm:ss') + ' to ' + moment(currend).format('YYYY-MM-DD HH:mm:ss'));
      var arr = await getCmcDay('https://graphs2.coinmarketcap.com/currencies/' +slug + '/' + currstart + '/' + currend + '/');
      trades = trades.concat(arr);
  }

  log.info('Done fetching, now processing...');
  fetcher.emit('trades', trades);
  done = true;
}


var fetch = () => {
  if (!done) {
      fetcher.import = true;

      if (end.unix() - from.unix() < 86400) {
        //make sure we get 15 Min candles from coinmarketcap
        util.die('The minimum import date range is 1 day or more.');
      }
      if (end.unix() - from.unix() > 31536000) {
        util.die('The max. import history is 1 year!');
      }

      request('https://api.coinmarketcap.com/v2/listings/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        
        let item = body.data.find((element) => {
          return element.symbol == config.watch.asset.toUpperCase();
        });

        console.log('\n');
        log.info('Importing data from Coinmarketcap ...');
        handleCmc(item.website_slug, days, parseInt(end.unix()));
    });
  } else {
    fetcher.emit('done');
  };
};


module.exports = function(daterange) {
  from = daterange.from.clone().utc();
  end = daterange.to.clone().utc();
  days = Math.ceil((end.unix() - from.unix()) / 60 / 60 / 24);
  return {
    bus: fetcher,
    fetch: fetch,
  };
};
