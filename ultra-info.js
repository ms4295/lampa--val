(function() {
    'use strict';

    var token = '';
    var tokenDate = 0;
    var login = '';
    var password = '';

    function getToken() {
        return new Promise(function(resolve, reject) {
            var now = Date.now();
            
            // Если токен ещё свежий (меньше суток)
            if (token && (now - tokenDate) < 86400000) {
                resolve(token);
                return;
            }

            // Если есть сохранённые логин и пароль
            if (!login) login = Lampa.Storage.get('vokino_login', '');
            if (!password) password = Lampa.Storage.get('vokino_password', '');

            if (login && password) {
                fetchToken(login, password).then(resolve).catch(function() {
                    // Если сохранённые данные не подошли — просим новые
                    askCredentials(resolve, reject);
                });
            } else {
                askCredentials(resolve, reject);
            }
        });
    }

    function fetchToken(l, p) {
        return new Promise(function(resolve, reject) {
            var r = new Lampa.Reguest();
            r.timeout(10000);
            r.silent(
                'http://148.135.207.174:12359/lite/vokinotk?login=' + encodeURIComponent(l) + '&password=' + encodeURIComponent(p),
                function(resp) {
                    if (resp && resp.token) {
                        token = resp.token;
                        tokenDate = Date.now();
                        login = l;
                        password = p;
                        Lampa.Storage.set('vokino_login', l);
                        Lampa.Storage.set('vokino_password', p);
                        resolve(token);
                    } else {
                        reject(new Error('Неверный ответ сервера'));
                    }
                },
                function() { reject(new Error('Сервер недоступен')); },
                false,
                { dataType: 'json' }
            );
        });
    }

    function askCredentials(resolve, reject) {
        Lampa.Prompt.show({
            title: 'VoKino — вход',
            fields: [
                { name: 'login', type: 'text', placeholder: 'Логин или email' },
                { name: 'password', type: 'password', placeholder: 'Пароль' }
            ],
            onResult: function(r) {
                if (r && r.login && r.password) {
                    fetchToken(r.login, r.password).then(resolve).catch(function(err) {
                        Lampa.Noty.show('Ошибка: ' + err.message);
                        reject(err);
                    });
                } else {
                    reject(new Error('Отменено'));
                }
            },
            onBack: function() { reject(new Error('Отменено')); }
        });
    }

    function searchAndPlay(movie) {
        Lampa.Loading.start();

        getToken().then(function(tok) {
            var title = movie.title || movie.name || '';
            var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(title) + '&vokinotk_token=' + tok;

            var r = new Lampa.Reguest();
            r.timeout(15000);
            r.silent(url, function(json) {
                Lampa.Loading.stop();

                if (!json || !json.online || !json.online.length) {
                    Lampa.Noty.show('VoKino: ничего не найдено');
                    return;
                }

                // Пропускаем источники с show === false
                var sources = [];
                for (var i = 0; i < json.online.length; i++) {
                    var s = json.online[i];
                    if (s.show !== false && s.url) {
                        sources.push(s);
                    }
                }

                if (!sources.length) {
                    Lampa.Noty.show('VoKino: нет доступных источников');
                    return;
                }

                // Если есть несколько — даём выбрать
                if (sources.length === 1) {
                    playSource(sources[0], movie);
                } else {
                    showSourceMenu(sources, movie);
                }

            }, function() {
                Lampa.Loading.stop();
                Lampa.Noty.show('VoKino: ошибка поиска');
            }, false, { dataType: 'json' });
        }).catch(function(err) {
            Lampa.Loading.stop();
            if (err.message !== 'Отменено') {
                Lampa.Noty.show('VoKino: ' + err.message);
            }
        });
    }

    function showSourceMenu(sources, movie) {
        var items = [];
        for (var i = 0; i < sources.length; i++) {
            var s = sources[i];
            var label = 'Источник ' + (i + 1);
            if (s.name) label = s.name;
            if (s.title) label = s.title;
            items.push({
                title: label,
                source: s,
                movie: movie
            });
        }

        Lampa.Select.show({
            title: 'VoKino — выбор источника',
            items: items,
            onSelect: function(item) {
                Lampa.Select.close();
                playSource(item.source, item.movie);
            },
            onBack: function() {
                Lampa.Select.close();
            }
        });
    }

    function playSource(source, movie) {
        Lampa.Loading.start();

        var playUrl = source.url;
        var r = new Lampa.Reguest();
        r.timeout(10000);
        r.silent(playUrl, function(json) {
            Lampa.Loading.stop();

            var videoUrl = '';
            if (json && json.url) {
                videoUrl = json.url;
            } else if (json && typeof json === 'string') {
                videoUrl = json;
            } else {
                videoUrl = playUrl;
            }

            if (videoUrl) {
                Lampa.Player.play({
                    title: movie.title || movie.name || 'VoKino',
                    url: videoUrl,
                    isonline: true,
                    iptv: true
                });
            } else {
                Lampa.Noty.show('Не удалось получить ссылку');
            }
        }, function() {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка загрузки');
        }, false, { dataType: 'json' });
    }

    function addButton(movie) {
        // Ищем контейнер с иконками действий
        var container = document.querySelector('.full-start__actions');
        if (!container) container = document.querySelector('.full__actions');
        if (!container) container = document.querySelector('.card__actions');
        if (!container) return;
        if (container.querySelector('.vokino-btn')) return;

        var btn = document.createElement('div');
        btn.className = 'vokino-btn';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.1);cursor:pointer;margin:4px 0;';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>';
        btn.title = 'VoKino (платный)';
        btn.onclick = function() { searchAndPlay(movie); };

        container.appendChild(btn);
    }

    function init() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var movie = e.data.movie || e.data;
                if (movie && movie.title) {
                    setTimeout(function() { addButton(movie); }, 600);
                    setTimeout(function() { addButton(movie); }, 1200);
                }
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
