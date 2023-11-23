var _ = require('lodash');

module.exports = {
    renderLayout: function(data, ctx) {
        let nav = this.renderNav(ctx);
        let content = '',footer = '';
        if(typeof data === 'object'){
            content = data[0];
            footer = data[1] ? data[1] : '';
        }
        else {
            content = data;
        }
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Bot</title>
    <link rel="stylesheet" href="./bootstrap.css">
    <link rel="stylesheet" href="./webbot.css?v2">
    <script src="./jquery-3.1.1.min.js"></script>
    <script src="./main.js"></script>
</head>
<body>
    ${nav}
    <div id="content">
        <main class="container">    
        ${content}
        </main>
        ${footer}
    </div>
</body>
</html>`;
    },

    renderNav: function(ctx){
        let route = ctx._matchedRoute;
        let navClass = [
            (route === '/' ? ' active' : ''),
            (route === '/contracts' ? ' active' : ''),
        ];
        return `<nav class="navbar sticky-top navbar-expand-lg navbar-light bg-light">
                  <div class="container"> 
                    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                      <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                      <ul class="navbar-nav">
                        <li class="nav-item">
                          <a class="nav-link${navClass[0]}" href="/">Home <span class="sr-only">(current)</span></a>
                        </li>
                        <li class="nav-item">
                          <a class="nav-link${navClass[1]}" href="/contracts">Contratos</a>
                        </li>
                      </ul>
                    </div>
                  </div>  
                </nav>`;
    },

    renderTable: function(table, options){
        options = options || {};
        var renderRow = function(row){
            let c = '<tr>';
            for(let i in row){
                c += '<td>'+row[i]+'</td>';
            }
            c += '</tr>';
            return c;
        };

        let row = table[0];
        let hclass = 'table datalist';
        if(typeof options.class !== 'undefined'){
            hclass = ' ' + options.class;
        }
        let h = '<table class="' + hclass + '"><thead class="thead-light"><tr>';
        for(let i = 0; i < row.length; i++){
            h += '<th>'+row[i]+'</th>';
        }
        h += '</tr></thead>';
        h += '<tbody>';
        for(let i = 1; i < table.length; i++) {
            h += renderRow(table[i]);
        }
        h += '</tbody>';
        return h;
    },

    renderChart: function(src){
        let yAxis = [];
        let series = [];
        let axisMap = [];
        let countAxis = 0;
        let tableData = null;

        for(let i in src) {
            let v = src[i];
            if(v.type === 'table'){
                tableData = v;
                src.splice(i, 1);
            }
            else if (v.id && !v.yAxis) {
                axisMap.push(v.id);
                if (v.type === 'oscilator') {
                    countAxis++;
                }
            }
        }

        let closeHeight = 600;
        let chartHeight = closeHeight + 200 * countAxis;
        let closeHeighP = (closeHeight / chartHeight) * 100;
        let oscillatorsP = countAxis ? (98 - closeHeighP) / countAxis : 0;
        let nextTop = closeHeighP + 1;

        for(let i in src){
            let v = src[i];
            let axis = {
                labels: {
                    align: 'right',
                    x: -3
                },
                lineWidth: 1
            };

            if(v.title){
                axis.title = {text: v.title};
            }
            if(v.axis){
                _.assign(axis, v.axis);
            }

            //serie
            let serie = {
                type: 'spline',
                data: v.candles,
                color: v.color ? v.color : '#3892d9'
                //,tooltip: {
                //    pointFormatter: function(a){ console.log(this); return a; }
                //}
            };
            if(v.id){
                serie.id = v.id;
            }
            if(v.name){
                serie.name = v.name;
            }
            if(v.serie){
                _.assign(serie, v.serie);
            }

            if(v.type === 'indicator'){
                _.assign(axis, {
                    height: closeHeighP + '%',
                });
                
                yAxis.push(axis);

                series.push(serie);
            }
            else if(v.type === 'oscilator'){
                let ya;
                if(typeof v.yAxis === "undefined"){
                    _.merge(axis, {
                        top: nextTop + '%',
                        height: oscillatorsP + '%',
                        offset: 0,
                        gridLineWidth: 0
                    });

                    yAxis.push(axis);
                    nextTop += oscillatorsP + 1;
                    ya = yAxis.length - 1;
                }
                else {
                    if(/^\d+$/.test(v.yAxis)){
                        ya = v.yAxis;
                    }
                    else {
                        ya = axisMap.length ? axisMap.indexOf(v.yAxis) : 0;
                    }
                }

                _.merge(serie, {
                    yAxis: ya
                });
                series.push(serie);
            }
            else if(v.type === 'flags'){
                _.merge(serie, {
                    type: 'flags'
                });
                series.push(serie);
            }
            else {
                series.push(serie);
            }
        }

        let chartOptions = {
            chart: {
                height: chartHeight,
                plotBorderWidth: 1
            },
            mapNavigation: {
                enableMouseWheelZoom: true
            },
            time: {
                useUTC: false
            },
            legend: {
                enabled: false
            },
            tooltip: {
                shared: true,
                valueDecimals: 8
            },
            scrollbar: {
                liveRedraw: true
            },
            plotOptions: {
                series: {
                    showInLegend: true,
                    lineWidth: 1,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
            rangeSelector: {
                buttons: [{
                    type: 'minute',
                    count: 180,
                    text: '3h'
                }, {
                    type: 'day',
                    count: 1,
                    text: '1d'
                }, {
                    type: 'week',
                    count: 1,
                    text: '1w'
                }, {
                    type: 'month',
                    count: 1,
                    text: '1m'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: false,
                selected: 1
            },
            yAxis : yAxis,
            series: series
        };

        let h = '<div id="chart_content"></div>';


        if(tableData && tableData.table && tableData.table.length >= 2){
            let tableRows = tableData.table;
            let th = '';
            if(tableData.name){
                th += '<h4>' + tableData.name + '</h4>';
            }
            th += '<table class="table datalist" style="max-width:0;"><thead><tr>';
            for(let i = 0; i < tableRows[0].length; i++){
                th += '<th>' + tableRows[0][i] + '</th>';
            }
            th += '</tr></thead>';
            th += '<tbody>';
            for(let i = 1; i < tableRows.length; i++){
                th += '<tr>';
                for(let k = 0; k < tableRows[i].length; k++){
                    th += '<td>' + tableRows[i][k] + '</td>';
                }
                th += '</tr>';
            }
            th += '</tbody>';
            th += '</table>';
            h += th;
        }

        h += '<script>';
        h += '$(function(){';
        h += "Highcharts.stockChart('chart_content', " + JSON.stringify(chartOptions) + ");";
        h += '});';
        h += '</script>';

        return h
    }
};