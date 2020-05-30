// Everything is explained here:
// @link https://gekko.wizb.it/docs/commandline/plugins.html

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.debug = true; // for additional logging / debugging
config.silent = false;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                         WATCHING A MARKET
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.watch = {

  // see https://gekko.wizb.it/docs/introduction/supported_exchanges.html
  exchange: 'kraken',
  currency: 'EUR',
  asset: 'ETH',
  customInterval: 5000
  // tickrate: 20
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING TRADING ADVICE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.tradingAdvisor = {
  enabled: true,
  method: 'T5cloudstrat',
  fastAdviceEmit: true,
  candleSize: 1,
  historySize: 0
}


// ** THE GEKKO CLOUD IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// ** IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// ** FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// ** AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// ** LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// ** OUT OF OR IN CONNECTION WITH THE SOFTWARE/SERVICE OR THE USE OR OTHER DEALINGS 
// ** IN THE SOFTWARE/SERVICE.
// ** THE GEKKO CLOUD IS A MESSAGE ROUTING SERVICE ONLY. IT CONNECTS DATA PUBLISHERS
// ** AND DATA SUBSCRIBERS. IT DOES NOT CHECK IF ANY MESSAGE PUBLISHED TO CHANNELS 
// ** CONTAIN VALID OR USEFUL DATA. DATA DELIVERY MAY BE STOPPED AT ANY TIME WITHOUT
// ** FURTHER ANNOUNCEMENTS. USING DATA FROM PUBLISHERS AND ROUTED BY THE GEKKO CLOUD 
// ** FOR OWN TRADE EXECUTION MAY CAUSE SIGNIFICANT LOSSES.
config.cloudConnector = {
  enabled: true,
  //a list of one or more remote subscription channels
  //to receive remote candles and advices
  channels: ['kraken-etheur-t5mainasync'],
  //publish my local strategy advices to a channel. Requires a Gekko Cloud user account
  publishMySignals: false,
  publishChannel: '',
  //useCloudMarket to feed our local strategy with remote candle data and advices
  //useCloudMarket is for channel subscribers. Disable it when you publish a signal
  //when disabled, it polls exchange data to build local candles (api rate limits)
  useCloudMarket: true,
  //enable extra debug info beside global debug switch
  debugXMPP: false,
  //a guest login can instantly subscribe to free advice/candle channels. To publish
  //your strategy signals and candles you need a gekko cloud user account
  guestLogin: true,
  user: 'guest',
  pass: 'guest'
}


config.T5cloudstrat = {
  setTakerLimit: '1%',
  setSellAmount: '100%',
  setBuyAmount: '98%',
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// do you want Gekko to simulate the profit of the strategy's own advice?
config.paperTrader = {
  enabled: true,
  // report the profit in the currency or the asset?
  reportInCurrency: true,
  // start balance, on what the current balance is compared with
  simulationBalance: {
    // these are in the unit types configured in the watcher.
    asset: 0,
    currency: 5000,
  },
  // how much fee in % does each trade cost?
  feeMaker: 0.15,
  feeTaker: 0.15,
  feeUsing: 'maker',
  // how much slippage/spread should Gekko assume per trade?
  slippage: 0.05,
  verbose: true
}

config.performanceAnalyzer = {
  enabled: true,
  riskFreeReturn: 5
}

// Want Gekko to perform real trades on buy or sell advice?
// Enabling this will activate trades for the market being
// watched by `config.watch`.
config.trader = {
  enabled: false,
  key: '',
  secret: '',
  username: '', // your username, only required for specific exchanges.
  passphrase: '', // GDAX, requires a passphrase.
  orderUpdateDelay: 1, // Number of minutes to adjust unfilled order prices
}

config.adviceLogger = {
  enabled: true,
  muteSoft: true // disable advice printout if it's soft
}

config.profitSimulator = {
  enabled: true,
  reportInCurrency: true,
  simulationBalance: {
    asset: 0,
    currency: 5000,
  },
  verbose: true,
  fee: 0.15,
  slippage: 0.5
}


// want Gekko to send a mail on buy or sell advice?
config.mailer = {
  enabled: false,       // Send Emails if true, false to turn off
  sendMailOnStart: false,    // Send 'Gekko starting' message if true, not if false

  email: 'mymail@gmail.com',    // Your Gmail address
  muteSoft: false, // disable advice printout if it's soft

  // You don't have to set your password here, if you leave it blank we will ask it
  // when Gekko's starts.
  //
  // NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  // make sure you looked at the code or trust the maintainer of this bot when you
  // fill in your email and password.
  //
  // WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  // guarantuee that your email address & password are safe!

  password: '123',       // Your Gmail Password - if not supplied Gekko will prompt on startup.

  tag: '[GEKKO] ',      // Prefix all email subject lines with this

            //       ADVANCED MAIL SETTINGS
            // you can leave those as is if you
            // just want to use Gmail

  server: 'mail.gmail.com',   // The name of YOUR outbound (SMTP) mail server.
  smtpauth: true,     // Does SMTP server require authentication (true for Gmail)
          // The following 3 values default to the Email (above) if left blank
  user: 'mymail@gmail.com',       // Your Email server user name - usually your full Email address 'me@mydomain.com'
  from: 'mymail@gmail.com',       // 'me@mydomain.com'
  to: 'mymail@gmail.com',       // 'me@somedomain.com, me@someotherdomain.com'
  //ssl: true,        // Use SSL (true for Gmail)
  tls: true,
  port: '587',       // Set if you don't want to use the default port
}


config.telegrambot = {
  enabled: false,
  token: '',
  emitUpdates: true,
  emitTrades: true,
  botName: 'GreenGekko',
  adminPW: '5678',
  demoPW: '1234'
};


config.candleWriter = {
  enabled: false
}


config.adviceWriter = {
  enabled: true,
  muteSoft: true,
}


config.backtestResultExporter = {
  enabled: false,
  writeToDisk: true,
  data: {
    stratUpdates: false,
    roundtrips: true,
    stratCandles: true,
    trades: true
  }
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING ADAPTER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.adapter = 'nodb';

config.nodb = {
  path: 'plugins/nodb'
}

config.sqlite = {
  path: 'plugins/sqlite',

  dataDirectory: 'history',
  version: 0.1,

  journalMode: require('./web/isWindows.js') ? 'DELETE' : 'WAL',

  dependencies: []
}

  // Postgres adapter example config (please note: requires postgres >= 9.5):
config.postgresql = {
  path: 'plugins/postgresql',
  version: 0.1,
  connectionString: 'postgres://gekkodbuser:Test4711@localhost:5432', // if default port
  database: null, // if set, we'll put all tables into a single database.
  schema: 'public',
  dependencies: [{
    module: 'pg',
    version: '7.4.0'
  }]
}

// Mongodb adapter, requires mongodb >= 3.3 (no version earlier tested)
config.mongodb = {
  path: 'plugins/mongodb',
  version: 0.1,
  connectionString: 'mongodb://localhost/gekko', // connection to mongodb server
  dependencies: [{
    module: 'mongojs',
    version: '2.4.0'
  }]
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING BACKTESTING
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Note that these settings are only used in backtesting mode, see here:
// @link: https://gekko.wizb.it/docs/commandline/backtesting.html

config.backtest = {
//  daterange: 'scan',
 daterange: {
   from: "2018-01-01"
   //to: "2018-04-28"
},
  batchSize: 1000
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING IMPORTING
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.importer = {
  daterange: {
    // NOTE: these dates are in GMT+2
    from: "2018-01-01T00:00:00+02:00"
    //to: "2018-06-28T09:00:00+02:00"
  }
}

// set this to true if you understand that Gekko will
// invest according to how you configured the indicators.
// None of the advice in the output is Gekko telling you
// to take a certain position. Instead it is the result
// of running the indicators you configured automatically.
//
// In other words: Gekko automates your trading strategies,
// it doesn't advice on itself, only set to true if you truly
// understand this.
//
// Not sure? Read this first: https://github.com/askmike/gekko/issues/201
config['I understand that Gekko only automates MY OWN trading strategies'] = true;

module.exports = config;
