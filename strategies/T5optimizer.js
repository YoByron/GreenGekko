// ****************************************************************************
// *** T5optimizer.js                                                       ***
// ****************************************************************************
// * Purpose: Strategy to record and optimize profits for all possible RSI
// * thresholds.
// * Run this strategy side-by-side to an existing strategy and invoce
// * the shouldBuy and shouldSell functions and every strategy candle.
// * A config.optimizer file is written and evaluated every time gekko
// * starts up.
// ****************************************************************************


const program = require('commander');
const fs = require('fs');
const log = require('../core/log.js');

var rsiOptimizer = {
    data: {}
}


rsiOptimizer.init = function(context) {
    this.enabled = context.settings.enableT5optimizer;
    this.T5os = context.settings.T5optimizer;
    this.T5optimizeFrom = context.settings.T5optimizeFrom;
    this.T5optimizeTo = context.settings.T5optimizeTo;
    this.lastCheckedPrice = 100000;
    this.initialCurrency = 1000;

    console.log(''); //blank line
    try {
        this.data =  JSON.parse(fs.readFileSync(program['config'] + '.optimizer'));
        log.info('*** T5 Runtime optimizer: Loading optimizer data from disk successfully!');
        log.info('*** T5 Runtime optimizer: Discovering recorded data...');
        this.getBestResults(this.T5optimizeFrom, this.T5optimizeTo);
        this.data.buyTreshold = this.best.buyRsi;
        this.data.sellTreshold = this.best.sellRsi;
        log.info('*** Best RSI is', this.best.buyRsi, '/', this.best.sellRsi, '(From', this.best.from, 'to', this.best.to, '- Profit: ' + this.best.totalProfit + '%');
    
        if (this.T5os != undefined && this.T5os.switch != undefined && this.T5os.switch.length >= 2) {
            console.log(''); //blank line
            log.info('*** Best market segmentation:');
            let bestProfitSum = 1;
            let profitSum = 1;
            for (let i=0; i < this.T5os.switch.length-1; i++) {
                this.getBestResults(this.T5os.switch[i].date, this.T5os.switch[i+1].date, this.T5os.switch[i].buyRSI, this.T5os.switch[i].sellRSI);
                bestProfitSum = bestProfitSum + (bestProfitSum * this.best.totalProfit / 100);
                profitSum = profitSum + (profitSum * this.best.testRsiProfit / 100);
                log.info('*** ', 'From', this.best.from, 'to', this.best.to, '- Profit: ' + this.best.totalProfit + '% with best RSI', this.best.buyRsi, '/', this.best.sellRsi, 'and ' + this.best.testRsiProfit + '% with ' + this.T5os.switch[i].buyRSI + ' / ' + this.T5os.switch[i].sellRSI);
            }
            log.info('*** Total: ' + (bestProfitSum-1)*100 + '% / ' + (profitSum-1)*100 + '%');
        }

        log.info('*** Optimizer data is already present, disabling T5optifilesave now');
        context.settings.enableT5optifilesave = false;
    } catch (error) {
        this.data = rsiOptimizer.data;
        for (let i=51; i<= 70; i++) {
            this.data['Buy'+i] = {};
        }
    
        for (let i=51; i<= 70; i++) {
            for (let j=30; j<= 50; j++) {
                this.data['Buy'+i]['Sell'+j] = { exposed: false, profit: 0, currency: this.initialCurrency, asset: 0, trades: [] };
            }
        }
        
        this.data.buyTreshold = context.settings.thresholds.RSIhigh;
        this.data.sellTreshold = context.settings.thresholds.RSIlow;
        log.info('*** T5 Runtime optimizer: Started with blank trade history dataset!');  
        log.info('*** T5 Runtime optimizer: Using initial RSI values', this.data.buyTreshold, '/', this.data.sellTreshold);
    }

    //autosave optimizer data
    if (context.settings.enableT5optifilesave) {
        setInterval(() => {
            try {
                fs.writeFile(program['config'] + '.optimizer', JSON.stringify(this.data, null, 2), () => {});
            } catch (error) {
                console.log(error);
            }
        }, 5000);
    }
}


rsiOptimizer.checkRSIadjustment = function(dtCandle) {
    if (this.T5os != undefined && this.T5os.switch != undefined && this.T5os.switch.length >= 2) {
        for (let i=this.T5os.switch.length-1; i >= 0; i--) {
            if (dtCandle >= this.T5os.switch[i].date) {
                    if (this.data.buyTreshold != Number(this.T5os.switch[i].buyRSI) || this.data.sellTreshold != Number(this.T5os.switch[i].sellRSI)) {
                    console.log(''); //blank line
                    log.info('*** T5 optimizer: Changing RSI thresholds to', this.T5os.switch[i].buyRSI, '/' , this.T5os.switch[i].sellRSI);
                    console.log(''); //blank line

                    this.data.buyTreshold = Number(this.T5os.switch[i].buyRSI);
                    this.data.sellTreshold = Number(this.T5os.switch[i].sellRSI);
                }
                break;
            }
        }
    }
}


rsiOptimizer.logPossibleSells = function(rsi, price, start) {
    if (this.enabled === false) return;
    this.checkRSIadjustment(start);

    for (let i=51; i<= 70; i++) {
        for (let j=30; j<= 50; j++) {
            if (j > rsi && this.data['Buy'+i]['Sell'+j].exposed == true) {
                let curTrade = {
                    type: 'sell',
                    price: price,
                    date: start,
                    profit: 0
                }
                this.data['Buy'+i]['Sell'+j].exposed = false;
                this.data['Buy'+i]['Sell'+j].currency = this.data['Buy'+i]['Sell'+j].asset * price;
                this.data['Buy'+i]['Sell'+j].asset = 0;
                let lastProfit = this.data['Buy'+i]['Sell'+j].currency / this.data['Buy'+i]['Sell'+j].lastCurrency;
                curTrade.profit = lastProfit >= 1 ? (lastProfit-1)*100 : (1-lastProfit)*(-100);
                
                let overallProfit = this.data['Buy'+i]['Sell'+j].currency / this.initialCurrency;
                this.data['Buy'+i]['Sell'+j].profit = overallProfit >= 1 ? (overallProfit-1)*100 : (1-overallProfit)*(-100);
                this.data['Buy'+i]['Sell'+j].trades.push(curTrade);
            }
        }
    }
}


rsiOptimizer.logPossibleBuys = function(rsi, price, start) {
    if (this.enabled === false) return;
    this.checkRSIadjustment(start);

    for (let i=51; i<= 70; i++) {
        if (rsi > i) {
            for (let j=30; j<= 50; j++) {
                if (this.data['Buy'+i]['Sell'+j].exposed == false) {
                    let curTrade = {
                        type: 'buy',
                        price: price*-1,
                        date: start
                    }
                    this.data['Buy'+i]['Sell'+j].exposed = true;
                    this.data['Buy'+i]['Sell'+j].asset = this.data['Buy'+i]['Sell'+j].currency / price;
                    this.data['Buy'+i]['Sell'+j].lastCurrency = this.data['Buy'+i]['Sell'+j].currency;
                    this.data['Buy'+i]['Sell'+j].currency = 0;
                    this.data['Buy'+i]['Sell'+j].trades.push(curTrade);
                }
            }
        }
    }
}


rsiOptimizer.getBestResults = function(from, to, testBuyRsi, testSellRsi) {
    this.best = {
        totalProfit: 0,
        buyRsi: 51,
        sellRsi: 30,
    };

    //calc profit for a certain timeframe
    if (from != undefined && to != undefined) {
        for (var i=51; i<= 70; i++) {
            for (var j=30; j<= 50; j++) {
                this.data['Buy'+i]['Sell'+j].profit = 0;
                this.data['Buy'+i]['Sell'+j].currency = this.initialCurrency;
                for (var k=0; k<this.data['Buy'+i]['Sell'+j].trades.length; k++) {
                    if (this.data['Buy'+i]['Sell'+j].trades[k].type == 'sell' && this.data['Buy'+i]['Sell'+j].trades[k].date >= from && this.data['Buy'+i]['Sell'+j].trades[k].date <= to) {
                        let overallCurrency = this.data['Buy'+i]['Sell'+j].currency + this.data['Buy'+i]['Sell'+j].currency * this.data['Buy'+i]['Sell'+j].trades[k].profit / 100;
                        this.data['Buy'+i]['Sell'+j].currency = overallCurrency;
                    }
                }
                this.data['Buy'+i]['Sell'+j].profit = ((this.data['Buy'+i]['Sell'+j].currency - this.initialCurrency) / this.initialCurrency) * 100;
            }
        }
    }
    else {
        for (var i=51; i<= 70; i++) {
            for (var j=30; j<= 50; j++) {
                this.data['Buy'+i]['Sell'+j].profit = 0;
                this.data['Buy'+i]['Sell'+j].currency = this.initialCurrency;
                for (var k=0; k<this.data['Buy'+i]['Sell'+j].trades.length; k++) {
                    if (this.data['Buy'+i]['Sell'+j].trades[k].type == 'sell') {
                        let overallCurrency = this.data['Buy'+i]['Sell'+j].currency + this.data['Buy'+i]['Sell'+j].currency * this.data['Buy'+i]['Sell'+j].trades[k].profit / 100;
                        this.data['Buy'+i]['Sell'+j].currency = overallCurrency;
                    }
                }
                this.data['Buy'+i]['Sell'+j].profit = ((this.data['Buy'+i]['Sell'+j].currency - this.initialCurrency) / this.initialCurrency) * 100;
            }
        }
    }

    for (var i=51; i<= 70; i++) {
        for (var j=30; j<= 50; j++) {
            if (this.data['Buy'+i]['Sell'+j].profit >= this.best.totalProfit) {
                this.best.totalProfit = this.data['Buy'+i]['Sell'+j].profit;
                this.best.buyRsi = i;
                this.best.sellRsi = j;
                //console.log('bestProfit:', this.best.totalProfit, this.best.buyRsi, this.best.sellRsi);
            }
        }
    }

    if (from != undefined && to != undefined) {
        this.best.from = from;
        this.best.to = to;
    }
    else {
        this.best.from = this.data['Buy'+this.best.buyRsi]['Sell'+this.best.sellRsi].trades[0].date;
        this.best.to = this.data['Buy'+this.best.buyRsi]['Sell'+this.best.sellRsi].trades[this.data['Buy'+this.best.buyRsi]['Sell'+this.best.sellRsi].trades.length-1].date;
    }

    if (testBuyRsi != undefined && testSellRsi != undefined) {
        this.best.testRsiProfit = this.data['Buy'+testBuyRsi]['Sell'+testSellRsi].profit;
    }
}


rsiOptimizer.shouldBuy = function(rsi, price) {
    if (rsi > this.data.buyTreshold)
        return true;
    else   
        return false;
}


rsiOptimizer.shouldSell = function(rsi, price) {
    if (rsi < this.data.sellTreshold)
        return true;
    else   
        return false;
}

module.exports = rsiOptimizer;