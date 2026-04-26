(function() {
    'use strict';

    // ========== АВТОРИЗАЦИЯ ==========
    function getVoKinoToken(login, password) {
        return new Promise(function(resolve, reject) {
            var network = new Lampa.Reguest();
            var url = 'http://148.135.207.174:12359/lite/vokinotk?login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password);
            network.timeout(10000);
            network.silent(url, function(response) {
                if (response && response.token) {
                    Lampa.Storage.set('vokino_token', response.token);
                    Lampa.Storage.set('vokino_token_date', Date.now());
                    resolve(response.token);
                } else {
                    reject(new Error('Неверный логин или пароль'));
                }
            }, function() {
                reject(new Error('Ошибка подключения к серверу VoKino'));
            }, false, { dataType: 'json' });
        });
    }

    function getValidToken() {
        var token = Lampa.Storage.get('vokino_token', '');
        var tokenDate = Lampa.Storage.get('vokino_token_date', 0);
        var now = Date.now();

        if (token && (now - tokenDate) < 86400000) {
            return Promise.resolve(token);
        }

        var login = Lampa.Storage.get('vokino_login', '');
        var password = Lampa.Storage.get('vokino_password', '');

        if (login && password) {
            return getVoKinoToken(login, password);
        }

        return new Promise(function(resolve, reject) {
            Lampa.Prompt.show({
                title: 'Вход в VoKino',
                fields: [
                    { name: 'login', type: 'text', placeholder: 'Email или логин' },
                    { name: 'password', type: 'password', placeholder: 'Пароль' }
                ],
                onResult: function(result) {
                    if (result && result.login && result.password) {
                        Lampa.Storage.set('vokino_login', result.login);
                        Lampa.Storage.set('vokino_password', result.password);
                        getVoKinoToken(result.login, result.password).then(resolve).catch(reject);
                    } else {
                        reject(new Error('Данные не введены'));
                    }
                },
                onBack: function() { reject(new Error('Отмена')); }
            });
        });
    }

    // ========== КОМПОНЕНТ ДЛЯ ВОКИНО ==========
    function vokinoComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div class="vokino-container" style="padding:1em;"></div>');

        this.create = function() {
            return html;
        };

        this.start = function() {
            Lampa.Controller.enable('content');
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');

            getValidToken().then(function(token) {
                searchVoKino(token);
            }).catch(function(err) {
                html.html('<div style="text-align:center;padding:2em;color:#fff;">' +
                    '<p>Ошибка авторизации VoKino</p>' +
                    '<p style="color:#aaa;">' + err.message + '</p>' +
                    '</div>');
            });
        };

        function searchVoKino(token) {
            html.html('<div style="text-align:center;padding:2em;color:#fff;">Поиск VoKino...</div>');

            var title = object.search || object.movie.title || object.movie.name || '';
            var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(title) + '&vokinotk_token=' + token;

            network.timeout(15000);
            network.silent(url, function(json) {
                if (!json || !json.online || !json.online.length) {
                    html.html('<div style="text-align:center;padding:2em;color:#fff;">Ничего не найдено</div>');
                    return;
                }

                var sources = json.online.filter(function(s) { return s.show !== false; });
                if (!sources.length) {
                    html.html('<div style="text-align:center;padding:2em;color:#fff;">Нет доступных источников</div>');
                    return;
                }

                scroll.body().empty();
                sources.forEach(function(source) {
                    var url = source.url;
                    if (source.files && source.files.length) {
                        source.files.forEach(function(file) {
                            addFileItem(file, url);
                        });
                    }
                });

                html.empty();
                html.append(scroll.render());
                Lampa.Controller.collectionSet(scroll.render());

                if (!scroll.body().children().length) {
                    html.html('<div style="text-align:center;padding:2em;color:#fff;">Ничего не найдено</div>');
                }

            }, function() {
                html.html('<div style="text-align:center;padding:2em;color:#fff;">Ошибка поиска</div>');
            }, false, { dataType: 'json' });
        }

        function addFileItem(file, baseUrl) {
            var item = $('<div class="vokino-item selector" style="padding:1em;margin:0.5em 0;background:rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;">' +
                '<div style="font-size:1.2em;font-weight:700;">' + (file.title || file.name || 'Источник') + '</div>' +
                '<div style="color:#aaa;font-size:0.9em;">' + (file.quality || file.translation || '') + '</div>' +
                '</div>');

            item.on('hover:enter', function() {
                playFile(file, baseUrl);
            });

            scroll.append(item);
        }

        function playFile(file, baseUrl) {
            var playUrl = file.url;
            if (playUrl && playUrl.indexOf('http') !== 0) {
                playUrl = baseUrl + playUrl;
            }

            if (file.method === 'play' || !file.method) {
                Lampa.Player.play({
                    title: file.title || object.movie.title,
                    url: playUrl,
                    quality: file.quality || {},
                    subtitles: file.subtitles || [],
                    isonline: true,
                    iptv: true
                });
            } else {
                network.silent(playUrl, function(json) {
                    if (json && json.url) {
                        Lampa.Player.play({
                            title: file.title || object.movie.title,
                            url: json.url,
                            quality: json.quality || file.quality || {},
                            subtitles: json.subtitles || file.subtitles || [],
                            isonline: true,
                            iptv: true
                        });
                    } else {
                        Lampa.Noty.show('Не удалось получить ссылку');
                    }
                }, function() {
                    Lampa.Noty.show('Ошибка загрузки');
                }, false, { dataType: 'json' });
            }
        }

        this.destroy = function() {
            network.clear();
            scroll.destroy();
        };
    }

    // ========== КНОПКА ==========
    function init() {
        Lampa.Component.add('vokino_online', vokinoComponent);

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            setTimeout(function() {
                var container = document.querySelector('.full-start__buttons');
                if (!container) return;
                if (container.querySelector('.vokino-btn')) return;

                var movie = e.data.movie || e.data;
                if (!movie || !movie.title) return;

                var btn = document.createElement('div');
                btn.className = 'full-start__button selector vokino-btn';
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24"><path d="M8 5v14l11-7z"/></svg><span>VoKino</span>';
                btn.onclick = function() {
                    var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
                    var all = Lampa.Storage.get('clarification_search', '{}');
                    Lampa.Activity.push({
                        url: '',
                        title: 'VoKino',
                        component: 'vokino_online',
                        search: all[id] ? all[id] : movie.title,
                        movie: movie,
                        page: 1
                    });
                };

                container.appendChild(btn);
            }, 500);
        });

        console.log('VoKino плагин готов ✅');
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
