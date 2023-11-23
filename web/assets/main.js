
var app = {

    initBotPage: function() {
        let updateValues = function () {
            $.ajax({url: '/status', dataType: 'json'}).done(function (data) {
                if (!data) return;

                if(data.btcTotal){
                    let usdAmount = data.btcTotal * data.usdPrice;
                    $('#balance_btc').html(' (' + data.btcTotal.toFixed(8) + ' = ' + usdAmount.toFixed(2) + 'USD)');
                }

                if (data.balance) {
                    let trs = '';
                    for (let i = 0; i < data.balance.length; i++) {
                        let b = data.balance[i];
                        let total = parseFloat(b.free) + parseFloat(b.used);

                        if(b.btcFree < -0.0001){
                            $('#logs').append('<div class="text-danger">ERRO: '+b.currency+' tem btcFree a '+ b.btcFree +'</div>')
                        }
                        if(b.btcUsed < -0.0001){
                            $('#logs').append('<div class="text-danger">ERRO: '+b.currency+' tem btcUsed a '+ b.btcUsed +'</div>')
                        }

                        let progressBtc = data.btcTotal ? Math.round((parseFloat(b.btcAmount) * 10000) / parseFloat(data.btcTotal)) / 100 : 0;
                        let progress1 = total ? Math.round((parseFloat(b.free) * 10000) / total) / 100 : 0;
                        let progress2 = total ? Math.round((parseFloat(b.used) * 10000) / total) / 100 : 0;
                        let freeText, usedText;
                        if(b.currency === 'BTC'){
                            freeText = b.free + 'BTC';
                            usedText = b.used + 'BTC';
                        }
                        else {
                            freeText = b.free + ' = ' + b.btcFree + 'BTC';
                            usedText = b.used + ' = ' + b.btcUsed + 'BTC';
                        }
                        trs += '<tr data-currency="' + b.currency + '">';
                        trs += '<td style="position: relative"><span class="table-progress" style="width: ' + progressBtc + '%; background-color: #eeeeee;"></span>' + b.currency + ' ' + b.inTrading + '</td>';
                        trs += '<td style="position: relative"><span class="table-progress" style="width: ' + progress1 + '%;"></span>' + freeText + '</td>';
                        trs += '<td style="position: relative"><span class="table-progress" style="width: ' + progress2 + '%; background-color: #ffeeba;"></span>' + usedText + '</td>';
                        trs += '<td>';
                        if(b.currency !== 'BTC' && b.btcFree > 0.0001) {
                            let paramsStr = "'" + JSON.stringify({currency: b.currency}) + "'";
                            trs += '  <a href="#" class="sell-currency">vende</a>';
                        }
                        trs += '</td>';
                        trs += '</tr>';
                    }
                    $('#balance_table tbody').html(trs);
                }

                if (data.orders) {
                    let trs = '';
                    for (let i = 0; i < data.orders.length; i++) {
                        let o = data.orders[i];
                        let progress = Math.round((o.filled * 10000) / o.amount) / 100;
                        let qntText = o.amount + ' = ' + (Math.round(o.price * o.amount * 10000) / 10000) + 'BTC';
                        trs += '<tr data-id="' + o.id + '" id="order_' + o.id + '">';
                        trs += '<td>' + o.id + '</td>';
                        trs += '<td>' + o.sign + '</td>';
                        trs += '<td>' + (o.side === 'buy' ? '<span class="badge badge-success">buy</span>' : '<span class="badge badge-danger">sell</span>') + '</td>';
                        trs += '<td>' + o.price + '</td>';
                        trs += '<td>' + qntText + '</td>';
                        trs += '<td style="position: relative"><span class="table-progress" style="width: ' + progress + '%; background-color: #9fcdff;"></span>' + o.filled + ' (' + progress + ' %)</td>';
                        trs += '<td>' + o.status + '</td>';
                        trs += '<td>              ' +
                            '  <a href="#" class="order-fill">fill</a> | ' +
                            '  <a href="#" class="order-cancel">cancel</a>' +
                            '</td>';
                        trs += '</tr>';
                    }
                    $('#orders_table tbody').html(trs);
                }
            });
        };
        updateValues();
        let intevalFunc = setInterval(updateValues, 5000);

        let requestAjax = function(url, data, logmsg = ''){
            clearInterval(intevalFunc);
            $.ajax({
                url: url,
                data: data,
                success: function(d) {
                    updateValues();
                    if(logmsg){
                        $('#logs').append(logmsg);
                    }
                },
                complete: function(){
                    intevalFunc = setInterval(updateValues, 5000);
                }
            });
        };

        let orderFill = function(tr, percent){
            let data = {
                id: tr.data('id'),
                percent: percent
            };
            let msg = '<div class="text-success">Preenche '+percent+'% da order '+data.id+'</div>';
            requestAjax('/api/order-fill', data, msg);
        };

        let orderCancel = function(tr){
            let msg = '<div class="text-warning">Cancela order '+tr.data('id')+'</div>';
            requestAjax('/api/order-cancel', {id: tr.data('id')}, msg);
        };

        let sellCurrency = function(tr){
            let msg = '<div class="text-info">Vende 100% de '+tr.data('currency')+'</div>';
            requestAjax('/api/sell-currency', {currency: tr.data('currency')}, msg);
        };

        $(document).on('click', '.order-fill', function () {
            let tr = $(this).closest('tr');
            let percent = window.prompt('Introduza um valor entre 0 e 100%');
            if(percent){
                orderFill(tr, percent);
            }
            return false;
        });

        $(document).on('click', '.order-cancel', function () {
            let tr = $(this).closest('tr');
            orderCancel(tr);
            return false;
        });

        $(document).on('click', '.sell-currency', function () {
            let tr = $(this).closest('tr');
            sellCurrency(tr);
            return false;
        });


        $(document).on('click', '.ajax-btn', function (e) {
            let url = $(this).data('url');
            if (!url) {
                return false;
            }
            let data = $(this).data('params') || {};
            let prompt = $(this).data('prompt');
            if(prompt){
                var iVal = window.prompt(prompt);
                if (iVal != null) {
                    data[$(this).data('input') || 'input'] = iVal;
                }
            }
            clearInterval(intevalFunc);
            $.ajax({
                url: url,
                data: data,
                success: function(data, textStatus) {
                    updateValues();
                },
                complete: function(){
                    intevalFunc = setInterval(updateValues, 5000);
                }
            });

            return false;
        });

        let simulateFills = function () {
            if(!$('#simulate:checked').length){
                return;
            }
            let btns = $('.order-fill, .sell-currency');
            if(!btns.length){
                return;
            }

            var a = btns[Math.floor(Math.random() * btns.length)];
            let tr = $(a).closest('tr');
            if(a.innerHTML == 'vende'){
                sellCurrency(tr);
            }
            else {
                orderFill(tr, (Math.random() * 30).toFixed(2));
            }
        };

        setInterval(simulateFills, 2000);
    },

    initBacktestPage: function(availableSeries, selectedSeries) {
        let count = 0;
        let paramCount = 0;
        let seriesOptions = {};

        for (let sKey in availableSeries) {
            let parts = sKey.split(':');
            let group;
            if(parts[0] === 'indicator'){
                group = 'Indicadores';
            }
            else if(parts[0] === 'strategy'){
                group = 'Estrategias';
            }
            else {
                group = 'Outros';
            }

            if(!seriesOptions[group]){
                seriesOptions[group] = {};
            }
            seriesOptions[group][sKey] = availableSeries[sKey].name;
        }

        const renderSerieParams = function(s, prefix){
            let o = '';

            for (let paramKey in s.params) {
                let param = s.params[paramKey];
                let v = param.value ? param.value : (param.default ? param.default : '');
                o += '<div class="form-group serie-param col-auto">\n';
                o += '    <label for="input_param_'+ paramCount +'">'+param.name+'</label>\n';
                if(param.type === 'select' && param.options){
                    o += '    <select name="'+prefix+'[p_'+paramKey+']" class="form-control" id="input_param_'+ paramCount +'">';
                    for (let optValue in param.options) {
                        o += '    <option ' + (optValue === v ? ' selected="selected"' : '') + ' value="' + optValue + '">' + param.options[optValue] + '</option>';
                    }
                    o += '    </select>';
                }
                else if(param.type === 'integer'){
                    o += '    <input name="'+prefix+'[p_'+paramKey+']" type="number" min="1" class="form-control" style="width: 120px;" id="input_param_'+ paramCount +'" value="'+v+'">\n';
                }
                else if(param.type === 'numeric'){
                    let step = param.step ? param.step : '0.01';
                    o += '    <input name="'+prefix+'[p_'+paramKey+']" type="number" step="'+step+'" min="0.00" class="form-control" style="width: 120px;" id="input_param_'+ paramCount +'" value="'+v+'">\n';
                }
                o += '  </div>';
                paramCount++;
            }
            return o;
        };

        const addSerieRow = function(selected){
            let sSerie = (selected && selected.value) ? selected.value : null;
            let $container = $('#series_content');
            let prefix = 'series['+count+']';

            let el = '';
            el += '  <div class="form-group col-auto serie-col">\n' +
                '    <label>Serie</label>\n' +
                '    <select class="form-control control-serie" name="' + prefix + '[serie]' + '" data-prefix="' + prefix + '">\n';
            for (let group in seriesOptions) {
                el += '  <optgroup label="' + group + '">\n';
                for (let key in seriesOptions[group]) {
                    el += '<option value="' + key +'" ' + (sSerie === key ? 'selected="selected"' : '') + '>' + seriesOptions[group][key] + '</option>';
                }
                el += '  </optgroup>\n';
            }
            el += '    </select>\n' +
                '  </div>';

            if(selected){
                el += renderSerieParams(selected, prefix);
            }
            let item = $('<li class="list-group-item"><div class="form-row">' + el + '</div><button class="remove float-right">X</button></li>');
            $container.append(item);

            if(!selected){
                item.find('select.control-serie:first').trigger('change');
            }

            count++;
        };

        $('.add_serie').on('click', function(){
            addSerieRow();
            return false;
        });

        $('#series_content').on('click', '.remove', function(){
            $(this).closest('.list-group-item').remove();
            return false;
        });

        $('#series_content').on('change', 'select.control-serie', function(){
            let select = $(this);
            let v = select.val();

            if(v){
                let sRow = select.closest('.form-row');
                sRow.find('.serie-param').remove();

                if(availableSeries[v]){
                    let ind = availableSeries[v];
                    let prefix = select.data('prefix');
                    sRow.append(renderSerieParams(ind, prefix));
                }
            }

            return false;
        });

        if($.isArray(selectedSeries)){
            for (let i = 0; i < selectedSeries.length; i++) {
                let selected = selectedSeries[i];
                let sKey = selected.serie;
                if(availableSeries[sKey]){
                    let sParams = jQuery.extend({}, availableSeries[sKey]);
                    sParams.value = sKey;
                    for(let pValue in selected){
                        if(pValue.substr(0, 2) === 'p_'){
                            let paramKey = pValue.substr(2);
                            if(sParams.params[paramKey]){
                                sParams.params[paramKey].value = selected[pValue];
                            }
                        }
                    }

                    addSerieRow(sParams);
                }
            }
        }

    }

};

window.app = app;