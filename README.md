# Green Gekko 2020 r282 [![npm](https://img.shields.io/npm/dm/gekko.svg)]() [![Build Status](https://travis-ci.org/askmike/gekko.png)](https://travis-ci.org/askmike/gekko) [![Build status](https://ci.appveyor.com/api/projects/status/github/askmike/gekko?branch=stable&svg=true)](https://ci.appveyor.com/project/askmike/gekko)

A crypto trading bot written in Node.js. The purpose is to provide automated trade execution on crypto exchanges by applying algorithmic trading strategies on historical and current market data - to automate buy and sell decisions. GreenGekko is a framework to write own trading strategies, handles exchange connectivity and candle calculations, and offers features for strategy backtesting, paper trading and live trading.

GreenGekko has the focus on spot markets, while [RedGekko](https://github.com/mark-sch/RedGekko) supports trading on Futures.

| Test your own trading strategies and view backtests in the browser |
| ------------------------ |
| ![Green Gekko charts](https://github.com/mark-sch/gekko/raw/develop/screenshots/chart-fullscreen.png) |

| Operate with a Telegram bot | Gekko with Telegram in admin mode |
| ------------------------ | --------------------------------- |
| ![Gekko with telegram bot](https://github.com/mark-sch/gekko/raw/develop/screenshots/telegrambot-crypto-overview.jpg) | ![Gekko with telegram in admin mode](https://github.com/mark-sch/gekko/raw/develop/screenshots/telegrambot-admin-sell.jpg) |

**See screenshots folder**

## Beta: Gekko Cloud integration
- Allows the connection of Gekko bot instances all over the world in realtime
- Connect to remote candles, orderbooks and trading advices from several Gekko bots and exchange markets. Use this information in own trading strategies by listening to onRemoteAdvice, onRemoteCandle and onRemoteOrderbook strategy events.
- Gekko Cloud has a fair-use principle, share your trading signals (but keep your strategy private) and get access to foreign strategy signals and candles. Give and take.
- Write new trading strategies by combining remote advices/candles with local strategy coding. See sample [config](https://raw.githubusercontent.com/mark-sch/gekko/develop/config-cloudstrategy.js) and [strategy](https://raw.githubusercontent.com/mark-sch/gekko/develop/strategies/T5cloudstrat.js) to get started. Run: node gekko.js --config config-cloudstrategy.js
- Execute your strategy signals multiple times for friends or family crypto accounts
- Uses fast TCP socket connections, extended XMPP protocol standards
- No db setup is needed when using Gekko Cloud market. Added config.adapter = 'nodb' config option.

## Green Gekko Features

- Access to orderbook snapshots for higher frequency trading strategies
   - enable orderbook fetching in config file, config.watch / fetchOrderbook: true, you may adjust tickrate: 4. Access onOrderbook event in strategies
   - calculate orderbook metrics with /core/orderbookUtil.js helper lib.
- Extended trading-strategy possibilities:
   - Heikin-Ashi candles core support, e.g. use candle.ha.close instead of candle.close inside your strategy
   - set trading amount while giving advice (e.g. buy with 50% of my portfolio)
   - allow market making or market taking order execution options
   - speedup in the internal event pipeline. Force undelayed advice execution by setting config.tradingAdvisor.fastAdviceEmit: true
   - receive "onCandle" events to allow developers building multi-timeframe strategies.
   - receive "onAdvice" events for plugin-to-plugin communication, e.g. notify the strategy with telegram initiated advices, or create containers with multiple strategies.
- Core enhancements to write async trading strategies with new async tulip and talib wrappers. The new Green Gekko core is able to wait for async strategies without running into race conditions and allows developers to write multi-timeframe and multi-market strategies.
- Rewritten telegram bot
  - User mode
    - list trading pair, strategy and candle size
    - get current price from exchange
    - get trading trend
    - subscribe/unsubscribe to trading advices
  - Admin mode
    - Password restricted access
    - Manually buy and sell tokens
       - with a sticky order
       - with a market taking order
       - set stop-loss and take-profit settings
    - Dynamically view and change strategy settings
    - Show exchange portfolio value
- Advanced Postgresql DB features (used as default db to prevent sqlite lockings)
  - Rewritten postgres plugin, using connection pooling and transaction safe candle writing (Postgres 9.5+ required)
- New command line options:
  - Checks plugin dependencies and automatically enable a plugin when it is mandatory inside a certain mode, e.g. enable the Paper Trader when in backtest mode. See new mandatoryOn property in plugins.js file.
  - New --set command line option to override config settings, e.g. --set debug=true to enable the debug mode output - no need to touch the config.js for a quick debug run
- Additional exchanges (ccxt), supporting market watch, history import, backtesting and live trading
  - HitBtc exchange support
  - HuobiPro exchange support
  - OKEX exchange support
- Coinmarketcap importer
  - Several exchanges, like HuobiPro and OKEX do not offer a large timeframe of history data. The universal Coinmarketcap importer allows fast imports for nearly every market to enable backtesting (based on 5 min. candles)
- Extended log output
    - mailer.js informs with buy and sell events by mail (different to go short/long advices)
    - More info during paper trader backtesting
- Added often used package dependencies by default to get started quickly (npm install)

## Backtest examples

- [T5mainasync strategy, ETHEUR, 20180101-20181001](https://git.io/fhMJo) / [settings](https://raw.githubusercontent.com/mark-sch/gekko/develop/sample-eth.js) / [source](https://raw.githubusercontent.com/mark-sch/gekko/develop/strategies/T5mainasync.js)
- [T5multimarket_strategy, ETHEUR, 20180101-20181001](https://git.io/fhMJE) / [source](https://raw.githubusercontent.com/mark-sch/gekko/develop/strategies/T5multimarket.js)
- [T5multimix strategy, ETHEUR, 20180101-20181231](https://git.io/fhMvD)
- [T5multimix strategy with T5optimizer, ETHEUR, 20180101-20190901](https://git.io/Jeqas)

## Getting started

- git clone https://github.com/mark-sch/gekko
- cd gekko
- npm install
- cd exchange
- npm install
- cd ..
- node gekko --config sample-eth.js --import --set debug=true
- node gekko --config sample-eth.js --backtest --set debug=true
- node gekko --config sample-eth.js

While running the strategy with sample-eth.js config you should [see an output like this](https://git.io/Jex0a)

from time to time the exchange markets should be updated with a utility - to get new coin pairs:

- cd exchange/util/genMarketFiles/
- node update-kraken.js
- node update-binance.js

(postgresql experience required to previously setup postgres. Sample config assumes an existing db user gekkodbuser, pass 1234, with added role permission to createdb. PostgreSQL 9.5+ required.)

See further info how to get started and how to setup postgresql from [crypto49er at youtube](https://www.youtube.com/watch?v=vIqe-EPAMeU)

> A good practice to run Gekko processes on a server is using process manager 2 tool:
>
> **pm2 start gekko.js -i 1 --name "gekko-bnb" -- --config config-bnb.js**

A more detailed guide for Ubuntu Linux can be found [here](https://github.com/mark-sch/GreenGekko/blob/develop/docs/installation/installing_gekko_on_ubuntu_linux.md) and in the [install documentation](https://github.com/mark-sch/GreenGekko/tree/develop/docs/installation)

## Documentation

See [the documentation website](https://gekko.wizb.it/docs/introduction/about_gekko.html).

