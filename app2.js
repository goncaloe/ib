const _ = require('lodash');
var api = require('./core/ib');
var Contract = require('./ib-tws-api/contract');

async function main() {
    let time = await api.getCurrentTime();
    console.log('current time: ' + Date(time).toString());

    console.log()

    api.reqMarketDataType(1);




    let details = await api.getHistoricalData({
        contract: Contract.stock('BCDA'),
        //endDateTime: '20231115 17:10:00 UTC',
        duration: '1500 S',
        barSizeSetting: '5 mins',
        whatToShow: 'TRADES',
        useRth: 0,
        formatDate: 2,
        keepUpToDate: true,
    });
    console.log(details);


    /*
    let e = await api.streamMarketData({
        contract: Contract.stock('TSLA')
    });
    e.on('tick', (t) => {
        console.log(t.ticker);
    });
    e.on('error', (t) => {
        console.log('error');
        console.log(t);
    });
    */




    /*
    let e = await api.reqScannerSubscription({
        subscription: {
            instrument: "STK",
            locationCode: "STK.US.MAJOR",
            scanCode: "TOP_PERC_GAIN",
            abovePrice: 0.001,
            belowPrice: 10.0,
            numberOfRows: 10,
        }
    });

    e.on('scannerData', (t) => {
        //console.log('scannerData: ', t)
        var symbols = [];
        t.forEach((it) => {
            //console.log(it)
            symbols.push(it.contractDetails.contract.symbol);
        });

        console.log(symbols.join(', '));
    });
    e.on('error', (t) => {
        console.log('error');
        console.log(t);
    });
*/

    //process.exit(1);

}

//main();

function main2(){
    /*
    let a = [
        { symbol: 'CMMB'},
        { symbol: 'HSCS'},
        { symbol: 'KNTE'},
    ];

    let b = _.map(a, c => c.symbol);
    */

    let c = '20231115  17:45:00';


    console.log(b);
}

main();