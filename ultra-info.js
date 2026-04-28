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
        var sources = {};
        var last, source, balanser, initialized, balanser_timer, images = [];
        var number_of_requests = 0, number_of_requests_timer;
        var life_wait_times = 0, life_wait_timer;
        var filter_sources = {};
        var filter_find = { season: [], voice: [] };

        function balanserName(j) { return (j.balanser || j.name.split(' ')[0]).toLowerCase(); }

        this.initialize = function() {
            var _this = this;
            this.loading(true);
            filter.onSearch = function(value) {
                var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
                var all = Lampa.Storage.get('clarification_search', '{}');
                all[id] = value;
                Lampa.Storage.set('clarification_search', all);
                Lampa.Activity.replace({ search: value, clarification: true, similar: true });
            };
            filter.onBack = function() { _this.start(); };
            filter.render().find('.selector').on('hover:enter', function() { clearInterval(balanser_timer); });
            filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
            filter.onSelect = function(type, a, b) {
                if (type == 'filter') {
                    if (a.reset) {
                        var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
                        var all = Lampa.Storage.get('clarification_search', '{}');
                        delete all[id];
                        Lampa.Storage.set('clarification_search', all);
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
            if (filter.addButtonBack) filter.addButtonBack();
            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
            scroll.body().addClass('torrent-list');
            files.appendFiles(scroll.render());
            files.appendHead(filter.render());
            scroll.minus(files.render().find('.explorer__files-head'));
            scroll.body().append(Lampa.Template.get('lampac_content_loading'));
            Lampa.Controller.enable('content');
            this.loading(false);

            this.externalids().then(function() {
                return _this.createSource();
            }).then(function(json) {
                _this.search();
            })["catch"](function(e) {
                _this.noConnectToServer(e);
            });
        };

        this.createSource = function() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                var url = _this.requestParams(host + 'lite/events?life=true');
                network.timeout(15000);
                network.silent(account(url), function(json) {
                    if (json.life) {
                        _this.memkey = json.memkey;
                        filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width:1.2em;height:1.2em;margin-top:0;background:url(./img/loader.svg) no-repeat 50% 50%;background-size:contain;margin-left:0.5em"></span>');
                        _this.lifeSource().then(_this.startSource).then(resolve)["catch"](reject);
                    } else {
                        _this.startSource(json).then(resolve)["catch"](reject);
                    }
                }, reject, false, { headers: addHeaders() });
            });
        };

        this.search = function() { this.filter({ source: filter_sources }, this.getChoice()); this.find(); };
        this.find = function() { this.request(this.requestParams(source)); };

        this.start = function() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            if (!initialized) { initialized = true; this.initialize(); }
            Lampa.Controller.add('content', {
                toggle: function() { Lampa.Controller.collectionSet(scroll.render(), files.render()); Lampa.Controller.collectionFocus(last || false, scroll.render()); },
                gone: function() { clearTimeout(balanser_timer); },
                up: function() { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function() { Navigator.move('down'); },
                right: function() { if (Navigator.canmove('right')) Navigator.move('right'); else filter.show(Lampa.Lang.translate('title_filter'), 'filter'); },
                left: function() { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                back: this.back.bind(this)
            });
            Lampa.Controller.toggle('content');
        };
        this.render = function() { return files.render(); };
        this.back = function() { Lampa.Activity.backward(); };
        this.destroy = function() { network.clear(); files.destroy(); scroll.destroy(); clearInterval(balanser_timer); clearTimeout(life_wait_timer); };
    }

    function startPlugin() {
        window.showy_plugin = true;
        Lampa.Component.add('showy_online', component);

        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                var btn = $('<div class="full-start__button selector" style="background:#e53935;color:#fff;padding:8px 16px;border-radius:8px;margin:4px;cursor:pointer;text-align:center;">🎬 Showy</div>');
                btn.on('hover:enter', function() {
                    Lampa.Component.add('showy_online', component);
                    Lampa.Activity.push({
                        url: '',
                        title: 'Showy',
                        component: 'showy_online',
                        search: e.data.movie.title,
                        movie: e.data.movie,
                        page: 1
                    });
                });
                e.object.activity.render().find('.view--torrent').after(btn);
            }
        });
    }

    if (!window.showy_plugin) startPlugin();
})();
