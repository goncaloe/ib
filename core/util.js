const ib = require('./ib');

var util = {
    MINUTE_MS: 60000,
    HOUR_MS: 3600000,
    DAY_MS: 86400000,

    _timeOffset: null,

    async getTime(){
        let now = Date.now();
        if(!this._timeOffset){
            this._timeOffset = (await ib.getCurrentTime()) * 1000 - now;
        }
        return now + this._timeOffset;
    },
    normalizeTimestamp(ms, period = 300000){
        return ms - ms % period;
    },
    getTimeframe: function(period){
        if(period === '5m'){
            return 300000;
        }
        else if(period === '15m'){
            return 900000;
        }
        else if(period === '1h'){
            return 3600000;
        }
        else if(period === '4h'){
            return 14400000;
        }
        else if(period === '1d'){
            return 86400000;
        }
        else {
            return 60000; // 1m
        }
    },
    die: function(m){
        console.error(m);
        process.exit(1);
    }
};

module.exports = util;