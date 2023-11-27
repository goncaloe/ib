const _ = require('lodash');
const chalk = require('chalk');
const ib = require('./ib');
const bot = require('./bot');
const Contract = require('./contract');


function Pipeline(){
    _.bindAll(this);

    this.loopCount = 0;
    this.startTime = 0;
}

Pipeline.prototype.run = function(){
    this.log('Inicia pipeline');

    this.init();

    this.startScanner();

    //this.startLoop();
};

Pipeline.prototype.init = function(){
    this.startTime = Date.now();
}

Pipeline.prototype.startScanner = async function(){
    this.log('Inicia scanner');
    let e = await ib.reqScannerSubscription({
        subscription: {
            instrument: "STK",
            locationCode: "STK.US.MAJOR",
            scanCode: "TOP_PERC_GAIN",
            abovePrice: 0.001,
            belowPrice: 10.0,
            aboveVolume: 100000,
            numberOfRows: 10,
        }
    });
    e.on('scannerData', _.bind(this.onScannerData, this));
    e.on('error', (err) => {
        console.error("ERROR1: ", err);
    });
}

Pipeline.prototype.onScannerData = function(items) {
    //let symbols = [];

//items = items.splice(0, 2);

    let toZombie = Object.assign({}, bot.contracts);
    //let zombieSymbols = bot.zombies.map(c => c.symbol);

    let idx, c;
    items.forEach((it) => {
        let symb = it.contractDetails.contract.symbol;

        if(bot.contracts[symb]){
            //nao faz nada
            delete toZombie[symb];
            //activeSymbols.splice(idx, 1);
        }
        else if(bot.zombies[symb]) {
            //move dos zombies para os activos e faz setup
            let c = bot.zombies[symb];
            c.startWatch()
                .catch((e) => { console.error('ERRO: ', e); c.stopWatch(); });
            bot.contracts[symb] = c;
            delete bot.zombies[symb];
            //bot.zombies.splice(idx, 1);
            console.log("Move " + symb + " dos zombies para ativos");
        }
        else {
            if(['MWG', 'CANF'].indexOf(symb) !== -1){
                //salta
            }
            else {
                //adiciona
                c = new Contract(symb);
                c.startWatch()
                    .catch((e) => { console.error('ERRO: ', e); c.stopWatch(); });
                bot.contracts[symb] = c;
            }
        }
    });

    //mover dos contracts para os zombies e fazer unsetup
    for(let symb in toZombie) {
        //idx = bot.contracts.findIndex((c) => c.symbol === symb);
        c = toZombie[symb];
        c.stopWatch();

        delete bot.contracts[symb];
        bot.zombies[symb] = c;
    }

    //console.clear();
    console.log('Ativos[' + Object.keys(bot.contracts).length + ']: ' + Object.keys(bot.contracts).join(', '));
    console.log('Zombies[' + Object.keys(bot.zombies).length + ']: ' + Object.keys(bot.zombies).join(', '));

    setTimeout(() => {
        //this.printContracts();
        }, 1000);

}


// loop
Pipeline.prototype.startLoop = function(){
    this.loopCount = 0;

    this.loop();

    setInterval(_.bind(this.loop, this), 30000);
}

Pipeline.prototype.loop = async function() {
    this.log('Ticker #: ' + this.loopCount++);
}


Pipeline.prototype.printContracts = async function() {
    _.forEach(bot.contracts, (c, symb) => {
        let s = symb;
        s += ': ';
        let arg2 = null;
        if(!c.inStream){
            s += 'Sem stream';
        }
        else if(c.candles_5m.length >= 2){
            let count = c.candles_5m.length;
            let diff = (c.candles_5m[count-1].close - c.candles_5m[count-2].close) / (c.candles_5m[count-1].close * 0.01);
            let date1 = new Date(c.candles_5m[count-2].date);
            let date2 = new Date(c.candles_5m[count-1].date);
            s += '[5m]: ' + diff.toFixed(2);
            s += ' | de ' + c.candles_5m[count-2].close + '(' + date1.getMinutes() + ':' + date1.getSeconds() + ') para ' + c.candles_5m[count-1].close + '(' + date2.getMinutes() + ':' + date2.getSeconds() + ')';
            if(diff > 10){
                s = chalk.red(s);
            }
            else if(diff > 5){
                s = chalk.yellow(s);
            }
        }
        console.log(s);
    });

}



Pipeline.prototype.log = function(){
    let copyArgs = Array.prototype.slice.call(arguments);
    let s = '\x1b[90mPIPELINE';
    let reg = /[A-Z]{2,6}\/[A-Z]{2,6}/g;
    if(typeof copyArgs[0] === 'string' && reg.test(copyArgs[0])){
        s += '[' + copyArgs.shift() + ']';
    }
    s += ':';
    copyArgs.unshift(s);
    copyArgs.push('\x1b[0m');
    console.log.apply(null, copyArgs);
};

module.exports = new Pipeline();