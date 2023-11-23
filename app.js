var pipeline = require('./core/pipeline');

pipeline.run();

if(!process.argv.includes('--noui')){
    require('./web/server');
}