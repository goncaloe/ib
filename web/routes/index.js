const _ = require('lodash');
const html = require('./../html');

module.exports = async function(ctx) {
    let c = '<p>index</p>';

    ctx.body = html.renderLayout(c, ctx);
};