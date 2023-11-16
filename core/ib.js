var Client = require('../ib-tws-api/client');

let ib = new Client({
    host: '127.0.0.1',
    port: 7497
});

module.exports = ib;
