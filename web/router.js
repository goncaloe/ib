//var _ = require('lodash');
var router = require('koa-router')();

const WEBROOT = __dirname + '/';
const ROUTE = n => WEBROOT + 'routes/' + n;

router.get('/', require(ROUTE('index')));
router.get('/contracts', require(ROUTE('contracts')));

module.exports = router;