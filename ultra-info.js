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
                reject(new Error('Ошибка подключения к серверу VoKino'));
            }, false, { dataType: 'json' });
        });
    }

    function getValidToken() {
        var token = Lampa.Storage.get('vokino_token', '');
        var tokenDate = Lampa.Storage.get('vokino_token_date', 0);
        var now = Date.now();
        var maxAge = 24 * 60 * 60 * 1000;

        if (token && (now - tokenDate) < maxAge) {
            return Promise.resolve(token);
        }

        var login = Lampa.Storage.get('vokino_login', '');
        var password = Lampa.Storage.get('vokino_password', '');

        if (!login || !password) {
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
                    onBack: function() {
                        reject(new Error('Авторизация отменена'));
                    }
                });
            });
        }

        return getVoKinoToken(login, password);
    }

    function init() {
        function addVoKinoButton(e) {
            try {
                var container = $('.full-start__buttons, .view--torrent');
                if (!container.length) return;
                if (container.find('.vokino-button').length) return;

                var movie = e.data.movie || e.data || {};
                if (!movie || !movie.title) return;

                var btn = $('<div class="full-start__button selector vokino-button">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24">' +
                    '<path d="M8 5v14l11-7z"/>' +
                    '</svg>' +
                    '<span>VoKino</span>' +
                    '</div>');

                btn.on('hover:enter', function() {
                    getValidToken().then(function(token) {
                        Lampa.Activity.push({
                            url: '',
                            title: 'VoKino - ' + (movie.title || movie.name),
                            component: 'online',
                            movie: movie,
                            page: 1,
                            search: movie.title || movie.name,
                            clarification: false,
                            source: 'vokino',
                            vokinotk_token: token
                        });
                    }).catch(function(err) {
                        Lampa.Noty.show('VoKino: ' + (err.message || 'Ошибка авторизации'));
                    });
                });

                container.append(btn);
            } catch (err) {
                console.log('VoKino button error:', err);
            }
        }

        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                setTimeout(function() { addVoKinoButton(e); }, 500);
            }
        });

        try {
            if (Lampa.Activity.active().component === 'full') {
                var active = Lampa.Activity.active();
                setTimeout(function() {
                    addVoKinoButton({
                        data: { movie: active.card || active.movie || {} }
                    });
                }, 500);
            }
        } catch (err) {}

        console.log('VoKino плагин активирован ✅');
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
