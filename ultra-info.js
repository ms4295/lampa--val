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
        var sources = {}, last, source, balanser, initialized, balanser_timer, images = [];
        var number_of_requests = 0, number_of_requests_timer;
        var life_wait_times = 0, life_wait_timer;
        var filter_sources = {};
        var filter_find = { season: [], voice: [] };

        function balanserName(j) { return (j.balanser || j.name.split(' ')[0]).toLowerCase(); }

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onBack = function() { _this.start(); };
            filter.render().find('.selector').on('hover:enter', function() { clearInterval(balanser_timer); });
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    if (a.reset) {
                        _this.replaceChoice({ season: 0, voice: 0, voice_url: '', voice_name: '' });
                        setTimeout(function() { Lampa.Select.close(); Lampa.Activity.replace({ clarification: 0, similar: 0 }); }, 10);
                    } else {
                        var url = filter_find[a.stype][b.index].url;
                        var choice = _this.getChoice();
                        if (a.stype == 'voice') { choice.voice_name = filter_find.voice[b.index].title; choice.voice_url = url; }
                        choice[a.stype] = b.index;
                        _this.saveChoice(choice);
                        _this.reset();
                        _this.request(url);
                        setTimeout(Lampa.Select.close, 10);
                    }
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    object.lampac_custom_select = a.source;
                    _this.changeBalanser(a.source);
                }
            };
            filter.render().find('.filter--sort span').text('Источник');
            scroll.body().addClass('torrent-list');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.loading(false);

            this.createSource().then(function(json) {
                _this.search();
            })["catch"](function(e) {
                scroll.clear();
                scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Сервер недоступен</div>');
                _this.loading(false);
            });
        };

        this.requestParams = function(url) {
            var query = [];
            query.push('id=' + encodeURIComponent(object.movie.id));
            if (object.movie.imdb_id) query.push('imdb_id=' + object.movie.imdb_id);
            if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + object.movie.kinopoisk_id);
            query.push('title=' + encodeURIComponent(object.movie.title || object.movie.name));
            query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
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
                    if (!json || !json.online) {
                        reject('empty');
                        return;
                    }
                    var list = json.online.filter(function(j) { return j.show !== false; });
                    list.forEach(function(j) {
                        var name = balanserName(j);
                        sources[name] = { url: j.url, name: j.name };
                    });
                    filter_sources = Object.keys(sources);
                    if (filter_sources.length) {
                        balanser = filter_sources[0];
                        source = sources[balanser].url;
                        resolve(json);
                    } else {
                        reject('no sources');
                    }
                }, function() { reject('network error'); }, false, { headers: addHeaders() });
            });
        };

        this.search = function() {
            this.filter({ source: filter_sources }, this.getChoice());
            this.request(this.requestParams(source));
        };

        this.request = function(url) {
            var _this = this;
            number_of_requests++;
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
                    if (text && !object.movie.name && text.match(/\d+p/i)) {
                        if (!data.quality) { data.quality = {}; data.quality[text] = data.url; }
                    }
                    if (text) data.text = text;
                    data.active = item.hasClass('active');
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
                scroll.append('<div style="color:#fff;text-align:center;padding:2em;">Ошибка обработки данных</div>');
                this.loading(false);
            }
        };

        this.display = function(videos) {
            var _this = this;
            scroll.clear();
            videos.forEach(function(video, i) {
                var item = $('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;">' +
                    '<div style="font-size:1.2em;font-weight:700;">' + (video.text || video.title || 'Источник ' + (i+1)) + '</div>' +
                    '<div style="color:#aaa;">' + (Object.keys(video.quality || {}).join(', ') || '') + '</div>' +
                    '</div>');
                item.on('hover:enter', function() {
                    var url = video.url;
                    if (video.quality && Object.keys(video.quality).length) {
                        url = video.quality[Object.keys(video.quality)[0]];
                    }
                    network.silent(account(url), function(json) {
                        if (json && json.url) {
                            Lampa.Player.play({ title: video.text || object.movie.title, url: json.url, isonline: true });
                        } else if (json && typeof json === 'string') {
                            Lampa.Player.play({ title: video.text || object.movie.title, url: json, isonline: true });
                        } else {
                            Lampa.Player.play({ title: video.text || object.movie.title, url: url, isonline: true });
                        }
                    }, function() {
                        Lampa.Player.play({ title: video.text || object.movie.title, url: url, isonline: true });
                    }, false, { dataType: 'json', headers: addHeaders() });
                });
                scroll.append(item);
            });
            this.loading(false);
            Lampa.Controller.enable('content');
        };

        this.getChoice = function() {
            return Lampa.Storage.cache('showy_choice', 3000, {})[object.movie.id] || { season: 0, voice: 0 };
        };
        this.saveChoice = function(choice) {
            var data = Lampa.Storage.cache('showy_choice', 3000, {});
            data[object.movie.id] = choice;
            Lampa.Storage.set('showy_choice', data);
        };
        this.replaceChoice = function(choice) {
            var to = this.getChoice();
            Lampa.Arrays.extend(to, choice, true);
            this.saveChoice(to);
        };
        this.reset = function() { scroll.clear(); scroll.body().append(Lampa.Template.get('lampac_content_loading')); };
        this.loading = function(status) {
            if (status) this.activity.loader(true);
            else { this.activity.loader(false); this.activity.toggle(); }
        };
        this.filter = function(items, choice) {
            filter.set('sort', filter_sources.map(function(e) {
                return { title: sources[e].name, source: e, selected: e == balancer };
            }));
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

    function addButton() {
        var container = document.querySelector('.view--torrent');
        if (!container) container = document.querySelector('.full-start__buttons');
        if (!container) return;
        if (container.querySelector('.showy-btn')) return;

        var btn = document.createElement('div');
        btn.className = 'full-start__button selector showy-btn';
        btn.style.cssText = 'background:#e53935;color:#fff;padding:8px 16px;border-radius:8px;margin:4px;cursor:pointer;text-align:center;';
        btn.textContent = '🎬 Showy';
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
        container.appendChild(btn);
    }

    function init() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                window._showy_movie = e.data.movie || e.data;
                setTimeout(addButton, 500);
                setTimeout(addButton, 1000);
                setTimeout(addButton, 2000);
            }
        });
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') init(); });

    window.showy_plugin = true;
})();
