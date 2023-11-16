const _ = require('lodash');
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

    this.startLoop();
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
            numberOfRows: 10,
        }
    });
    e.on('scannerData', _.bind(this.onScannerData, this));
    e.on('error', (err) => {
        console.error(err);
    });
}

Pipeline.prototype.onScannerData = function(items) {
    //let symbols = [];

items = items.splice(0, 1);

    let activeSymbols = bot.contracts.map(c => c.symbol);
    //let zombieSymbols = bot.zombies.map(c => c.symbol);
    let idx, c;
    items.forEach((it) => {
        let symb = it.contractDetails.contract.symbol;

        if((idx = activeSymbols.indexOf(symb)) !== -1){
            //nao faz nada
            activeSymbols.splice(idx, 1);
        }
        else if((idx = bot.zombies.findIndex((c) => c.symbol === symb)) !== -1) {
            //move dos zombies para os activos e faz setup
            let c = bot.zombies[idx];
            this.setupContract(c);
            bot.contracts.push(c);
            bot.zombies.splice(idx, 1);
            //bot.zombies.splice(idx, 1);
            console.log("Move " + symb + "dos zombies para ativos!");
        }
        else {
            //adiciona
            c = new Contract(symb);
            this.setupContract(c);
            bot.contracts.push(c);
        }
    });

    //mover para os zombies e fazer unsetup
    activeSymbols.forEach((symb) => {
        idx = bot.contracts.findIndex((c) => c.symbol === symb);
        c = bot.contracts[idx];
        this.unsetupContract(c);
        bot.contracts.splice(idx, 1);
        bot.zombies.push(c);
    });

    console.log('contracts[' + bot.contracts.length + ']: ' + bot.contracts.map(c => c.symbol).join(', '));
    console.log('zombies[' + bot.zombies.length + ']: ' + bot.zombies.map(c => c.symbol).join(', '));
}


Pipeline.prototype.setupContract = function(cont){
    console.log("setup " + cont.symbol);



}

Pipeline.prototype.unsetupContract = function(cont){
    console.log("unsetup " + cont.symbol);
}

Pipeline.prototype.onT = function(items) {

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