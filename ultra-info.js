(function () {
'use strict';

window.__ultraInfoCache = window.__ultraInfoCache || {};
var STORAGE_KEY = 'ultra_info_cache_v1';
var MAX_ENTRIES = 2000;

function loadCache() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (data && typeof data === 'object') window.__ultraInfoCache = data;
    } catch (e) {}
}

function saveCache() {
    try {
        var keys = Object.keys(window.__ultraInfoCache);
        if (keys.length > MAX_ENTRIES) {
            var trimmed = {};
            keys.slice(-MAX_ENTRIES).forEach(function (k) { trimmed[k] = window.__ultraInfoCache[k]; });
            window.__ultraInfoCache = trimmed;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.__ultraInfoCache));
    } catch (e) {}
}

function init() {
    loadCache();

    if (!document.getElementById('ultra-info-style')) {
        var css =
            '.ultra-info{margin-top:0.8em;line-height:1.5;}' +
            '.ultra-info__row{display:flex;flex-wrap:wrap;gap:0.4em;margin-bottom:0.4em;align-items:center;}' +
            '.ultra-info__pill{display:inline-flex;align-items:center;padding:0.3em 0.75em;background:rgba(255,255,255,0.1);border-radius:1em;font-size:0.9em;line-height:1.2;color:#fff;}' +
            '.ultra-info__pill b{font-weight:500;margin-right:0.4em;opacity:0.65;}' +
            '.ultra-info__orig{font-style:italic;opacity:0.7;font-size:0.95em;margin-bottom:0.4em;}' +
            '.ultra-info__badge{display:inline-flex;align-items:center;padding:0.3em 0.85em;color:#fff;font-weight:700;font-size:0.8em;border-radius:0.35em;letter-spacing:0.06em;text-transform:uppercase;}' +
            '.ultra-info__badge--4k{background:linear-gradient(135deg,#fa709a,#fee140);color:#1a1a1a;}' +
            '.ultra-info__badge--hdr{background:linear-gradient(135deg,#11998e,#38ef7d);color:#0a2620;}' +
            '.ultra-info__badge--hdrplus{background:linear-gradient(135deg,#834d9b,#d04ed6);}' +
            '.ultra-info__badge--ua{background:linear-gradient(to bottom,#0057b7 50%,#ffd700 50%);color:#1a1a1a;text-shadow:0 1px 2px rgba(255,255,255,0.6);}' +
            '.ultra-info-card{position:absolute;top:0.4em;right:0.4em;display:flex;flex-direction:column;gap:0.25em;align-items:flex-end;z-index:5;pointer-events:none;}' +
            '.ultra-info-card .ultra-info__badge{font-size:0.65em;padding:0.2em 0.55em;border-radius:0.3em;letter-spacing:0.04em;box-shadow:0 1px 4px rgba(0,0,0,0.5);}';
        var style = document.createElement('style');
        style.id = 'ultra-info-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    var currentMovie = null;

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function detectFormatsFromMeta(movie) {
        var bag = [
            movie.quality, movie.title, movie.original_title,
            movie.name, movie.original_name, movie.overview, movie.tagline
        ].filter(Boolean).join(' ').toLowerCase();
        var out = {};
        if (/\b(4k|2160p?|uhd|ultra\s*hd)\b/.test(bag)) out['4K'] = true;
        if (/hdr10\s*\+|hdr\s*\+|hdr\s*plus/.test(bag)) out['HDR+'] = true;
        else if (/\bhdr\b|hdr10/.test(bag)) out['HDR'] = true;
        return out;
    }

    function detectFromSources(items) {
        var out = { '4K': false, 'HDR': false, 'HDR+': false, 'UA': false };
        if (!items || !items.length) return out;
        items.forEach(function (el) {
            if (!el) return;
            var langBag = [
                el.voice_name, el.translate_voice, el.info,
                el.name, el.text, el.title
            ].filter(Boolean).join(' ');
            if (/україн|украин|ukrain|\bукр\b|\bukr\b|\bua\b/i.test(langBag)) out['UA'] = true;
            var qBag = '';
            var qSrc = el.qualitys || el.quality;
            if (qSrc && typeof qSrc === 'object') {
                qBag = Object.keys(qSrc).join(' ') + ' ' +
                       Object.keys(qSrc).map(function (k) { return qSrc[k]; }).join(' ');
            } else if (typeof qSrc === 'string') {
                qBag = qSrc;
            }
            var fmtBag = (qBag + ' ' + langBag).toLowerCase();
            if (/\b(2160p?|4k|uhd|ultra\s*hd)\b/.test(fmtBag)) out['4K'] = true;
            if (/hdr10\s*\+|hdr\s*\+|hdr\s*plus/.test(fmtBag)) out['HDR+'] = true;
            else if (/\bhdr\b|hdr10/.test(fmtBag)) out['HDR'] = true;
        });
        return out;
    }

    function buildBadgeList(data) {
        var list = [];
        if (data['4K'])   list.push({ label: '4K',   cls: 'ultra-info__badge--4k' });
        if (data['HDR+']) list.push({ label: 'HDR+', cls: 'ultra-info__badge--hdrplus' });
        else if (data['HDR']) list.push({ label: 'HDR', cls: 'ultra-info__badge--hdr' });
        if (data['UA'])   list.push({ label: 'UA',   cls: 'ultra-info__badge--ua' });
        return list;
    }

    function buildBadgesForFull(movie) {
        var meta = detectFormatsFromMeta(movie);
        var src = (movie && movie.id && window.__ultraInfoCache[movie.id]) || {};
        return buildBadgeList({
            '4K':   meta['4K']   || src['4K'],
            'HDR+': meta['HDR+'] || src['HDR+'],
            'HDR':  meta['HDR']  || src['HDR'],
            'UA':   src['UA']
        });
    }

    function applyCardBadges($card, data) {
        if (!$card || !$card.length) return;
        if ($card.find('.ultra-info-card').length) $card.find('.ultra-info-card').remove();
        var badges = buildBadgeList(data);
        if (!badges.length) return;
        var html = '<div class="ultra-info-card">' + badges.map(function (b) {
            return '<span class="ultra-info__badge ' + b.cls + '">' + b.label + '</span>';
        }).join('') + '</div>';
        var $target = $card.find('.card__view').first();
        if (!$target.length) $target = $card.find('.card__img').parent().first();
        if (!$target.length) $target = $card;
        var pos = $target.css('position');
        if (!pos || pos === 'static') $target.css('position', 'relative');
        $target.append(html);
    }

    function decorateCard(e) {
        try {
            var movie = e && (e.object || e.data || e.card_data || e.movie) || {};
            if (!movie || !movie.id) return;
            var $card = $(e.body || e.element || e.card || e.target || []);
            if (!$card.length || !$card.jquery) return;
            $card.attr('data-ultra-info-id', String(movie.id));
            var data = window.__ultraInfoCache[movie.id];
            if (data) applyCardBadges($card, data);
        } catch (err) {
            console.log('ULTRA-INFO CARD ERROR', err);
        }
    }

    function refreshVisibleCards(movieId) {
        var data = window.__ultraInfoCache[movieId];
        if (!data) return;
        $('[data-ultra-info-id="' + movieId + '"]').each(function () {
            applyCardBadges($(this), data);
        });
    }

    function addInfo(e) {
        try {
            var movie = (e && e.data && e.data.movie) || (e && e.data) || {};
            if (!movie || !Object.keys(movie).length) return;
            currentMovie = movie;

            var container = $('.full-start-new__details, .full-start__info, .full__info').first();
            if (!container.length) return;
            if ($('.ultra-info').length) return;

            var year = movie.year || movie.release_date || movie.first_air_date || '';
            year = String(year);
            if (year.length > 4) year = year.substring(0, 4);

            var rate = (movie.vote_average && Number(movie.vote_average) > 0)
                ? Number(movie.vote_average).toFixed(1) : '';

            var runtime = '';
            if (movie.runtime && Number(movie.runtime) > 0) {
                var h = Math.floor(movie.runtime / 60);
                var m = movie.runtime % 60;
                runtime = ((h ? h + ' ч ' : '') + (m ? m + ' мин' : '')).trim();
            }

            var genres = '';
            if (movie.genres && movie.genres.length) {
                genres = movie.genres.slice(0, 3).map(function (g) { return g.name; }).join(', ');
            }

            var country = '';
            var pc = movie.production_countries || movie.origin_country;
            if (pc && pc.length) {
                country = pc.slice(0, 2).map(function (c) {
                    return (typeof c === 'string') ? c : (c.name || c.iso_3166_1 || '');
                }).filter(Boolean).join(', ');
            }

            var studio = '';
            var st = movie.production_companies || movie.networks;
            if (st && st.length && st[0]) studio = st[0].name || '';

            var t1 = String(movie.title || movie.name || '').trim();
            var t2 = String(movie.original_title || movie.original_name || '').trim();
            var origTitle = (t2 && t2 !== t1) ? t2 : '';

            var formats = buildBadgesForFull(movie);

            var html = '<div class="ultra-info">';
            if (origTitle) html += '<div class="ultra-info__orig">' + esc(origTitle) + '</div>';

            var pills = [];
            if (year)    pills.push('<span class="ultra-info__pill"><b>Год</b>'     + esc(year)    + '</span>');
            if (rate)    pills.push('<span class="ultra-info__pill"><b>Рейтинг</b>' + esc(rate)    + '</span>');
            if (runtime) pills.push('<span class="ultra-info__pill"><b>Время</b>'   + esc(runtime) + '</span>');
            if (country) pills.push('<span class="ultra-info__pill"><b>Страна</b>'  + esc(country) + '</span>');
            if (genres)  pills.push('<span class="ultra-info__pill"><b>Жанр</b>'    + esc(genres)  + '</span>');
            if (studio)  pills.push('<span class="ultra-info__pill"><b>Студия</b>'  + esc(studio)  + '</span>');
            if (pills.length) html += '<div class="ultra-info__row">' + pills.join('') + '</div>';

            if (formats.length) {
                var badges = formats.map(function (f) {
                    return '<span class="ultra-info__badge ' + f.cls + '">' + f.label + '</span>';
                }).join('');
                html += '<div class="ultra-info__row ultra-info__row--badges">' + badges + '</div>';
            }

            html += '</div>';
            container.append($(html));
        } catch (err) {
            console.log('ULTRA-INFO ERROR', err);
        }
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            setTimeout(function () { addInfo(e); }, 500);
        }
        if (e.type === 'destroy') {
            currentMovie = null;
        }
    });

    Lampa.Listener.follow('card', function (e) {
        if (e.type === 'build') decorateCard(e);
    });

    Lampa.Listener.follow('ultra_sources', function (e) {
        if (!e || e.type !== 'loaded' || !e.movie || !e.movie.id) return;
        var detected = detectFromSources(e.items || []);
        var prev = window.__ultraInfoCache[e.movie.id] || {};
        var merged = {
            '4K':   prev['4K']   || detected['4K'],
            'HDR':  prev['HDR']  || detected['HDR'],
            'HDR+': prev['HDR+'] || detected['HDR+'],
            'UA':   prev['UA']   || detected['UA']
        };
        window.__ultraInfoCache[e.movie.id] = merged;
        saveCache();
        refreshVisibleCards(e.movie.id);
        if (currentMovie && currentMovie.id === e.movie.id) {
            $('.ultra-info').remove();
            addInfo({ data: { movie: currentMovie } });
        }
    });
}

if (window.appready) init();
else {
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
}
})();
