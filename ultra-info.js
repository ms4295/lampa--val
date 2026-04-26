(function() {
    'use strict';

    // ========== УЛУЧШЕНИЯ ИЗ FRAMO ==========

    // Уникальный ID устройства (генерируется один раз)
    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
        unic_id = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    // Получение email из хранилища Lampa
    function getAccountEmail() {
        return Lampa.Storage.get('account_email', '') ||
               Lampa.Storage.get('lampac_profile_email', '') ||
               '';
    }

    // Чистая функция для заголовков
    function addHeaders() {
        var key = Lampa.Storage.get('aesgcmkey', '') ||
                  Lampa.Storage.get('kit_aesgcmkey', '');
        if (key) return { 'X-Kit-AesGcm': key };
        return {};
    }

    // Форматирование номера эпизода
    function formatEpisodeNumber(n) {
        return (n < 10 ? '0' : '') + n;
    }

    // ========== НАСТРОЙКИ СЕРВЕРОВ ==========
    var connection_source = 'okeantv';

    function qualityScore(k) {
        var lower = String(k).toLowerCase();
        if (lower.indexOf('4k') !== -1 || lower.indexOf('uhd') !== -1) return 2160;
        var n = parseInt(k, 10);
        return isNaN(n) ? 0 : n;
    }

    function filterMinQuality(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object' || Array.isArray(qualityObj)) return qualityObj;
        Object.keys(qualityObj).forEach(function(k) {
            if (qualityScore(k) < 1080) delete qualityObj[k];
        });
        return qualityObj;
    }

    function highestQualityKey(qualityObj) {
        if (!qualityObj || typeof qualityObj !== 'object') return null;
        var keys = Object.keys(qualityObj);
        if (!keys.length) return null;
        return keys.reduce(function(best, k) {
            return qualityScore(k) > qualityScore(best) ? k : best;
        }, keys[0]);
    }

    var MIRRORS_SHOWY = [
        'http://185.121.235.124:11176/',
        'http://showypro.com/',
        'http://smotretk.com/'
    ];
    var current_showy_index = 0;

    var SKAZ_ACCOUNTS = [
        { email: 'naza---rov6@gmail.com', uid: 'rnemtvj3' },
        { email: 'centt04@gmail.com', uid: 'fxz' },
        { email: 'unionvoin@mail.ru', uid: 'freid5q' },
        { email: 'solnce--v--kepke@yandex.ru', uid: 'fort31hg' },
        { email: 'afenkinsergej@gmail.com', uid: '1102' },
        { email: 'corkinigor@gmail.com', uid: '1101' }
    ];
    var current_skaz_account_index = 0;

    var LAMPAUA_UIDS = ['guest'];
    var current_lampaua_index = 0;

    var BETA_UIDS = [
        'eis3ey9m',
        'p8825724-9005-428a-9d86-a466c13ddff3',
        'y9725724-9005-428a-9d86-a466c13ddcc4'
    ];
    var current_beta_index = 0;

    var cf = Lampa.Storage.get('skazonline_servers');
    var vybor, dd;
    if (cf == true) {
        vybor = [
            'http://onlinecf3.skaz.tv/',
            'http://onlinecf4.skaz.tv/',
            'http://onlinecf5.skaz.tv/'
        ];
        dd = "cf";
    } else {
        vybor = [
            'http://online3.skaz.tv/',
            'http://online4.skaz.tv/',
            'http://online5.skaz.tv/'
        ];
        dd = '';
    }
    var randomIndex = Math.floor(Math.random() * vybor.length);
    var randomUrl = vybor[randomIndex];

    function getHost() {
        if (connection_source === 'showy') return MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/';
        if (connection_source === 'hdpoisk') return 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return 'https://apn2.akter-black.com/http://lampaua.mooo.com/';
        if (connection_source === 'beta') return 'http://beta.l-vid.online:888/';
        return randomUrl;
    }

    var Defined = {
        api: 'lampac',
        localhost: getHost(),
        apn: ''
    };

    var balansers_with_search;

    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try {
                var current = AndroidJS.appVersion().split('-');
                return parseInt(current.pop());
            } catch (e) { return 0; }
        }
        return 0;
    }

    var hostkey = 'http://online' + dd + '3.skaz.tv'.replace('http://', '').replace('https://', '');

    if (!window.rch_nws || !window.rch_nws[hostkey]) {
        if (!window.rch_nws) window.rch_nws = {};
        window.rch_nws[hostkey] = {
            type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
            startTypeInvoke: false,
            rchRegistry: false,
            apkVersion: getAndroidVersion()
        };
    }

    window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
        if (!window.rch_nws[hostkey].startTypeInvoke) {
            window.rch_nws[hostkey].startTypeInvoke = true;
            var check = function check(good) {
                window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
                call();
            };
            if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
            else {
                var net = new Lampa.Reguest();
                net.silent('http://online' + dd + '3.skaz.tv'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
                    check(true);
                }, function() {
                    check(false);
                }, false, { dataType: 'text' });
            }
        } else call();
    };

    window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
        window.rch_nws[hostkey].typeInvoke('http://online' + dd + '3.skaz.tv', function() {
            client.invoke("RchRegistry", {
                version: 154,
                host: location.host,
                rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
                apkVersion: window.rch_nws[hostkey].apkVersion,
                player: Lampa.Storage.field('player'),
                account_email: getAccountEmail(),
                unic_id: unic_id,
                profile_id: Lampa.Storage.get('lampac_profile_id', ''),
                token: ''
            });

            if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
                if (startConnection) startConnection();
                return;
            }

            window.rch_nws[hostkey].rchRegistry = true;
