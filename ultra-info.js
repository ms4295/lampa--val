(function() {
    'use strict';

    var token = '';
    var tokenDate = 0;
    var currentMovie = null;

    function getToken() {
        return new Promise(function(resolve, reject) {
            var now = Date.now();
            if (token && (now - tokenDate) < 86400000) { resolve(token); return; }

            var login = Lampa.Storage.get('vokino_login', '');
            var password = Lampa.Storage.get('vokino_password', '');

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
            Lampa.Reguest().silent(
                'http://148.135.207.174:12359/lite/vokinotk?login=' + encodeURIComponent(l) + '&password=' + encodeURIComponent(p),
                function(r) {
                    if (r && r.token) {
                        token = r.token; tokenDate = Date.now();
                        Lampa.Storage.set('vokino_login', l);
                        Lampa.Storage.set('vokino_password', p);
                        resolve(token);
                    } else { reject(new Error('Неверный ответ')); }
                },
                function() { reject(new Error('Сервер недоступен')); },
                false, { dataType: 'json' }
            );
        });
    }

    function askCredentials(resolve, reject) {
        Lampa.Prompt.show({
            title: 'VoKino — вход',
            fields: [
                { name: 'login', type: 'text', placeholder: 'Логин' },
                { name: 'password', type: 'password', placeholder: 'Пароль' }
            ],
            onResult: function(r) {
                if (r && r.login && r.password) {
                    fetchToken(r.login, r.password).then(resolve).catch(function(e) {
                        Lampa.Noty.show(e.message); reject(e);
                    });
                } else { reject(new Error('Отмена')); }
            },
            onBack: function() { reject(new Error('Отмена')); }
        });
    }

    function searchVoKino() {
        if (!currentMovie) return;
        Lampa.Loading.start();

        getToken().then(function(tok) {
            var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(currentMovie.title || currentMovie.name) + '&vokinotk_token=' + tok;
            Lampa.Reguest().silent(url, function(json) {
                Lampa.Loading.stop();
                if (!json || !json.online || !json.online.length) {
                    Lampa.Noty.show('Ничего не найдено');
                    return;
                }
                showResults(json.online);
            }, function() {
                Lampa.Loading.stop();
                Lampa.Noty.show('Ошибка поиска');
            }, false, { dataType: 'json' });
        }).catch(function(e) {
            Lampa.Loading.stop();
            if (e.message !== 'Отмена') Lampa.Noty.show(e.message);
        });
    }

    function showResults(sources) {
        var items = [];
        for (var i = 0; i < sources.length; i++) {
            var s = sources[i];
            if (!s.url) continue;
            var name = s.name || s.title || s.quality || ('Источник ' + (i + 1));
            items.push({ title: name, url: s.url });
        }
        if (!items.length) { Lampa.Noty.show('Нет доступных ссылок'); return; }

        Lampa.Select.show({
            title: 'VoKino — результаты',
            items: items,
            onSelect: function(item) {
                Lampa.Select.close();
                playUrl(item.url);
            }
        });
    }

    function playUrl(url) {
        Lampa.Loading.start();
        Lampa.Reguest().silent(url, function(json) {
            Lampa.Loading.stop();
            var video = (json && json.url) ? json.url : url;
            Lampa.Player.play({ title: currentMovie.title || 'VoKino', url: video, isonline: true });
        }, function() {
            Lampa.Loading.stop();
            Lampa.Noty.show('Ошибка получения видео');
        }, false, { dataType: 'json' });
    }

    function createButton(movie) {
        if (!movie || !movie.title) return;
        currentMovie = movie;
        var old = document.getElementById('vokino-btn');
        if (old) old.remove();

        var btn = document.createElement('div');
        btn.id = 'vokino-btn';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;width:56px;height:56px;border-radius:50%;background:#e53935;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;box-shadow:0 2px 10px rgba(229,57,53,0.5);';
        btn.innerHTML = '▶';
        btn.onclick = searchVoKino;
        document.body.appendChild(btn);
    }

    function init() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() { createButton(e.data.movie || e.data); }, 600);
            }
        });
        Lampa.Listener.follow('activity', function(e) {
            if (e.type === 'back') {
                var b = document.getElementById('vokino-btn');
                if (b) b.remove();
                currentMovie = null;
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
