(function() {
    'use strict';

    var host = 'http://smotretk.com/';
    var uid = 'i8nqb9vw';
    var token = 'f8377057-90eb-4d76-93c9-7605952a096l';

    function account(url) {
        url = url + '';
        if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=' + uid);
        if (url.indexOf('showy_token=') === -1) url = Lampa.Utils.addUrlComponent(url, 'showy_token=' + token);
        return url;
    }

    function addHeaders() {
        var key = Lampa.Storage.get('aesgcmkey', '') || Lampa.Storage.get('kit_aesgcmkey', '');
        if (key) return { 'X-Kit-AesGcm': key };
        return {};
    }

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {}, last, source, balanser, initialized, balanser_timer;
        var filter_sources = {};

        function balanserName(j) { return (j.balanser || j.name.split(' ')[0]).toLowerCase(); }

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onBack = function() { _this.start(); };
            filter.render().find('.selector').on('hover:enter', function() { clearInterval(balanser_timer); });
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            filter.render().find('.filter--sort span').text('Источник');
            scroll.body().addClass('torrent-list');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.loading(false);

            this.createSource().then(function() {
                _this.search();
            })["catch"](function() {
                scroll.clear();
                scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Сервер недоступен</div>');
                _this.loading(false);
            });
        };

        this.requestParams = function(url) {
            var query = [];
            query.push('id=' + encodeURIComponent(object.movie.id));
            query.push('title=' + encodeURIComponent(object.movie.title || object.movie.name));
            query.push('serial=' + (object.movie.name ? 1 : 0));
            query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
            query.push('source=' + (object.movie.source || 'tmdb'));
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                var url = _this.requestParams(host + 'lite/events?life=true');
                network.timeout(15000);
                network.silent(account(url), function(json) {
                    if (!json || !json.online) return reject();
                    var list = json.online.filter(function(j) { return j.show !== false; });
                    list.forEach(function(j) {
                        sources[balanserName(j)] = { url: j.url, name: j.name };
                    });
                    filter_sources = Object.keys(sources);
                    if (filter_sources.length) {
                        balanser = filter_sources[0];
                        source = sources[balanser].url;
                        resolve();
                    } else reject();
                }, function() { reject(); }, false, { headers: addHeaders() });
            });
        };

        this.search = function() {
            this.filter({ source: filter_sources }, this.getChoice());
            this.request(this.requestParams(source));
        };

        this.request = function(url) {
            var _this = this;
            network.timeout(10000);
            network.silent(account(url), function(response) {
                _this.parse(response);
            }, function() {
                scroll.clear();
                scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Ничего не найдено</div>');
                _this.loading(false);
            }, false, { dataType: 'text', headers: addHeaders() });
        };

        this.parse = function(str) {
            try {
                var items = [];
                var html = $('<div>' + str + '</div>');
                html.find('.videos__item').each(function() {
                    var item = $(this);
                    var data = JSON.parse(item.attr('data-json'));
                    var text = item.text();
                    if (text) data.text = text;
                    items.push(data);
                });
                var videos = items.filter(function(v) { return v.method == 'play' || v.method == 'call'; });
                if (videos.length) {
                    this.activity.loader(false);
                    this.display(videos);
                } else {
                    scroll.clear();
                    scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Источники не найдены</div>');
                    this.loading(false);
                }
            } catch(e) {
                scroll.clear();
                scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Ошибка обработки</div>');
                this.loading(false);
            }
        };

        this.display = function(videos) {
            var _this = this;
            scroll.clear();
            videos.forEach(function(video, i) {
                var item = $('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;">' +
                    '<div style="font-size:1.2em;">' + (video.text || video.title || 'Источник ' + (i+1)) + '</div>' +
                    '</div>');
                item.on('hover:enter', function() {
                    var playUrl = video.url;
                    if (video.quality) {
                        var keys = Object.keys(video.quality);
                        if (keys.length) playUrl = video.quality[keys[0]];
                    }
                    network.silent(account(playUrl), function(json) {
                        var finalUrl = (json && json.url) ? json.url : playUrl;
                        Lampa.Player.play({ title: video.text || object.movie.title, url: finalUrl, isonline: true });
                    }, function() {
                        Lampa.Player.play({ title: video.text || object.movie.title, url: playUrl, isonline: true });
                    }, false, { dataType: 'json', headers: addHeaders() });
                });
                scroll.append(item);
            });
            this.loading(false);
            Lampa.Controller.enable('content');
        };

        this.getChoice = function() { return Lampa.Storage.cache('showy_choice', 3000, {})[object.movie.id] || { season: 0, voice: 0 }; };
        this.saveChoice = function(choice) { var d = Lampa.Storage.cache('showy_choice', 3000, {}); d[object.movie.id] = choice; Lampa.Storage.set('showy_choice', d); };
        this.replaceChoice = function(choice) { var t = this.getChoice(); Lampa.Arrays.extend(t, choice, true); this.saveChoice(t); };
        this.reset = function() { scroll.clear(); scroll.body().append(Lampa.Template.get('lampac_content_loading')); };
        this.loading = function(s) { if (s) this.activity.loader(true); else { this.activity.loader(false); this.activity.toggle(); } };
        this.filter = function(items, choice) {
            filter.set('sort', filter_sources.map(function(e) { return { title: sources[e].name, source: e, selected: e == balancer }; }));
        };
        this.start = function() {
            if (!initialized) { initialized = true; this.initialize(); }
            Lampa.Controller.add('content', {
                toggle: function() { Lampa.Controller.collectionSet(scroll.render()); },
                back: function() { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };
        this.render = function() { return files.render(); };
        this.back = function() { Lampa.Activity.backward(); };
        this.destroy = function() { network.clear(); files.destroy(); scroll.destroy(); };
    }

    // Ищем боковое меню с иконками (Смотреть, Избранное, Реакции)
    function addButton() {
        var menu = document.querySelector('.full__actions');
        if (!menu) menu = document.querySelector('.full-start__actions');
        if (!menu) menu = document.querySelector('.card__actions');
        if (!menu) {
            var all = document.querySelectorAll('div');
            for (var i = 0; i < all.length; i++) {
                if (all[i].className && all[i].className.indexOf('actions') !== -1) {
                    menu = all[i];
                    break;
                }
            }
        }
        if (!menu) return;
        if (menu.querySelector('.showy-btn')) return;

        var btn = document.createElement('div');
        btn.className = 'showy-btn';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:rgba(229,57,53,0.3);cursor:pointer;margin:4px 0;';
        btn.innerHTML = '<span style="color:#e53935;font-size:20px;">S</span>';
        btn.title = 'Showy';
        btn.onclick = function() {
            var movie = window._showy_movie;
            if (!movie) return;
            Lampa.Component.add('showy_online', component);
            Lampa.Activity.push({
                url: '',
                title: 'Showy',
                component: 'showy_online',
                search: movie.title,
                movie: movie,
                page: 1
            });
        };
        menu.appendChild(btn);
    }

    function init() {
        window.showy_plugin = true;
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                window._showy_movie = e.data.movie || e.data;
                setTimeout(addButton, 500);
                setTimeout(addButton, 1500);
                setTimeout(addButton, 3000);
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });
})();
