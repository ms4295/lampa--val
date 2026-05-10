(function() {
    // --- ТВОЙ VPS ДЛЯ ОБХОДА БЛОКИРОВОК ---
    var my_proxy = 'http://34.40.76.104:9118/proxy/';
    
    var connection_source = 'ab2024'; 

    var AB_TOKENS = ['мар.31', 'TotalᴬᵂUK0PRIMETEAM', 'сентябрь', 'июнь99'];
    var current_ab_token_index = 0;

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
        { email: 'corkinigor@gmail.com', uid: '1101' },
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

    var HDPOISK_TOKEN = '720fbdfd04f4cb54579a9875fd9289';

    var cf = Lampa.Storage.get('skazonline_servers');
    if (cf == true) {
        var vybor = ['http://onlinecf3.skaz.tv/', 'http://onlinecf4.skaz.tv/', 'http://onlinecf5.skaz.tv/'];
        var dd = "cf";
    } else {
        var vybor = ['http://online3.skaz.tv/', 'http://online4.skaz.tv/', 'http://online5.skaz.tv/'];
        var dd = '';
    }
    var randomUrl = vybor[Math.floor(Math.random() * vybor.length)];

    // Исправленный Helper для получения хоста через прокси
    function getHost() {
        if (connection_source === 'ab2024') return my_proxy + 'https://ab2024.ru/';
        if (connection_source === 'showy') return my_proxy + MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/'; // Прямой IP обычно не в блоке
        if (connection_source === 'hdpoisk') return my_proxy + 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return my_proxy + 'http://lampaua.mooo.com/';
        if (connection_source === 'beta') return my_proxy + 'http://beta.l-vid.online:888/';
        return my_proxy + randomUrl; 
    }

    var Defined = {
        api: 'lampac',
        localhost: getHost(),
        apn: ''
    };

    var balansers_with_search;
    var unic_id = 'rnemtvj3';

    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try {
                var current = AndroidJS.appVersion().split('-');
                return parseInt(current.pop());
            } catch (e) { return 0; }
        } else return 0;
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
                net.silent(my_proxy + host + '/cors/check', function() { check(true); }, function() { check(false); }, false, { dataType: 'text' });
            }
        } else call();
    };

    function account(url) {
        url = url + '';
        if (connection_source === 'ab2024') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=4ezu837o');
            var token = AB_TOKENS[current_ab_token_index];
            url = Lampa.Utils.addUrlComponent(url, 'ab_token=' + encodeURIComponent(token));
        } 
        else if (connection_source === 'showy') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=i8nqb9vw');
            url = Lampa.Utils.addUrlComponent(url, 'showy_token=f8377057-90eb-4d76-93c9-7605952a096l');
        }
        else if (connection_source === 'okeantv') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=guest');
        }
        else if (connection_source === 'lampaua') {
            var lampaua_uid = LAMPAUA_UIDS[current_lampaua_index];
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + lampaua_uid);
        }
        else if (connection_source === 'beta') {
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + BETA_UIDS[current_beta_index]);
        }
        else if (connection_source === 'skaz') {
            var skaz_acc = SKAZ_ACCOUNTS[current_skaz_account_index];
            url = Lampa.Utils.addUrlComponent(url, 'account_email=' + skaz_acc.email);
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + skaz_acc.uid);
        }

        if (url.indexOf('nws_id=') == -1 && window.rch_nws && window.rch_nws[hostkey]) {
            var nws_id = window.rch_nws[hostkey].connectionId || Lampa.Storage.get('lampac_nws_id', '');
            if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
        }
        return url;
    }

    // Сохраняем оригинальную логику Network и Component, просто подменяя вызовы через account(getHost())
    var Network = Lampa.Reguest;
    function component(object) {
        var network = new Network();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {};
        var balanser;

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            Defined.localhost = getHost();

            filter.onSelect = function(type, a, b) {
                if (type == 'filter' && a.stype == 'connection') {
                    var map = ['ab2024', 'showy', 'skaz', 'okeantv', 'hdpoisk', 'lampaua', 'beta'];
                    connection_source = map[b.index] || 'skaz';
                    Defined.localhost = getHost();
                    _this.createSource().then(function(){ _this.search(); });
                    setTimeout(Lampa.Select.close, 10);
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    _this.changeBalanser(a.source);
                }
            };

            this.externalids().then(function() {
                return _this.createSource();
            }).then(function() {
                _this.search();
            }).catch(function(e) {
                console.log('Connect error', e);
            });
        };

        this.externalids = function() {
            return new Promise(function(resolve) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    var url = account(Defined.localhost + 'externalids?id=' + object.movie.id);
                    network.silent(url, function(json) {
                        for (var name in json) object.movie[name] = json[name];
                        resolve();
                    }, resolve);
                } else resolve();
            });
        };

        this.requestParams = function(url) {
            if (connection_source === 'hdpoisk') return 'http://108.165.164.64:3000/api?kp=' + (object.movie.kinopoisk_id || object.movie.id);
            var query = 'id=' + object.movie.id + '&title=' + encodeURIComponent(object.movie.title || object.movie.name) + '&serial=' + (object.movie.name ? 1 : 0) + '&cub_id=' + Lampa.Utils.hash('aru@gmail.com');
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query;
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                var url = account(_this.requestParams(Defined.localhost + 'lite/events'));
                network.silent(url, function(json) {
                    if (json.online) {
                        json.online.forEach(function(j) {
                            var name = (j.balanser || j.name).toLowerCase();
                            sources[name] = { url: j.url, name: j.name };
                        });
                        var keys = Object.keys(sources);
                        balanser = Lampa.Storage.get('online_balanser', keys[0]);
                        resolve();
                    } else reject();
                }, reject);
            });
        };

        this.search = function() {
            var _this = this;
            this.loading(true);
            var url = account(this.requestParams(sources[balanser].url));
            network.native(url, function(json) {
                _this.loading(false);
                if (json.items) {
                    files.appendFiles(json.items);
                    Lampa.Controller.enable('content');
                }
            }, function() { _this.loading(false); });
        };

        this.render = function() { return files.render(); };
        this.loading = function(status) { /* стандартный лоадер */ };
    }

    Lampa.Component.add('lampac', component);
})();
