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
        // НЕ добавляем в верхнее меню — проверяем что мы в карточке фильма
        if (!movie || !movie.title) return;

        // Ищем контейнер с кнопками действий в карточке
        var container = document.querySelector('.full-start__actions');
        if (!container) container = document.querySelector('.full__actions');
        if (!container) container = document.querySelector('.card__actions');
        
        // Если не нашли в карточке — не добавляем никуда
        if (!container) return;
        if (container.querySelector('.vokino-btn')) return;

        var btn = document.createElement('div');
        btn.className = 'vokino-btn';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.1);cursor:pointer;margin:4px 0;';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>';
        btn.title = 'VoKino';

        btn.onclick = function() {
            getValidToken().then(function(token) {
                Lampa.Activity.push({
                    url: '',
                    title: 'VoKino',
                    component: 'lampacskaz',
                    search: movie.title,
                    movie: movie,
                    page: 1,
                    source: 'vokino',
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
                var movie = e.data.movie || e.data;
                setTimeout(function() { addButton(movie); }, 800);
                setTimeout(function() { addButton(movie); }, 1500);
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
