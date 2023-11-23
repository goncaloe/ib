const Koa = require('koa');
const serve = require('koa-static');
const koaQs = require('koa-qs');
const router = require('./router');

const app = new Koa();

koaQs(app);

app
    .use(serve('./web/assets'))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(3000);

console.log('Start server at http://localhost:3000');

