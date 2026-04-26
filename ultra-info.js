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
        if (token && (Date.now() - tokenDate) < 86400000) return Promise.resolve(token);

        var login = Lampa.Storage.get('vokino_login', '');
        var password = Lampa.Storage.get('vokino_password', '');
        if (login && password) return getVoKinoToken(login, password);

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

    function addButton(movie) {
        console.log('VoKino: пытаюсь добавить кнопку');
        console.log('VoKino: movie =', movie.title || movie.name);

        var container = document.querySelector('.full-start__buttons');
        console.log('VoKino: .full-start__buttons =', container);

        if (!container) {
            container = document.querySelector('.full-start');
            console.log('VoKino: .full-start =', container);
        }

        if (!container) {
            console.log('VoKino: контейнер не найден! Ищем все div на странице...');
            var allDivs = document.querySelectorAll('div');
            for (var i = 0; i < Math.min(allDivs.length, 20); i++) {
                var cls = allDivs[i].className;
                if (cls && cls.indexOf('button') !== -1) {
                    console.log('VoKino: найден div с button в классе:', cls);
                }
            }
            return;
        }

        if (container.querySelector('.vokino-btn')) {
            console.log('VoKino: кнопка уже есть');
            return;
        }

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector vokino-btn';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24"><path d="M8 5v14l11-7z"/></svg><span>VoKino</span>';
        btn.onclick = function() {
            getValidToken().then(function(token) {
                var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                Lampa.Activity.push({
                    url: '',
                    title: 'VoKino',
                    component: 'lampacskaz',
                    search: all[id] ? all[id] : movie.title,
                    movie: movie,
                    page: 1
                });
            }).catch(function(err) {
                Lampa.Noty.show('VoKino: ' + err.message);
            });
        };

        container.appendChild(btn);
        console.log('VoKino: кнопка добавлена ✅');
    }

    function init() {
        console.log('VoKino: плагин загружен, ждём full');

        Lampa.Listener.follow('full', function(e) {
            console.log('VoKino: событие full, type =', e.type);

            if (e.type === 'complite') {
                var movie = e.data.movie || e.data;
                console.log('VoKino: complite, movie =', movie);

                setTimeout(function() { addButton(movie); }, 500);
                setTimeout(function() { addButton(movie); }, 1000);
                setTimeout(function() { addButton(movie); }, 2000);
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
