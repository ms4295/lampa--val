(function() {
    'use strict';

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
                reject(new Error('Ошибка подключения'));
            }, false, { dataType: 'json' });
        });
    }

    function getValidToken() {
        var token = Lampa.Storage.get('vokino_token', '');
        var tokenDate = Lampa.Storage.get('vokino_token_date', 0);

        if (token && (Date.now() - tokenDate) < 86400000) {
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

    function tryAddButton() {
        if (document.querySelector('.vokino-btn')) return;

        var container = document.querySelector('.full-start__buttons');
        if (!container) container = document.querySelector('.view--torrent');
        if (!container) container = document.querySelector('.full-start');
        if (!container) return;

        var movie = window.lampa_current_movie;
        if (!movie) {
            var full = Lampa.Activity.active();
            if (full && full.card) movie = full.card;
        }
        if (!movie || !movie.title) return;

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector vokino-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24" style="margin-right:8px;"><path d="M8 5v14l11-7z"/></svg><span>VoKino</span>';
        btn.onclick = function() {
            getValidToken().then(function(token) {
                var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                Lampa.Activity.push({
                    url: '',
                    title: 'VoKino - ' + movie.title,
                    component: 'lampacskaz',
                    search: all[id] ? all[id] : movie.title,
                    search_one: movie.title,
                    search_two: movie.original_title,
                    movie: movie,
                    page: 1,
                    clarification: all[id] ? true : false,
                    vokinotk_token: token
                });
            }).catch(function(err) {
                Lampa.Noty.show('VoKino: ' + err.message);
            });
        };

        container.appendChild(btn);
    }

    function init() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                window.lampa_current_movie = e.data.movie || e.data;
                setTimeout(tryAddButton, 300);
                setTimeout(tryAddButton, 800);
                setTimeout(tryAddButton, 1500);
            }
        });

        console.log('VoKino готов ✅');
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
