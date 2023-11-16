const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const ib = require('./ib');
const IbContract = require('../ib-tws-api/Contract');


const Contract = function(symbol, params = {}){
    EventEmitter.call(this);

    this.symbol = symbol;

    this.candles_5m = [];

    //this.config(params);
};

Contract.prototype.startMarketData = async function(){

    let hist = await api.getHistoricalData({
        contract: Contract.stock(this.symbol),
        duration: '1500 S',
        barSizeSetting: '5 mins',
        whatToShow: 'TRADES',
        useRth: 0,
        formatDate: 2,
        keepUpToDate: true,
    });
    if(!hist){
        return;
    }




    console.log(details);

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


    e = await ib.streamMarketData({
        contract: IbContract.stock('TSLA')
    });
    e.on('tick', (t) => {
        console.log(t.ticker);
    });
    e.on('error', (t) => {
        console.log('error');
        console.log(t);
    });
}

Contract.prototype.endMarketData = async function() {
    e = await ib.streamMarketData({
        contract: IbContract.stock('TSLA')
    });
}


Contract.prototype.processTicker = async function(ticker){

}

Contract.prototype.log = function() {
    let copyArgs = Array.prototype.slice.call(arguments);
    copyArgs.unshift('\x1b[95mPAIR['+this.sign+']:');
    copyArgs.push('\x1b[0m');
    console.log.apply(null, copyArgs);
};

inherits(Contract, EventEmitter);
module.exports = Contract;