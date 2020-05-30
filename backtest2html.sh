#!/bin/bash

( /usr/bin/time --verbose node gekko.js --config cfg/mark/config-eth.js --backtest --set debug=true | aha --black --title 'T5multimix_ETHEUR_20180101-20190901' > backtest-results/T5multimix_ETHEUR_20180101-20190901.html &)
#( /usr/bin/time --verbose node gekko.js --config config-xrp.js --backtest --set debug=true | aha --black --title 'T5multitime_XRPEUR_20180101-20181231' > backtest-results/T5multitime_XRPEUR_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-bch.js --backtest --set debug=true | aha --black --title 'T5multitime_BCHEUR_20180101-20181231' > backtest-results/T5multitime_BCHEUR_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-ltc.js --backtest --set debug=true | aha --black --title 'T5multitime_LTCEUR_20180101-20181231' > backtest-results/T5multitime_LTCEUR_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-bnb.js --backtest --set debug=true | aha --black --title 'T5multitime_BNBUSDT_20180101-20181231' > backtest-results/T5multitime_BNBUSDT_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-xlm.js --backtest --set debug=true | aha --black --title 'T5multitime_XLMEUR_20180101-20181231' > backtest-results/T5multitime_XLMEUR_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-eos.js --backtest --set debug=true | aha --black --title 'T5multitime_EOSEUR_20180101-20181231' > backtest-results/T5multitime_EOSEUR_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-trx.js --backtest --set debug=true | aha --black --title 'T5multitime_TRXUSD_20180101-20181231' > backtest-results/T5multitime_TRXUSD_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-iota.js --backtest --set debug=true | aha --black --title 'T5multitime_IOTAUSD_20180101-20181231' > backtest-results/T5multitime_IOTAUSD_20180101-20181231.html &)
#( /usr/bin/time --verbose node gekko.js --config config-zec.js --backtest --set debug=true | aha --black --title 'T5multitime_ZECUSDT_20180101-20181231' > backtest-results/T5multitime_ZECUSDT_20180101-20181231.html &)

