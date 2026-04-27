(function() {
    'use strict';

    var token = '';
    var tokenDate = 0;
    var login = '';
    var password = '';
    var currentMovie = null;

    function getToken() {
        return new Promise(function(resolve, reject) {
            var now = Date.now();
            if (token && (now - tokenDate) < 86400000) {
                resolve(token);
                return;
            }

            if (!login) login = Lampa.Storage.get('vokino_login', '');
            if (!password) password = Lampa.Storage.get('vokino_password', '');

            if (login && password) {
                fetchToken(login, password).then(resolve).catch(function() {
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

    function searchAndPlay() {
        if (!currentMovie || !currentMovie.title) {
            Lampa.Noty.show('Нет данных о фильме');
            return;
        }

        Lampa.Loading.start();

        getToken().then(function(tok) {
            var title = currentMovie.title || currentMovie.name || '';
            var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(title) + '&vokinotk_token=' + tok;

            var r = new Lampa.Reguest();
            r.timeout(15000);
            r.silent(url, function(json) {
                Lampa.Loading.stop();

                if (!json || !json.online || !json.online.length) {
                    Lampa.Noty.show('VoKino: ничего не найдено');
                    return;
                }

                var sources = [];
                for (var i = 0; i < json.online.length; i++) {
                    if (json.online[i].show !== false && json.online[i].url) {
                        sources.push(json.online[i]);
                    }
                }

                if (!sources.length) {
                    Lampa.Noty.show('VoKino: нет источников');
                    return;
                }

                if (sources.length === 1) {
                    playSource(sources[0]);
                } else {
                    var items = [];
                    for (var j = 0; j < sources.length; j++) {
                        items.push({
                            title: sources[j].name || sources[j].title || ('Источник ' + (j + 1)),
                            src: sources[j]
                        });
                    }
                    Lampa.Select.show({
                        title: 'VoKino — выбор',
                        items: items,
                        onSelect: function(item) {
                            Lampa.Select.close();
                            playSource(item.src);
                        },
                        onBack: function() { Lampa.Select.close(); }
                    });
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

    function playSource(source) {
        Lampa.Loading.start();
        var r = new Lampa.Reguest();
        r.timeout(10000);
        r.silent(source.url, function(json) {
            Lampa.Loading.stop();
            var videoUrl = (json && json.url) ? json.url : source.url;
            Lampa.Player.play({
                title: currentMovie.title || currentMovie.name || 'VoKino',
                url: videoUrl,
                isonline: true,
                iptv: true
            });
        }, function() {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка загрузки ссылки');
        }, false, { dataType: 'json' });
    }

    function createButton(movie) {
        if (!movie || !movie.title) return;
        currentMovie = movie;

        // Удаляем старую кнопку если есть
        var old = document.getElementById('vokino-float-btn');
        if (old) old.remove();

        var btn = document.createElement('div');
        btn.id = 'vokino-float-btn';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;width:56px;height:56px;border-radius:50%;background:#ff4444;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 15px rgba(255,68,68,0.5);font-size:24px;';
        btn.innerHTML = '▶';
        btn.title = 'VoKino (платный)';
        btn.onclick = searchAndPlay;

        document.body.appendChild(btn);
    }

    function init() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                var movie = e.data.movie || e.data;
                setTimeout(function() { createButton(movie); }, 500);
            }
        });

        // Убираем кнопку при уходе из карточки
        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'back') {
                var btn = document.getElementById('vokino-float-btn');
                if (btn) btn.remove();
                currentMovie = null;
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
