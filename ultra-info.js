(function() {
    'use strict';

    var token = '';
    var currentMovie = null;

    function getToken() {
        return new Promise(function(resolve, reject) {
            if (token) { resolve(token); return; }

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
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://148.135.207.174:12359/lite/vokinotk?login=' + encodeURIComponent(l) + '&password=' + encodeURIComponent(p), true);
            xhr.timeout = 10000;
            xhr.onload = function() {
                try {
                    var r = JSON.parse(xhr.responseText);
                    if (r && r.token) {
                        token = r.token;
                        Lampa.Storage.set('vokino_login', l);
                        Lampa.Storage.set('vokino_password', p);
                        resolve(token);
                    } else {
                        reject(new Error('Неверный логин или пароль'));
                    }
                } catch(e) {
                    reject(new Error('Ошибка ответа сервера'));
                }
            };
            xhr.onerror = function() { reject(new Error('Сервер недоступен')); };
            xhr.ontimeout = function() { reject(new Error('Таймаут')); };
            xhr.send();
        });
    }

    function askCredentials(resolve, reject) {
        // Простое окно через prompt (без Lampa API)
        var login = prompt('VoKino — введите логин или email:');
        if (!login) { reject(new Error('Отмена')); return; }
        var password = prompt('VoKino — введите пароль:');
        if (!password) { reject(new Error('Отмена')); return; }

        fetchToken(login, password).then(resolve).catch(function(err) {
            alert('Ошибка: ' + err.message);
            reject(err);
        });
    }

    function searchVoKino() {
        if (!currentMovie) return;

        getToken().then(function(tok) {
            var title = currentMovie.title || currentMovie.name || '';
            var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(title) + '&vokinotk_token=' + tok;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = 15000;
            xhr.onload = function() {
                try {
                    var json = JSON.parse(xhr.responseText);
                    if (!json || !json.online || !json.online.length) {
                        alert('VoKino: ничего не найдено');
                        return;
                    }
                    showResults(json.online);
                } catch(e) {
                    alert('Ошибка обработки ответа');
                }
            };
            xhr.onerror = function() { alert('Ошибка поиска'); };
            xhr.ontimeout = function() { alert('Таймаут поиска'); };
            xhr.send();
        }).catch(function(err) {
            if (err.message !== 'Отмена') alert('VoKino: ' + err.message);
        });
    }

    function showResults(sources) {
        // Строим простой список ссылок
        var html = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.95);overflow-y:auto;padding:20px;">';
        html += '<h2 style="color:#fff;margin-bottom:20px;">VoKino — результаты</h2>';
        html += '<button onclick="this.parentElement.remove()" style="position:absolute;top:10px;right:10px;background:#e53935;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Закрыть</button>';

        for (var i = 0; i < sources.length; i++) {
            var s = sources[i];
            if (!s.url) continue;
            var name = s.name || s.title || ('Источник ' + (i + 1));
            html += '<div style="background:#222;color:#fff;padding:12px;margin:8px 0;border-radius:6px;cursor:pointer;" onclick="var v=document.createElement(\'video\');v.src=\'' + s.url + '\';v.controls=true;v.autoplay=true;v.style.cssText=\'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:#000;\';document.body.appendChild(v);this.parentElement.remove();">' + name + '</div>';
        }

        html += '</div>';
        document.body.insertAdjacentHTML('beforeend', html);
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
                setTimeout(function() {
                    createButton(e.data.movie || e.data);
                }, 600);
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
