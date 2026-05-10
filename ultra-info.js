(function() {
    // --- НАСТРОЙКИ СЕРВЕРОВ ---
    var connection_source = 'ab2024'; 
    var my_vps = 'http://34.40.76.104:9118/proxy/'; // Твой Lampac как прокси-шлюз

    // AB2024
    var AB_TOKENS = ['мар.31', 'TotalᴬᵂUK0PRIMETEAM', 'сентябрь', 'июнь99'];
    var current_ab_token_index = 0;

    // Showy
    var MIRRORS_SHOWY = [
        'http://185.121.235.124:11176/',
        'http://showypro.com/',
        'http://smotretk.com/'
    ];
    var current_showy_index = 1; // Ставим showypro.com

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
    var BETA_UIDS = ['eis3ey9m', 'p8825724-9005-428a-9d86-a466c13ddff3', 'y9725724-9005-428a-9d86-a466c13ddcc4'];
    var current_beta_index = 0;

    // Skaz (Инициализация зеркал)
    var cf = Lampa.Storage.get('skazonline_servers');
    var vybor = cf ? ['http://onlinecf3.skaz.tv/', 'http://onlinecf4.skaz.tv/'] : ['http://online3.skaz.tv/', 'http://online4.skaz.tv/'];
    var randomUrl = vybor[Math.floor(Math.random() * vybor.length)];

    // --- ИСПРАВЛЕННЫЙ GETHOST ДЛЯ ОБХОДА БЛОКИРОВОК ---
    function getHost() {
        if (connection_source === 'ab2024') return my_vps + 'https://ab2024.ru/';
        if (connection_source === 'showy') return my_vps + MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/'; // Оставляем прямой IP, он обычно не в блоке
        if (connection_source === 'hdpoisk') return 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return my_vps + 'http://lampaua.mooo.com/';
        if (connection_source === 'beta') return my_vps + 'http://beta.l-vid.online:888/';
        return my_vps + randomUrl; 
    }

    var Defined = {
        api: 'lampac',
        localhost: getHost(),
        apn: ''
    };

    var balansers_with_search;
    var unic_id = 'rnemtvj3';

    // --- АВТОРИЗАЦИЯ И ФИКС 4K ---
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
            // ФИКС ДЛЯ ВОКИНО 4К: заменяем guest на твой рабочий UID
            if (url.indexOf('uid=') === -1 || url.indexOf('uid=guest') !== -1) {
                url = url.replace('uid=guest', '');
                url = Lampa.Utils.addUrlComponent(url, 'uid=rnemtvj3');
            }
        }
        else if (connection_source === 'lampaua') {
            var lampaua_uid = LAMPAUA_UIDS[current_lampaua_index];
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + lampaua_uid);
        }
        else if (connection_source === 'beta') {
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + BETA_UIDS[current_beta_index]);
        }
        else {
            var skaz_acc = SKAZ_ACCOUNTS[current_skaz_account_index];
            url = Lampa.Utils.addUrlComponent(url, 'account_email=' + skaz_acc.email);
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + skaz_acc.uid);
        }

        // РЕЙТИНГ И КУБ
        if (url.indexOf('nws_id=') == -1) {
            var nws_id = Lampa.Storage.get('lampac_nws_id', '');
            if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
        }
        return url;
    }

    // --- ОСТАЛЬНАЯ ЛОГИКА КОМПОНЕНТА (БЕЗ ИЗМЕНЕНИЙ) ---
    var Network = Lampa.Reguest;

    function component(object) {
        var network = new Network();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {};
        var balanser;
        var filter_sources = [];

        Defined.localhost = getHost();

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            
            filter.onSelect = function(type, a, b) {
                if (type == 'filter' && a.stype == 'connection') {
                    var sources_map = ['ab2024', 'showy', 'skaz', 'okeantv', 'hdpoisk', 'lampaua', 'beta'];
                    connection_source = sources_map[b.index] || 'skaz';
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
                console.log('Error start', e);
            });
        };

        this.externalids = function() {
            return new Promise(function(resolve) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    var url = Defined.localhost + 'externalids?id=' + object.movie.id;
                    network.silent(account(url), function(json) {
                        for (var name in json) object.movie[name] = json[name];
                        resolve();
                    }, resolve);
                } else resolve();
            });
        };

        this.requestParams = function(url) {
            if (connection_source === 'hdpoisk') {
                return 'http://108.165.164.64:3000/api?kp=' + (object.movie.kinopoisk_id || object.movie.id);
            }
            var query = [
                'id=' + object.movie.id,
                'title=' + encodeURIComponent(object.movie.title || object.movie.name),
                'serial=' + (object.movie.name ? 1 : 0),
                'cub_id=' + Lampa.Utils.hash('aru@gmail.com')
            ];
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                var url = _this.requestParams(Defined.localhost + 'lite/events');
                network.silent(account(url), function(json) {
                    if (json.online) {
                        json.online.forEach(function(j) {
                            var name = (j.balanser || j.name).toLowerCase();
                            sources[name] = { url: j.url, name: j.name, show: j.show };
                        });
                        filter_sources = Object.keys(sources);
                        balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
                        resolve();
                    } else reject();
                }, reject);
            });
        };

        this.search = function() {
            var _this = this;
            this.loading(true);
            var url = this.requestParams(sources[balanser].url);
            network.native(account(url), function(json) {
                _this.parse(json);
            }, function() {
                _this.empty();
            });
        };

        this.parse = function(json) {
            this.loading(false);
            if (json.items && json.items.length) {
                files.appendFiles(json.items);
                Lampa.Controller.enable('content');
            } else this.empty();
        };

        this.empty = function() {
            this.loading(false);
            files.appendFiles([]); // Показать "пусто"
        };

        this.loading = function(status) {
            if (status) scroll.render().find('.lampac_loading').removeClass('hide');
            else scroll.render().find('.lampac_loading').addClass('hide');
        };

        this.render = function() {
            return files.render();
        };
    }

    Lampa.Component.add('lampac', component);
})();
