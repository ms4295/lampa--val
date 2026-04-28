(function() {
    // --- НАСТРОЙКИ СЕРВЕРОВ (ИЗ SKAZ.JS) ---
    var connection_source = 'showy'; // ПАТЧ: переключено на Showy (работает)

    // ПАТЧ: численная оценка качества (4K/UHD считаются как 2160)
    function qualityScore(k) {
        var lower = String(k).toLowerCase();
        if (lower.indexOf('4k') !== -1 || lower.indexOf('uhd') !== -1) return 2160;
        var n = parseInt(k, 10);
        return isNaN(n) ? 0 : n;
    }

    // ПАТЧ: фильтр качества — скрыть всё ниже 1080p из списка качеств плеера и источников
    function filterMinQuality(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object' || Array.isArray(qualityObj)) return qualityObj;
        Object.keys(qualityObj).forEach(function(k) {
            if (qualityScore(k) < 1080) delete qualityObj[k];
        });
        return qualityObj;
    }

    // ПАТЧ: ключ с самым высоким качеством (для автовыбора 4K → 1440 → 1080)
    function highestQualityKey(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object') return null;
        var keys = Object.keys(qualityObj);
        if (!keys.length) return null;
        return keys.reduce(function(best, k) {
            return qualityScore(k) > qualityScore(best) ? k : best;
        }, keys[0]);
    }

    // AB2024
    var AB_TOKENS = ['мар.31', 'TotalᴬᵂUK0PRIMETEAM', 'сентябрь', 'июнь99'];
    var current_ab_token_index = 0;

    // Showy
    var MIRRORS_SHOWY = [
        'http://185.121.235.124:11176/',
        'http://showypro.com/',
        'http://smotretk.com/'
    ];
    var current_showy_index = 0;

    // Skaz Accounts Rotation
    var SKAZ_ACCOUNTS = [
        { email: 'naza---rov6@gmail.com', uid: 'rnemtvj3' },
        { email: 'centt04@gmail.com', uid: 'fxz' },
        { email: 'unionvoin@mail.ru', uid: 'freid5q' },
        { email: 'solnce--v--kepke@yandex.ru', uid: 'fort31hg' },
        { email: 'afenkinsergej@gmail.com', uid: '1102' },
        { email: 'corkinigor@gmail.com', uid: '1101' },
    ];
    var current_skaz_account_index = 0;

    // LampaUA Accounts Rotation
    var LAMPAUA_UIDS = ['guest'];
    var current_lampaua_index = 0;

    // Beta L-Vid Accounts Rotation
    var BETA_UIDS = [
        'eis3ey9m',
        'p8825724-9005-428a-9d86-a466c13ddff3',
        'y9725724-9005-428a-9d86-a466c13ddcc4'
    ];
    var current_beta_index = 0;

    // HD Poisk Config
    var HDPOISK_TOKEN = '720fbdfd04f4cb54579a9875fd9289';

    // Skaz (Инициализация зеркал)
    var cf = Lampa.Storage.get('skazonline_servers');
    if (cf == true) {
        var vybor = [
            'http://onlinecf3.skaz.tv/',
            'http://onlinecf4.skaz.tv/',
            'http://onlinecf5.skaz.tv/'
        ];
        var dd = "cf";
    } else {
        var vybor = [
            'http://online3.skaz.tv/',
            'http://online4.skaz.tv/',
            'http://online5.skaz.tv/'
        ];
        var dd = '';
    }
    var randomIndex = Math.floor(Math.random() * vybor.length);
    var randomUrl = vybor[randomIndex];

    // Helper для получения текущего хоста
    function getHost() {
        if (connection_source === 'ab2024') return 'https://ab2024.ru/';
        if (connection_source === 'showy') return MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/';
        if (connection_source === 'hdpoisk') return 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return 'https://apn2.akter-black.com/http://lampaua.mooo.com/';
        if (connection_source === 'beta') return 'http://beta.l-vid.online:888/';
        return randomUrl; // Skaz
    }

    var Defined = {
        api: 'lampac',
        localhost: getHost(), // Динамический хост
        apn: ''
    };

    var balansers_with_search;

    // Хардкод UID для Skaz
    var unic_id = 'rnemtvj3';

    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try {
                var current = AndroidJS.appVersion().split('-');
                return parseInt(current.pop());
            } catch (e) {
                return 0;
            }
        } else {
            return 0;
        }
    }

    var hostkey = 'http://online' + dd + '3.skaz.tv'.replace('http://', '').replace('https://', '');

    if (!window.rch_nws || !window.rch_nws[hostkey]) {
        if (!window.rch_nws) window.rch_nws = {};

        window.rch_nws[hostkey] = {
            type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
            startTypeInvoke: false,
            rchRegistry: false,
            apkVersion: getAndroidVersion()
        };
    }

    window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
        if (!window.rch_nws[hostkey].startTypeInvoke) {
            window.rch_nws[hostkey].startTypeInvoke = true;

            var check = function check(good) {
                window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
                call();
            };

            if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
            else {
                var net = new Lampa.Reguest();
                net.silent('http://online' + dd + '3.skaz.tv'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
                    check(true);
                }, function() {
                    check(false);
                }, false, {
                    dataType: 'text'
                });
            }
        } else call();
    };

    window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
        window.rch_nws[hostkey].typeInvoke('http://online' + dd + '3.skaz.tv', function() {

            client.invoke("RchRegistry", {
                version: 154,
                host: location.host,
                rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
                apkVersion: window.rch_nws[hostkey].apkVersion,
                player: Lampa.Storage.field('player'),
                account_email: 'nazarov6@gmail.com',
                unic_id: 'rnemtvj3',
                profile_id: Lampa.Storage.get('lampac_profile_id', ''),
                token: ''
            });

            if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
                if (startConnection) startConnection();
                return;
            }

            window.rch_nws[hostkey].rchRegistry = true;

            client.on('RchRegistry', function(clientIp) {
                if (startConnection) startConnection();
            });

            client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
                var network = new Lampa.Reguest();

                function sendResult(uri, html) {
                    $.ajax({
                        url: 'http://online' + dd + '3.skaz.tv/rch/' + uri + '?id=' + rchId,
                        type: 'POST',
                        data: html,
                        async: true,
                        cache: false,
                        contentType: false,
                        processData: false,
                        success: function(j) {},
                        error: function() {
                            client.invoke("RchResult", rchId, '');
                        }
                    });
                }

                function result(html) {
                    if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
                        html = JSON.stringify(html);
                    }

                    if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
                        var compressionStream = new CompressionStream('gzip');
                        var encoder = new TextEncoder();
                        var readable = new ReadableStream({
                            start: function(controller) {
                                controller.enqueue(encoder.encode(html));
                                controller.close();
                            }
                        });
                        var compressedStream = readable.pipeThrough(compressionStream);
                        new Response(compressedStream).arrayBuffer()
                            .then(function(compressedBuffer) {
                                var compressedArray = new Uint8Array(compressedBuffer);
                                if (compressedArray.length > html.length) {
                                    sendResult('result', html);
                                } else {
                                    sendResult('gzresult', compressedArray);
                                }
                            })
                            .catch(function() {
                                sendResult('result', html);
                            });

                    } else {
                        sendResult('result', html);
                    }
                }

                if (url == 'eval') {
                    console.log('RCH', url, data);
                    result(eval(data));
                } else if (url == 'evalrun') {
                    console.log('RCH', url, data);
                    eval(data);
                } else if (url == 'ping') {
                    result('pong');
                } else {
                    console.log('RCH', url);
                    network["native"](url, result, function(e) {
                        console.log('RCH', 'result empty, ' + e.status);
                        result('');
                    }, data, {
                        dataType: 'text',
                        timeout: 1000 * 8,
                        headers: headers,
                        returnHeaders: returnHeaders
                    });
                }
            });

            client.on('Connected', function(connectionId) {
                console.log('RCH', 'ConnectionId: ' + connectionId);
                window.rch_nws[hostkey].connectionId = connectionId;
            });
            client.on('Closed', function() {
                console.log('RCH', 'Connection closed');
            });
            client.on('Error', function(err) {
                console.log('RCH', 'error:', err);
            });
        });
    };
    /* ПАТЧ: отключён вызов skaz.tv при инициализации (домен заблокирован у провайдера) */
    /* window.rch_nws[hostkey].typeInvoke('http://online' + dd + '3.skaz.tv', function() {}); */

    function rchInvoke(json, call) {
        if (window.nwsClient && window.nwsClient[hostkey] && window.nwsClient[hostkey]._shouldReconnect) {
            call();
            return;
        }
        if (!window.nwsClient) window.nwsClient = {};
        if (window.nwsClient[hostkey] && window.nwsClient[hostkey].socket)
            window.nwsClient[hostkey].socket.close();
        window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
            autoReconnect: false
        });
        window.nwsClient[hostkey].on('Connected', function(connectionId) {
            window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
                call();
            });
        });
        window.nwsClient[hostkey].connect();
    }

    function rchRun(json, call) {
        if (typeof NativeWsClient == 'undefined') {
            Lampa.Utils.putScript(["http://online" + dd + "3.skaz.tv/js/nws-client-es5.js?v18112025"], function() {}, false, function() {
                rchInvoke(json, call);
            }, true);
        } else {
            rchInvoke(json, call);
        }
    }

    function account(url) {
        url = url + '';
        
        // --- АВТОРИЗАЦИЯ НА ОСНОВЕ ВЫБРАННОГО СЕРВЕРА ---
        if (connection_source === 'ab2024') {
            // Логика AB2024
            if (url.indexOf('uid=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=4ezu837o');
            }
            var token = AB_TOKENS[current_ab_token_index];
            if (url.indexOf('ab_token=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'ab_token=' + encodeURIComponent(token));
            } else {
                url = url.replace(/ab_token=([^&]+)/, 'ab_token=' + encodeURIComponent(token));
            }
        } 
        else if (connection_source === 'showy') {
            // Логика Showy
            if (url.indexOf('uid=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=i8nqb9vw');
            }
            if (url.indexOf('showy_token=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'showy_token=f8377057-90eb-4d76-93c9-7605952a096l');
            }
        }
        else if (connection_source === 'okeantv') {
            // Логика OkeanTV
            if (url.indexOf('uid=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=guest');
            }
        }
        else if (connection_source === 'hdpoisk') {
            // Логика HD Poisk - API URL формируется в requestParams
        }
        else if (connection_source === 'lampaua') {
            // Логика LampaUA
            var lampaua_uid = LAMPAUA_UIDS[current_lampaua_index];
            if (url.indexOf('uid=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=' + lampaua_uid);
            } else {
                url = url.replace(/uid=([^&]+)/, 'uid=' + lampaua_uid);
            }

            // --- ДОБАВЛЕНИЕ ПРОКСИ ДЛЯ LAMPAUA (ЕСЛИ ЗАПРОС ИДЕТ НА ОСНОВНОЙ ДОМЕН) ---
            if (url.indexOf('lampaua.mooo.com') !== -1 && url.indexOf('apn2.akter-black.com') === -1) {
                url = 'https://apn2.akter-black.com/' + url;
            }
        }
        else if (connection_source === 'beta') {
            // Логика Beta
            var beta_uid = BETA_UIDS[current_beta_index];
            if (url.indexOf('uid=') === -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=' + beta_uid);
            } else {
                url = url.replace(/uid=([^&]+)/, 'uid=' + beta_uid);
            }
        }
        else {
            // Логика Skaz с ротацией
            var skaz_acc = SKAZ_ACCOUNTS[current_skaz_account_index];

            if (url.indexOf('account_email=') == -1) {
                url = Lampa.Utils.addUrlComponent(url, 'account_email=' + skaz_acc.email);
            }
            if (url.indexOf('uid=') == -1) {
                url = Lampa.Utils.addUrlComponent(url, 'uid=' + skaz_acc.uid);
            }
        }

        // Общие параметры
        if (connection_source !== 'hdpoisk') { 
            if (url.indexOf('token=') == -1) {
                var token = '';
                if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
            }
            if (url.indexOf('nws_id=') == -1 && window.rch_nws && window.rch_nws[hostkey]) {
                var nws_id = window.rch_nws[hostkey].connectionId || Lampa.Storage.get('lampac_nws_id', '');
                if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
            }
        }
        return url;
    }

    var Network = Lampa.Reguest;

    function component(object) {
        var network = new Network();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {};
        var last;
        var source;
        var balanser;
        var initialized;
        var balanser_timer;
        var images = [];
        var number_of_requests = 0;
        var number_of_requests_timer;
        var life_wait_times = 0;
        var life_wait_timer;
        var filter_sources = {};
        var filter_translate = {
            season: Lampa.Lang.translate('torrent_serial_season'),
            voice: Lampa.Lang.translate('torrent_parser_voice'),
            source: Lampa.Lang.translate('settings_rest_source')
        };
        var filter_find = {
            season: [],
            voice: []
        };

        // Обновляем Defined.localhost при инициализации компонента
        Defined.localhost = getHost();

        if (balansers_with_search == undefined) {
            if (connection_source !== 'hdpoisk') {
                network.timeout(10000);
                network.silent(account(Defined.localhost + 'lite/withsearch'), function(json) {
                    balansers_with_search = json;
                }, function() {
                    balansers_with_search = [];
                });
            } else {
                 balansers_with_search = [];
            }
        }

        function balanserName(j) {
            var bals = j.balanser;
            var name = j.name.split(' ')[0];
            return (bals || name).toLowerCase();
        }

        function clarificationSearchAdd(value) {
            var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
            var all = Lampa.Storage.get('clarification_search', '{}');

            all[id] = value;

            Lampa.Storage.set('clarification_search', all);
        }

        function clarificationSearchDelete() {
            var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
            var all = Lampa.Storage.get('clarification_search', '{}');

            delete all[id];

            Lampa.Storage.set('clarification_search', all);
        }

        function clarificationSearchGet() {
            var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
            var all = Lampa.Storage.get('clarification_search', '{}');

            return all[id];
        }

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onSearch = function(value) {

                clarificationSearchAdd(value);

                Lampa.Activity.replace({
                    search: value,
                    clarification: true,
                    similar: true
                });
            };
            filter.onBack = function() {
                _this.start();
            };
            filter.render().find('.selector').on('hover:enter', function() {
                clearInterval(balanser_timer);
            });
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    // --- ОБРАБОТКА ВЫБОРА СЕРВЕРА ---
                    if (a.stype == 'connection') {
                        if (b.index === 0) connection_source = 'ab2024';
                        else if (b.index === 1) connection_source = 'showy';
                        else if (b.index === 2) connection_source = 'skaz';
                        else if (b.index === 3) connection_source = 'okeantv';
                        else if (b.index === 4) connection_source = 'hdpoisk';
                        else if (b.index === 5) connection_source = 'lampaua';
                        else if (b.index === 6) connection_source = 'beta';
                        else connection_source = 'skaz';
                        
                        // Сброс и перезагрузка
                        Defined.localhost = getHost();
                        _this.createSource().then(function(){
                             _this.search();
                        });
                        setTimeout(Lampa.Select.close, 10);
                    } 
                    else if (a.reset) {
                        clarificationSearchDelete();

                        _this.replaceChoice({
                            season: 0,
                            voice: 0,
                            voice_url: '',
                            voice_name: ''
                        });
                        setTimeout(function() {
                            Lampa.Select.close();
                            Lampa.Activity.replace({
                                clarification: 0,
                                similar: 0
                            });
                        }, 10);
                    } else {
                        var url = filter_find[a.stype][b.index].url;
                        var choice = _this.getChoice();
                        if (a.stype == 'voice') {
                            choice.voice_name = filter_find.voice[b.index].title;
                            choice.voice_url = url;
                        }
                        choice[a.stype] = b.index;
                        _this.saveChoice(choice);
                        _this.reset();
                        _this.request(url);
                        setTimeout(Lampa.Select.close, 10);
                    }
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    object.lampac_custom_select = a.source;
                    _this.changeBalanser(a.source);
                }
            };
            if (filter.addButtonBack) filter.addButtonBack();
            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
            scroll.body().addClass('torrent-list');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.loading(false);
            if (object.balanser) {
                files.render().find('.filter--search').remove();
                sources = {};
                sources[object.balanser] = {
                    name: object.balanser
                };
                balanser = object.balanser;
                filter_sources = [];

                return network["native"](account(object.url.replace('rjson=', 'nojson=')), this.parse.bind(this), function() {
                    files.render().find('.torrent-filter').remove();
                    _this.empty();
                }, false, {
                    dataType: 'text',
                    headers: {
                        'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')
                    }
                });
            }
            this.externalids().then(function() {
                return _this.createSource();
            }).then(function(json) {
                if (balansers_with_search && !balansers_with_search.find(function(b) {
                        return balanser.slice(0, b.length) == b;
                    })) {
                    filter.render().find('.filter--search').addClass('hide');
                }
                _this.search();
            })["catch"](function(e) {
                _this.noConnectToServer(e);
            });
        };
        this.rch = function(json, noreset) {
            var _this2 = this;
            rchRun(json, function() {
                if (!noreset) _this2.find();
                else noreset();
            });
        };
        this.externalids = function() {
            return new Promise(function(resolve, reject) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    var query = [];
                    query.push('id=' + encodeURIComponent(object.movie.id));
                    query.push('serial=' + (object.movie.name ? 1 : 0));
                    if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
                    if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
                    var url = Defined.localhost + 'externalids?' + query.join('&');
                    
                    if (connection_source === 'hdpoisk') {
                         resolve();
                         return;
                    }
                    
                    var headers = {};
                    if(connection_source !== 'hdpoisk') {
                         headers['X-Kit-AesGcm'] = Lampa.Storage.get('aesgcmkey', '');
                    }

                    network.timeout(10000);
                    network.silent(account(url), function(json) {
                        for (var name in json) {
                            object.movie[name] = json[name];
                        }
                        resolve();
                    }, function() {
                        resolve();
                    }, false, {
                        headers: headers
                    });
                } else resolve();
            });
        };
        this.updateBalanser = function(balanser_name) {
            var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
            last_select_balanser[object.movie.id] = balanser_name;
            Lampa.Storage.set('online_last_balanser', last_select_balanser);
        };
        this.changeBalanser = function(balanser_name) {
            this.updateBalanser(balanser_name);
            Lampa.Storage.set('online_balanser', balanser_name);
            var to = this.getChoice(balanser_name);
            var from = this.getChoice();
            if (from.voice_name) to.voice_name = from.voice_name;
            this.saveChoice(to, balanser_name);
            Lampa.Activity.replace();
        };
        this.requestParams = function(url) {
            // ДЛЯ HD POISK НАПРАВЛЯЕМ ЗАПРОС API ЧЕРЕЗ НАШ СЕРВЕР
            if (connection_source === 'hdpoisk') {
                var myVpsIp = '108.165.164.64';
                return 'http://' + myVpsIp + ':3000/api?kp=' + (object.movie.kinopoisk_id || object.movie.id);
            }

            var query = [];
            var card_source = object.movie.source || 'tmdb'; 
            query.push('id=' + encodeURIComponent(object.movie.id));

            var query = [];
            var card_source = object.movie.source || 'tmdb'; 
            query.push('id=' + encodeURIComponent(object.movie.id));
            if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
            if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
            if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));
            query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
            query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
            query.push('serial=' + (object.movie.name ? 1 : 0));
            query.push('original_language=' + (object.movie.original_language || ''));
            query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
            query.push('source=' + card_source);
            query.push('clarification=' + (object.clarification ? 1 : 0));
            query.push('similar=' + (object.similar ? true : false));
            query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
            // Hardcoded cub_id
            query.push('cub_id=' + Lampa.Utils.hash('aru@gmail.com'));
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
        };
        this.getLastChoiceBalanser = function() {
            var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
            if (last_select_balanser[object.movie.id]) {
                return last_select_balanser[object.movie.id];
            } else {
                return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
            }
        };
        this.startSource = function(json) {
            return new Promise(function(resolve, reject) {
                json.forEach(function(j) {
                    var name = balanserName(j);
                    sources[name] = {
                        url: j.url,
                        name: j.name,
                        show: typeof j.show == 'undefined' ? true : j.show
                    };
                });
                filter_sources = Lampa.Arrays.getKeys(sources);
                if (filter_sources.length) {
                    var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
                    if (last_select_balanser[object.movie.id]) {
                        balanser = last_select_balanser[object.movie.id];
                    } else {
                        balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
                    }
                    if (!sources[balanser]) balanser = filter_sources[0];
                    if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
                    source = sources[balanser].url;
                    Lampa.Storage.set('active_balanser', balanser);
                    resolve(json);
                } else {
                    reject();
                }
            });
        };
        this.lifeSource = function() {
            var _this3 = this;
            return new Promise(function(resolve, reject) {
                var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
                var red = false;
                var gou = function gou(json, any) {
                    if (json.accsdb) return reject(json);
                    var last_balanser = _this3.getLastChoiceBalanser();
                    if (!red) {
                        var _filter = json.online.filter(function(c) {
                            return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
                        });
                        if (_filter.length) {
                            red = true;
                            resolve(json.online.filter(function(c) {
                                return c.show;
                            }));
                        } else if (any) {
                            reject();
                        }
                    }
                };
                var fin = function fin(call) {
                    network.timeout(3000);
                    network.silent(account(url), function(json) {
                        life_wait_times++;
                        filter_sources = [];
                        sources = {};
                        json.online.forEach(function(j) {
                            var name = balanserName(j);
                            sources[name] = {
                                url: j.url,
                                name: j.name,
                                show: typeof j.show == 'undefined' ? true : j.show
                            };
                        });
                        filter_sources = Lampa.Arrays.getKeys(sources);
                        filter.set('sort', filter_sources.map(function(e) {
                            return {
                                title: sources[e].name,
                                source: e,
                                selected: e == balanser,
                                ghost: !sources[e].show
                            };
                        }));
                        filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
                        gou(json);
                        var lastb = _this3.getLastChoiceBalanser();
                        if (life_wait_times > 15 || json.ready) {
                            filter.render().find('.lampac-balanser-loader').remove();
                            gou(json, true);
                        } else if (!red && sources[lastb] && sources[lastb].show) {
                            gou(json, true);
                            life_wait_timer = setTimeout(fin, 1000);
                        } else {
                            life_wait_timer = setTimeout(fin, 1000);
                        }
                    }, function() {
                        life_wait_times++;
                        if (life_wait_times > 15) {
                            reject();
                        } else {
                            life_wait_timer = setTimeout(fin, 1000);
                        }
                    }, false, {
                        headers: {
                            'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')
                        }
                    });
                };
                fin();
            });
        };
        // ВОЗВРАЩАЕМ ЗАПРОС LITE/EVENTS
        this.createSource = function() {
            var _this4 = this;
            if (connection_source === 'hdpoisk') {
                return new Promise(function(resolve, reject){
                     _this4.startSource([{name: 'HDPoisk', url: 'hdpoisk_api', show: true}]).then(resolve);
                });
            }

            return new Promise(function(resolve, reject) {
                var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
                network.timeout(15000);
                network.silent(account(url), function(json) {
                    if (json.accsdb) return reject(json);
                    if (json.life) {
                        _this4.memkey = json.memkey;
                        if (json.title) {
                            if (object.movie.name) object.movie.name = json.title;
                            if (object.movie.title) object.movie.title = json.title;
                        }
                        filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
                        _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
                    } else {
                        _this4.startSource(json).then(resolve)["catch"](reject);
                    }
                }, reject, false, {
                    headers: {
                        'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')
                    }
                });
            });
        };
        /**
         * Подготовка
         */
        this.create = function() {
            return this.render();
        };
        /**
         * Начать поиск
         */
        this.search = function() { 
            this.filter({
                source: filter_sources
            }, this.getChoice());
            this.find();
        };
        this.find = function() {
            this.request(this.requestParams(source));
        };
        this.request = function(url) {
            var _this = this;

            function runRequest() {
                number_of_requests++;
                if (number_of_requests < 10) {
                    var headers = {};
                    if (connection_source !== 'hdpoisk') {
                         headers['X-Kit-AesGcm'] = Lampa.Storage.get('aesgcmkey', '');
                    }

                    network["native"](account(url), _this.parse.bind(_this), function(e) {
                        // Обработка ошибки с ротацией для Skaz
                        if (connection_source === 'skaz' && current_skaz_account_index < SKAZ_ACCOUNTS.length - 1) {
                            console.log('Skaz:
