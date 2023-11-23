const _ = require('lodash');
const html = require('./../html');
const bot = require('./../../core/bot');
var util = require('./../../core/util');
var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({port: 40510});

var payloadData = function(){
    let data = {};
    data.contracts = {};
    for(let sign in bot.contracts){
        data.contracts[sign] = _.pick(bot.contracts[sign], ['candles_5m', 'symbol', 'inStream', 'watchTime', 'playTime']);
    }
    return data;
};

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        console.log('received: %s', message)
    })

    var sendPayload = () => ws.send(JSON.stringify(payloadData()));

    sendPayload();

    setInterval(sendPayload, 5000);
});


function ws_script(){
    return `<script>
        var ws = new WebSocket('ws://localhost:40510');

        var processWsData = function(data){
            //for(let sign in bot.contracts){ 
            var tab = $('#contracts_table');
            
            for(let symb in data.contracts){
                var c = data.contracts[symb];
    
                var tr = tab.find('.contract_'+symb);
                if(!tr.length){
                    //create
                    tr = '<tr class="contract_' + symb + '">';
                    tr += '<td>'+ symb +'</td>';
                    tr += '<td class="5m"></td>';
                    tr += '<td class="15m"></td>';
                    tr += '<td class="last"></td>';
                    tr += '</tr>';
                    tr = $(tr);
                    tab.find('tbody').prepend(tr);
                }
                
                var m5Col = tr.find('.5m');
                var m15Col = tr.find('.15m');
                var lastCol = tr.find('.last');
                
                if(!c.candles_5m){
                    m5Col.html('');
                    m15Col.html('');
                    lastCol.html('No Data'); 
                    continue;
                }

                if(!c.inStream){
                    m5Col.html('');
                    m15Col.html('');
                    lastCol.html('No Stream');
                    continue;
                }
                
    //console.log('len: ', c.candles_5m.length, 'm5Col: ', m5Col);
                    
                let count = c.candles_5m.length;
                if(count >= 2){
                    let prev1 = parseFloat(c.candles_5m[count-1].close);
                    let prev2 = parseFloat(c.candles_5m[count-2].close);
                    let diff = (prev1 - prev2) / (prev1 * 0.01);
                    m5Col.html(diff.toFixed(2));
                    if(diff > 30){
                        m5Col.css('background-color', '#FF0000');
                    }
                    else if(diff > 20){
                        m5Col.css('background-color', '#FF8000');
                    }
                    else if(diff > 15){
                        m5Col.css('background-color', '#FFCC00');
                    }
                    else if(diff > 10){
                        m5Col.css('background-color', '#FFFF00');
                    }
                    else if(diff > 5){
                        m5Col.css('background-color', '#FFFF77');
                    }
                    else {
                        m5Col.css('background-color', '');
                    }
                    
                    if(diff > 10){
                        let time = Date.now();
                        let playTime = m5Col.data('playTime');
                        if(c.watchTime > (time - 600000) && !playTime){
                            m5Col.data('playTime', time);
                            
                            console.log('faz PLAY:', symb);
                            
                            $('#sound1')[0].play();
                        }
                    }
                    
                }
                else {
                    m5Col.html('').css('background-color', '');
                }
                if(count >= 4){
                    let prev1 = parseFloat(c.candles_5m[count-1].close);
                    let prev2 = parseFloat(c.candles_5m[count-4].close);
                    let diff = (prev1 - prev2) / (prev1 * 0.01);
                    m15Col.html(diff.toFixed(2));
                    if(diff > 30){
                        m15Col.css('background-color', '#FF0000');
                    }
                    else if(diff > 20){
                        m15Col.css('background-color', '#FF8000');
                    }
                    else if(diff > 15){
                        m15Col.css('background-color', '#FFCC00');
                    }
                    else if(diff > 10){
                        m15Col.css('background-color', '#FFFF00');
                    }
                    else if(diff > 5){
                        m15Col.css('background-color', '#FFFF77');
                    }
                    else {
                        m15Col.css('background-color', '');
                    }
                }
                else {
                    m15Col.html('').css('background-color', '');
                }
                
                lastCol.html(parseFloat(c.candles_5m[count-1].close));
            
            }
        }
        
        ws.onopen = function () {
            console.log('websocket is connected ...')
            ws.send('connected')
        }
    
        ws.onmessage = function (ev) {
            var data = JSON.parse(ev.data);
            processWsData(data);
            console.log(data);
        }
    </script>`;
}

module.exports = async function(ctx) {




    let tab = [];
    tab.push(['Simbolo', '#Candles', '']);

    for(let sign in bot.contracts){
        let c = bot.contracts[sign];
        let links = '<a href="/chart?sign=' + sign + '">chart</a>';
        tab.push([sign, c.candles_5m ? c.candles_5m.length : 0, links]);
    }

    let c = '<h2>Contratos</h2>';
    //c += html.renderTable(tab);
    let h = '<table id="contracts_table" class="table datalist"><thead><tr>';
    h += '<th>Symb</th>';
    h += '<th>5m %</th>';
    h += '<th>15m %</th>';
    h += '<th>Last</th>';
    h += '</tr></thead>';
    h += '<tbody>';
    h += '</tbody>';
    h += '</table>';
    c += h;

    c += ws_script();

    c+= ` <audio id="sound1" src="./alert.mp3" preload="auto"></audio>
         <button onclick="document.getElementById('sound1').play();">Play it</button>`;

    ctx.body = html.renderLayout(c, ctx);
};