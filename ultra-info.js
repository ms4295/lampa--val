// Плагин для Lampa: VoKino (Платный)
(function() {
    'use strict';

    // Функция для получения токена VoKino по логину и паролю
    async function getVoKinoToken(login, password) {
        return new Promise(function(resolve, reject) {
            // Используем официальный API Lampac для получения токена VoKino
            var network = new Lampa.Reguest();
            var baseUrl = 'http://148.135.207.174:12359'; // Можно заменить на свой сервер Lampac, если он у вас есть
            var url = baseUrl + '/lite/vokinotk?login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password);
            
            network.timeout(10000);
            network.silent(url, function(response) {
                if (response && response.token) {
                    // Сохраняем токен с текущей датой
                    Lampa.Storage.set('vokino_token', response.token);
                    Lampa.Storage.set('vokino_token_date', Date.now());
                    resolve(response.token);
                } else {
                    reject(new Error('Не удалось получить токен. Проверьте логин и пароль.'));
                }
            }, function(error) {
                reject(new Error('Ошибка подключения к серверу VoKino.'));
            }, false, {
                dataType: 'json'
            });
        });
    }

    // Функция для получения актуального токена (из кеша или с обновлением)
    async function getValidToken() {
        var token = Lampa.Storage.get('vokino_token', '');
        var tokenDate = Lampa.Storage.get('vokino_token_date', 0);
        var now = Date.now();
        var tokenAge = now - tokenDate;
        var maxAge = 24 * 60 * 60 * 1000; // 24 часа

        if (token && tokenAge < maxAge) {
            // Токен ещё свежий
            return token;
        }

        // Токена нет или он устарел — запрашиваем логин и пароль
        var login = Lampa.Storage.get('vokino_login', '');
        var password = Lampa.Storage.get('vokino_password', '');

        if (!login || !password) {
            // Запрашиваем у пользователя
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
                            getVoKinoToken(result.login, result.password)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            reject(new Error('Не введены данные.'));
                        }
                    },
                    onBack: function() {
                        reject(new Error('Авторизация отменена.'));
                    }
                });
            });
        } else {
            // Данные есть, пробуем получить свежий токен
            return getVoKinoToken(login, password);
        }
    }

    // Функция для добавления токена к URL
    function addVoKinoToken(url) {
        return new Promise(function(resolve, reject) {
            getValidToken().then(function(token) {
                if (url.indexOf('vokinotk_token=') === -1) {
                    url = Lampa.Utils.addUrlComponent(url, 'vokinotk_token=' + encodeURIComponent(token));
                }
                resolve(url);
            }).catch(function(err) {
                Lampa.Noty.show('Ошибка VoKino: ' + (err.message || 'Не удалось авторизоваться'));
                reject(err);
            });
        });
    }

    // Функция для добавления источника VoKino в глобальный поиск
    function addVoKinoSearch() {
        var network = new Lampa.Reguest();

        var source = {
            title: 'VoKino (Платный)',
            search: function(params, oncomplite) {
                getValidToken().then(function(token) {
                    var url = 'http://148.135.207.174:12359/lite/vokino?title=' + encodeURIComponent(params.query) + '&vokinotk_token=' + token;
                    
                    network.timeout(15000);
                    network.silent(url, function(json) {
                        if (json.rch) {
                            // Если требуется RCH-подключение
                            console.log('VoKino: требуется RCH подключение');
                            oncomplite([]);
                            return;
                        }

                        // Обрабатываем результаты как обычные элементы
                        var items = [];
                        if (json && json.online) {
                            json.online.forEach(function(j) {
                                var name = (j.balanser || j.name || '').toLowerCase();
                                if (j.url && j.show !== false) {
                                    items.push({
                                        title: j.title || j.name || 'VoKino',
                                        url: j.url,
                                        balanser: name,
                                        show: true
                                    });
                                }
                            });
                        }

                        // Возвращаем результаты в формате лампы
                        if (items.length) {
                            var rows = [{
                                title: 'VoKino (Платный)',
                                results: items.map(function(item) {
                                    return {
                                        title: item.title,
                                        url: item.url,
                                        balanser: 'vokino',
                                        year: '',
                                        img: ''
                                    };
                                })
                            }];
                            oncomplite(rows);
                        } else {
                            oncomplite([]);
                        }
                    }, function() {
                        oncomplite([]);
                    }, false, {
                        dataType: 'json'
                    });
                }).catch(function(err) {
                    oncomplite([]);
                });
            },
            onCancel: function() {
                network.clear();
            },
            params: {
                lazy: true,
                align_left: true,
                card_events: {
                    onMenu: function() {}
                }
            },
            onMore: function(params, close) {
                close();
            },
            onSelect: function(params, close) {
                close();
                // Открываем карточку фильма, но с пометкой, что нужно использовать VoKino
                Lampa.Activity.push({
                    url: params.element.url,
                    title: 'VoKino - ' + params.element.title,
                    component: 'full',
                    movie: params.element,
                    page: 1,
                    search: params.element.title,
                    clarification: false
                });
            }
        };

        Lampa.Search.addSource(source);
    }

    // Инициализация
    function init() {
        // Добавляем в поиск новый источник
        addVoKinoSearch();
        
        // Добавляем в меню кнопку сброса токена (для отладки)
        console.log('VoKino плагин активирован ✅');
    }

    // Старт
    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });

})();
