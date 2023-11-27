const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const ib = require('./ib');
var util = require('./util');

const IbContract = require('../ib-tws-api/Contract');


const Contract = function(symbol, params = {}){
    EventEmitter.call(this);

    this.symbol = symbol;

    this.candles_5m = [];

    //this.config(params);
};

Contract.prototype.startWatch = async function(){
    if(this.streamEvent){
        return;
    }

    let details = await ib.getContractDetails(IbContract.stock(this.symbol));
    let primExc = details[0].contract.primaryExchange;
    if(primExc !== 'NASDAQ' && primExc !== 'NYSE'){
        this.inStream = false;
        return;
    }

    let count = this.candles_5m.length;
    let currTime = await util.getTime();
    let tfSecs = util.getTimeframe('5m');
    let lastTs = util.normalizeTimestamp(currTime);
    let lastDate = count ? this.candles_5m[count - 1].timestamp : 0;

    var fixCandles = (toTs) => {
        let count = this.candles_5m.length;
        if(!count){
            return;
        }
        let nextDate = util.normalizeTimestamp(this.candles_5m[count - 1].date);
        let lastClose = this.candles_5m[count - 1].close;

        while(nextDate < toTs) {
            nextDate += tfSecs;
            console.log("Cria candle " + this.formatDate(new Date(nextDate)) + ' ' + this.symbol);
            this.candles_5m.push({
                date: nextDate,
                open: lastClose,
                close: lastClose,
                high: lastClose,
                low: lastClose
            });
        }

        //console.log("__fix candles: ", this.symbol, ' ' + this.formatDate(new Date(nextDate)) + ' |last: ', this.formatDate(new Date(lastTs)));
    }

    if(lastDate < (lastTs - tfSecs)) {
        console.log("Carrega historicalData de "+ this.symbol)

        let hist = await ib.getHistoricalData({
            contract: IbContract.stock(this.symbol),
            duration: '1500 S',
            barSizeSetting: '5 mins',
            whatToShow: 'TRADES',
            useRth: 0,
            formatDate: 2,
            keepUpToDate: true,
        });
        this.candles_5m = [];
        _.forEach(hist.bars, (tick) => {
            tick.date = parseInt(tick.date) * 1000;
            if(typeof tick.close === 'undefined'){
                tick.close = tick.average;
                tick.low = tick.average;
                tick.high = tick.average;
            }
            //console.log('Carrega candle '+ this.formatDate(new Date(tick.date)) + ', close: ' + tick.close);
            this.candles_5m.push(tick);
        });

        fixCandles(lastTs);
    }

    this.inStream = true;
    this.watchTime = currTime;

    this.streamEvent = await ib.streamMarketData({
        contract: IbContract.stock(this.symbol)
    });
    this.streamEvent.on('tick', (tick) => {
        this.processTicker(tick.ticker);
    });
    this.streamEvent.on('error', (err) => {
        console.log("Erro streamMarketData()");
        this.stopWatch();
    });

    setTimeout(async () => {
        this.fixCandlesInterval = setInterval(async () => {
            //console.log('fix2 ' + this.symbol);
            lastTs = util.normalizeTimestamp(await util.getTime());
            fixCandles(lastTs);
        }, tfSecs);
        //console.log('fix ' + this.symbol);
        lastTs = util.normalizeTimestamp(await util.getTime());
        fixCandles(lastTs);
    }, lastTs + tfSecs - currTime);


    /*
    {
      date: '1700069100',
      open: 0.8835,
      high: 0.8977,
      low: 0.8725,
      close: 0.889,
      volume: 516,
      average: 0.88291,
      barCount: 120
    },
    */
}

Contract.prototype.stopWatch = async function() {
    if(this.streamEvent){
        //e = await ib.streamMarketData({
        //    contract: IbContract.stock(this.symbol)
        //});

        this.streamEvent.stop();
        this.streamEvent = null;
    }
    this.inStream = false;
    this.watchTime = 0;
    if(this.fixCandlesInterval){
        clearInterval(this.fixCandlesInterval);
    }
}


Contract.prototype.processTicker = async function(ticker){
    if(!this.inStream){
        return;
    }
    if(this.lastTimestamp === ticker.lastTimestamp){
        return;
    }
    this.lastTimestamp = ticker.lastTimestamp;
    //console.log("Processa ticker", ticker);

    let count = this.candles_5m.length;
    let lastTs = util.normalizeTimestamp(await util.getTime());
    let lastDate = count ? this.candles_5m[count - 1].date : 0;
    let candle;
    if(!count || lastTs !== lastDate) {
        //console.log(this.symbol + "Cria tick", this.formatDate(new Date(lastTs)), ", last: ", (new Date(lastDate)).toString() );
        candle = {
            date: lastTs,
            open: ticker.last,
            close: ticker.last,
            high: ticker.last,
            low: ticker.last
        };
        this.candles_5m.push(candle);

        if(this.candles_5m.length > 500){
            this.candles_5m.shift();
        }
    }
    else {
        //console.log(this.symbol + ": Update tick " + (new Date(lastTs)).toString());
        candle = this.candles_5m[count - 1];
        candle.close = ticker.last;
        candle.low = Math.min(ticker.last, candle.low);
        candle.high = Math.max(ticker.last, candle.high);
    }
}

Contract.prototype.log = function() {
    let copyArgs = Array.prototype.slice.call(arguments);
    copyArgs.unshift('\x1b[95mPAIR['+this.sign+']:');
    copyArgs.push('\x1b[0m');
    console.log.apply(null, copyArgs);
};



Contract.prototype.formatDate = function(date) {
    function padTo2Digits(num) {
        return num.toString().padStart(2, '0');
    }
    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}



inherits(Contract, EventEmitter);
module.exports = Contract;