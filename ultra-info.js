(function () {
    'use strict';

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var files   = new Lampa.Explorer(object);
        var filter  = new Lampa.Filter(object);
        var sources = {};
        var balanser;
        var filter_sources = [];
        
        // ТВОЙ VPS ДЛЯ ОБХОДА БЛОКИРОВОК
        var proxy_path = 'http://34.40.76.104:9118/proxy/';
        
        // Логика выбора источника
        var connection_source = Lampa.Storage.get('lampac_connection_source', 'ab2024');

        function getHost() {
            if (connection_source === 'ab2024') return proxy_path + 'https://ab2024.ru/';
            if (connection_source === 'showy')  return proxy_path + 'http://showypro.com/';
            if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/';
            if (connection_source === 'lampaua') return proxy_path + 'http://lampaua.mooo.com/';
            return proxy_path + 'http://online3.skaz.tv/';
        }

        function account(url) {
            url = url + '';
            if (connection_source === 'okeantv') {
                // ФИКС ДЛЯ ВОКИНО 4К (Твой UID вместо guest)
                url = Lampa.Utils.addUrlComponent(url, 'uid=rnemtvj3');
            } else if (connection_source === 'ab2024') {
                url = Lampa.Utils.addUrlComponent(url, 'uid=4ezu837o&ab_token=%D0%BC%D0%B0%D1%80.31');
            } else {
                // По умолчанию UID Сказа
                url = Lampa.Utils.addUrlComponent(url, 'uid=rnemtvj3&account_email=naza---rov6@gmail.com');
            }
            return url;
        }

        this.create = function () {
            var _this = this;
            this.loading(true);

            // Получаем список источников (Lite/Events)
            var base_url = getHost() + 'lite/events';
            var query = 'id=' + object.movie.id + '&title=' + encodeURIComponent(object.movie.title || object.movie.name) + '&serial=' + (object.movie.name ? 1 : 0);
            
            network.silent(account(Lampa.Utils.addUrlComponent(base_url, query)), function (json) {
                if (json.online && json.online.length) {
                    json.online.forEach(function (j) {
                        var name = (j.balanser || j.name).toLowerCase();
                        sources[name] = { url: j.url, name: j.name };
                    });
                    
                    filter_sources = Object.keys(sources);
                    balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
                    
                    _this.search();
                } else {
                    _this.empty();
                }
            }, function () {
                _this.empty();
            });

            return files.render();
        };

        this.search = function () {
            var _this = this;
            this.loading(true);
            var url = sources[balanser].url;
            var query = 'id=' + object.movie.id + '&title=' + encodeURIComponent(object.movie.title || object.movie.name) + '&serial=' + (object.movie.name ? 1 : 0);

            network.native(account(Lampa.Utils.addUrlComponent(url, query)), function (json) {
                _this.loading(false);
                if (json.items && json.items.length) {
                    files.appendFiles(json.items);
                    Lampa.Controller.enable('content');
                } else {
                    _this.empty();
                }
            }, function () {
                _this.empty();
            });
        };

        this.empty = function () {
            this.loading(false);
            files.appendFiles([]);
        };

        this.loading = function (status) {
            if (status) Lampa.Select.show({container: files.render(), filter: filter.render()});
            else Lampa.Select.hide();
        };

        this.render = function () {
            return files.render();
        };
    }

    // РЕГИСТРАЦИЯ ПЛАГИНА
    if (!window.lampac_initialized) {
        Lampa.Component.add('lampac', component);

        // Добавляем кнопку в карточку фильма
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector button--online" data-action="lampac"><span>Онлайн</span></div>');
                btn.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Онлайн',
                        component: 'lampac',
                        movie: e.data.movie,
                        page: 1
                    });
                });
                e.object.render().find('.full-start__buttons').append(btn);
            }
        });
        window.lampac_initialized = true;
    }
})();
