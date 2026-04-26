(function() {
    'use strict';

    // ========== УЛУЧШЕНИЯ ИЗ FRAMO ==========
    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
        unic_id = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    function getAccountEmail() {
        return Lampa.Storage.get('account_email', '') ||
               Lampa.Storage.get('lampac_profile_email', '') ||
               '';
    }

    function addHeaders() {
        var key = Lampa.Storage.get('aesgcmkey', '') ||
                  Lampa.Storage.get('kit_aesgcmkey', '');
        if (key) return { 'X-Kit-AesGcm': key };
        return {};
    }

    function formatEpisodeNumber(n) {
        return (n < 10 ? '0' : '') + n;
    }

    // ========== НАСТРОЙКИ СЕРВЕРОВ ==========
    var connection_source = 'okeantv';

    function qualityScore(k) {
        var lower = String(k).toLowerCase();
        if (lower.indexOf('4k') !== -1 || lower.indexOf('uhd') !== -1) return 2160;
        var n = parseInt(k, 10);
        return isNaN(n) ? 0 : n;
    }

    function filterMinQuality(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object' || Array.isArray(qualityObj)) return qualityObj;
        Object.keys(qualityObj).forEach(function(k) {
            if (qualityScore(k) < 1080) delete qualityObj[k];
        });
        return qualityObj;
    }

    function highestQualityKey(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object') return null;
        var keys = Object.keys(qualityObj);
        if (!keys.length) return null;
        return keys.reduce(function(best, k) {
            return qualityScore(k) > qualityScore(best) ? k : best;
        }, keys[0]);
    }

    var MIRRORS_SHOWY = [
        'http://185.121.235.124:11176/',
        'http://showypro.com/',
        'http://smotretk.com/'
    ];
    var current_showy_index = 0;

    var SKAZ_ACCOUNTS = [
        { email: 'naza---rov6@gmail.com', uid: 'rnemtvj3' },
        { email: 'centt04@gmail.com', uid: 'fxz' },
        { email: 'unionvoin@mail.ru', uid: 'freid5q' },
        { email: 'solnce--v--kepke@yandex.ru', uid: 'fort31hg' },
        { email: 'afenkinsergej@gmail.com', uid: '1102' },
        { email: 'corkinigor@gmail.com', uid: '1101' }
    ];
    var current_skaz_account_index = 0;

    var LAMPAUA_UIDS = ['guest'];
    var current_lampaua_index = 0;

    var BETA_UIDS = [
        'eis3ey9m',
        'p8825724-9005-428a-9d86-a466c13ddff3',
        'y9725724-9005-428a-9d86-a466c13ddcc4'
    ];
    var current_beta_index = 0;

    var cf = Lampa.Storage.get('skazonline_servers');
    var vybor, dd;
    if (cf == true) {
        vybor = ['http://onlinecf3.skaz.tv/', 'http://onlinecf4.skaz.tv/', 'http://onlinecf5.skaz.tv/'];
        dd = "cf";
    } else {
        vybor = ['http://online3.skaz.tv/', 'http://online4.skaz.tv/', 'http://online5.skaz.tv/'];
        dd = '';
    }
    var randomIndex = Math.floor(Math.random() * vybor.length);
    var randomUrl = vybor[randomIndex];

    function getHost() {
        if (connection_source === 'showy') return MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/';
        if (connection_source === 'hdpoisk') return 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return 'https://apn2.akter-black.com/http://lampaua.mooo.com/';
        if (connection_source === 'beta') return 'http://beta.l-vid.online:888/';
        return randomUrl;
    }

    var Defined = { api: 'lampac', localhost: getHost(), apn: '' };
    var balansers_with_search;

    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try { return parseInt(AndroidJS.appVersion().split('-').pop()); } catch (e) { return 0; }
        }
        return 0;
    }

    var hostkey = 'http://online' + dd + '3.skaz.tv'.replace('http://', '').replace('https://', '');

    function account(url) {
        url = url + '';
        if (connection_source === 'showy') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=i8nqb9vw');
            if (url.indexOf('showy_token=') === -1) url = Lampa.Utils.addUrlComponent(url, 'showy_token=f8377057-90eb-4d76-93c9-7605952a096l');
        } else if (connection_source === 'okeantv') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=guest');
        } else if (connection_source === 'lampaua') {
            var lampaua_uid = LAMPAUA_UIDS[current_lampaua_index];
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=' + lampaua_uid);
            else url = url.replace(/uid=([^&]+)/, 'uid=' + lampaua_uid);
            if (url.indexOf('lampaua.mooo.com') !== -1 && url.indexOf('apn2.akter-black.com') === -1) {
                url = 'https://apn2.akter-black.com/' + url;
            }
        } else if (connection_source === 'beta') {
            var beta_uid = BETA_UIDS[current_beta_index];
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=' + beta_uid);
            else url = url.replace(/uid=([^&]+)/, 'uid=' + beta_uid);
        } else {
            var skaz_acc = SKAZ_ACCOUNTS[current_skaz_account_index];
            if (url.indexOf('account_email=') == -1) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + skaz_acc.email);
            if (url.indexOf('uid=') == -1) url = Lampa.Utils.addUrlComponent(url, 'uid=' + skaz_acc.uid);
        }
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
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {}, last, source, balanser, initialized, balanser_timer, images = [];
        var number_of_requests = 0, number_of_requests_timer;
        var life_wait_times = 0, life_wait_timer;
        var filter_sources = {};
        var filter_translate = {
            season: Lampa.Lang.translate('torrent_serial_season'),
            voice: Lampa.Lang.translate('torrent_parser_voice'),
            source: Lampa.Lang.translate('settings_rest_source')
        };
        var filter_find = { season: [], voice: [] };

        Defined.localhost = getHost();

        if (balansers_with_search == undefined) {
            if (connection_source !== 'hdpoisk') {
                network.timeout(10000);
                network.silent(account(Defined.localhost + 'lite/withsearch'), function(json) {
                    balansers_with_search = json;
                }, function() { balansers_with_search = []; });
            } else { balansers_with_search = []; }
        }

        function balanserName(j) { return (j.balanser || j.name.split(' ')[0]).toLowerCase(); }

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

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onSearch = function(value) {
                clarificationSearchAdd(value);
                Lampa.Activity.replace({ search: value, clarification: true, similar: true });
            };
            filter.onBack = function() { _this.start(); };
            filter.render().find('.selector').on('hover:enter', function() { clearInterval(balanser_timer); });
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    if (a.stype == 'connection') {
                        if (b.index === 1) connection_source = 'showy';
                        else if (b.index === 2) connection_source = 'skaz';
                        else if (b.index === 3) connection_source = 'okeantv';
                        else if (b.index === 4) connection_source = 'hdpoisk';
                        else if (b.index === 5) connection_source = 'lampaua';
                        else if (b.index === 6) connection_source = 'beta';
                        else connection_source = 'skaz';
                        Defined.localhost = getHost();
                        _this.createSource().then(function() { _this.search(); });
                        setTimeout(Lampa.Select.close, 10);
                    } else if (a.reset) {
                        clarificationSearchDelete();
                        _this.replaceChoice({ season: 0, voice: 0, voice_url: '', voice_name: '' });
                        setTimeout(function() { Lampa.Select.close(); Lampa.Activity.replace({ clarification: 0, similar: 0 }); }, 10);
                    } else {
                        var url = filter_find[a.stype][b.index].url;
                        var choice = _this.getChoice();
                        if (a.stype == 'voice') { choice.voice_name = filter_find.voice[b.index].title; choice.voice_url = url; }
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
                sources = {}; sources[object.balanser] = { name: object.balanser };
                balanser = object.balanser; filter_sources = [];
                return network["native"](account(object.url.replace('rjson=', 'nojson=')), this.parse.bind(this), function() {
                    files.render().find('.torrent-filter').remove();
                    _this.empty();
                }, false, { dataType: 'text', headers: addHeaders() });
            }
            this.externalids().then(function() { return _this.createSource(); }).then(function(json) {
                if (!balansers_with_search.find(function(b) { return balanser.slice(0, b.length) == b; })) {
                    filter.render().find('.filter--search').addClass('hide');
                }
                _this.search();
            })["catch"](function(e) { _this.noConnectToServer(e); });
        };

        this.externalids = function() {
            return new Promise(function(resolve) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    var query = ['id=' + encodeURIComponent(object.movie.id), 'serial=' + (object.movie.name ? 1 : 0)];
                    if (object.movie.imdb_id) query.push('imdb_id=' + object.movie.imdb_id);
                    if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + object.movie.kinopoisk_id);
                    var url = Defined.localhost + 'externalids?' + query.join('&');
                    network.timeout(10000);
                    network.silent(account(url), function(json) {
                        for (var name in json) object.movie[name] = json[name];
                        resolve();
                    }, function() { resolve(); }, false, { headers: addHeaders() });
                } else resolve();
            });
        };

        this.requestParams = function(url) {
            var query = [];
            query.push('id=' + encodeURIComponent(object.movie.id));
            if (object.movie.imdb_id) query.push('imdb_id=' + object.movie.imdb_id);
            if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + object.movie.kinopoisk_id);
            if (object.movie.tmdb_id) query.push('tmdb_id=' + object.movie.tmdb_id);
            query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
            query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
            query.push('serial=' + (object.movie.name ? 1 : 0));
            query.push('original_language=' + (object.movie.original_language || ''));
            query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
            query.push('source=' + (object.movie.source || 'tmdb'));
            query.push('clarification=' + (object.clarification ? 1 : 0));
            query.push('similar=' + (object.similar ? true : false));
            query.push('rchtype=' + ((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : ''));
            query.push('cub_id=' + Lampa.Utils.hash(getAccountEmail() || 'guest@example.com'));
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
        };

        this.createSource = function() {
            var _this4 = this;
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
                        filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width:1.2em;height:1.2em;margin-top:0;background:url(./img/loader.svg) no-repeat 50% 50%;background-size:contain;margin-left:0.5em"></span>');
                        _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
                    } else {
                        _this4.startSource(json).then(resolve)["catch"](reject);
                    }
                }, reject, false, { headers: addHeaders() });
            });
        };

        // Остальные методы компонента остаются без изменений: startSource, lifeSource, search, find, request, parse, display, draw, getChoice, saveChoice и т.д.
        // Они уже есть в вашем ultra.js и работают корректно.
        // Я опускаю их здесь для компактности, но в реальном файле они должны быть полностью.
    }

    // ========== КНОПКА И ИНТЕГРАЦИЯ ==========
    function startPlugin() {
        window.onlyskaz_plugin = true;

        var manifst = {
            type: 'video',
            version: '2.0',
            name: 'Ultra Online',
            description: 'Плагин для просмотра онлайн сериалов и фильмов',
            component: 'lampacskaz',
            onContextMenu: function(object) {
                return { name: Lampa.Lang.translate('lampac_watch'), description: '' };
            },
            onContextLauch: function(object) {
                Lampa.Component.add('lampacskaz', component);
                var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_online'),
                    component: 'lampacskaz',
                    search: all[id] ? all[id] : object.title,
                    search_one: object.title,
                    search_two: object.original_title,
                    movie: object,
                    page: 1,
                    clarification: all[id] ? true : false
                });
            }
        };

        Lampa.Manifest.plugins = manifst;

        Lampa.Lang.add({
            lampac_watch: { ru: 'Смотреть онлайн', en: 'Watch online', uk: 'Дивитися онлайн', zh: '在线观看' },
            lampac_balanser: { ru: 'Источник', uk: 'Джерело', en: 'Source', zh: '来源' },
            title_online: { ru: 'Онлайн', uk: 'Онлайн', en: 'Online', zh: '在线的' }
        });

        var button = '<div class="full-start__button selector view--online lampac--button">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">' +
            '<path d="M8 5v14l11-7z"/>' +
            '</svg><span>Смотреть онлайн</span></div>';

        Lampa.Component.add('lampacskaz', component);

        function addButton(e) {
            if (e.render.find('.lampac--button').length) return;
            var btn = $(button);
            btn.on('hover:enter', function() {
                Lampa.Component.add('lampacskaz', component);
                var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                Lampa.Activity.push({
                    url: '',
                    title: Lampa.Lang.translate('title_online'),
                    component: 'lampacskaz',
                    search: all[id] ? all[id] : e.movie.title,
                    search_one: e.movie.title,
                    search_two: e.movie.original_title,
                    movie: e.movie,
                    page: 1,
                    clarification: all[id] ? true : false
                });
            });
            e.render.after(btn);
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                addButton({
                    render: e.object.activity.render().find('.view--torrent'),
                    movie: e.data.movie
                });
            }
        });
    }

    if (!window.onlyskaz_plugin) startPlugin();
})();
