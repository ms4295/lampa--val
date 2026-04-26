(function () {
'use strict';

function init() {
    // Добавление плашек на постер (4K, HDR, рейтинг, год)
    if (!document.getElementById('ultra-card-style')) {
        var css =
            '.ultra-card-info{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;}' +
            '.ultra-card-top{position:absolute;top:0.4em;right:0.4em;display:flex;flex-direction:column;gap:0.25em;align-items:flex-end;}' +
            '.ultra-card-bottom{position:absolute;left:0.4em;right:0.4em;bottom:0.4em;display:flex;justify-content:space-between;align-items:flex-end;gap:0.4em;}' +
            '.ultra-card__badge{display:inline-flex;align-items:center;padding:0.2em 0.55em;color:#fff;font-weight:700;font-size:0.7em;border-radius:0.3em;letter-spacing:0.05em;text-transform:uppercase;box-shadow:0 1px 4px rgba(0,0,0,0.5);}' +
            '.ultra-card__badge--4k{background:linear-gradient(135deg,#fa709a,#fee140);color:#1a1a1a;}' +
            '.ultra-card__badge--hdr{background:linear-gradient(135deg,#11998e,#38ef7d);color:#0a2620;}' +
            '.ultra-card__badge--hdrplus{background:linear-gradient(135deg,#834d9b,#d04ed6);}' +
            '.ultra-card__chip{display:inline-flex;align-items:center;padding:0.25em 0.55em;font-weight:700;font-size:0.78em;border-radius:0.3em;color:#fff;background:rgba(0,0,0,0.65);box-shadow:0 1px 3px rgba(0,0,0,0.5);}' +
            '.ultra-card__chip--rate{background:linear-gradient(135deg,#f7971e,#ffd200);color:#1a1a1a;}';
        var style = document.createElement('style');
        style.id = 'ultra-card-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function getMovieFromCard(el) {
        var $el = $(el);
        var d = $el.data('card') || $el.data('cardData') || $el.data('movie') || $el.data('card_data');
        if (d && (d.id || d.title || d.name)) return d;
        return null;
    }

    function decorate(el, movie) {
        try {
            if (!el || !movie) return;
            var $card = $(el);
            if ($card.find('.ultra-card-info').length) return;

            var year = '';
            var date = movie.release_date || movie.first_air_date || movie.year || '';
            if (date) year = String(date).substring(0, 4);

            var rate = '';
            if (movie.vote_average && Number(movie.vote_average) > 0) {
                rate = Number(movie.vote_average).toFixed(1);
            }

            var bag = [
                movie.title, movie.original_title,
                movie.name, movie.original_name,
                movie.quality, movie.overview, movie.tagline
            ].filter(Boolean).join(' ').toLowerCase();

            var has4k = /\b(4k|2160p?|uhd|ultra\s*hd)\b/.test(bag);
            var hasHdrPlus = /hdr10\s*\+|hdr\s*\+|hdr\s*plus/.test(bag);
            var hasHdr = !hasHdrPlus && /\bhdr\b|hdr10/.test(bag);

            var top = [];
            if (has4k)      top.push('<span class="ultra-card__badge ultra-card__badge--4k">4K</span>');
            if (hasHdrPlus) top.push('<span class="ultra-card__badge ultra-card__badge--hdrplus">HDR+</span>');
            else if (hasHdr) top.push('<span class="ultra-card__badge ultra-card__badge--hdr">HDR</span>');

            var bottom = [];
            if (rate) bottom.push('<span class="ultra-card__chip ultra-card__chip--rate">' + rate + '</span>');
            else bottom.push('<span></span>');
            if (year) bottom.push('<span class="ultra-card__chip ultra-card__chip--year">' + year + '</span>');

            var hasContent = top.length || rate || year;
            if (!hasContent) return;

            var html = '<div class="ultra-card-info">';
            if (top.length)    html += '<div class="ultra-card-top">'    + top.join('')    + '</div>';
            if (bottom.length) html += '<div class="ultra-card-bottom">' + bottom.join('') + '</div>';
            html += '</div>';

            var $target = $card.find('.card__view').first();
            if (!$target.length) $target = $card.find('.card__img').parent().first();
            if (!$target.length) $target = $card;
            var pos = $target.css('position');
            if (!pos || pos === 'static') $target.css('position', 'relative');
            $target.append(html);
        } catch (err) {}
    }

    // Кнопка "Смотреть онлайн"
    function addOnlineButton(e) {
        if (e.render.find('.ultra-online-button').length) return;
        var btn = $('<div class="full-start__button selector ultra-online-button">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">' +
            '<path d="M8 5v14l11-7z"/>' +
            '</svg>' +
            '<span>Смотреть онлайн</span>' +
            '</div>');
        btn.on('hover:enter', function() {
            Lampa.Activity.push({
                url: '',
                title: 'Онлайн',
                component: 'online',
                movie: e.data.movie,
                page: 1
            });
        });
        e.render.after(btn);
    }

    // Сканирование карточек
    function scan() {
        try {
            var nodes = document.querySelectorAll('.card');
            for (var i = 0; i < nodes.length; i++) {
                var el = nodes[i];
                if ($(el).find('.ultra-card-info').length) continue;
                var movie = getMovieFromCard(el);
                if (movie) decorate(el, movie);
            }
        } catch (err) {}
    }

    Lampa.Listener.follow('card', function (e) {
        if (e.type !== 'build') return;
        var movie = e.object || e.data || e.card_data || {};
        var $el = $(e.body || e.element || e.card || []);
        if ($el.length && movie) decorate($el[0], movie);
    });

    // Кнопка при открытии полной карточки
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'complite') {
            addOnlineButton({
                render: e.object.activity.render().find('.view--torrent, .full-start__buttons'),
                data: e.data || e
            });
        }
    });

    setTimeout(scan, 1500);
    setInterval(scan, 4000);

    if (typeof MutationObserver !== 'undefined') {
        try {
            var obs = new MutationObserver(function (muts) {
                for (var i = 0; i < muts.length; i++) {
                    var nodes = muts[i].addedNodes;
                    if (!nodes) continue;
                    for (var j = 0; j < nodes.length; j++) {
                        var n = nodes[j];
                        if (!n || n.nodeType !== 1) continue;
                        if (n.classList && n.classList.contains('card')) {
                            var movie = getMovieFromCard(n);
                            if (movie) decorate(n, movie);
                        }
                        if (n.querySelectorAll) {
                            var inner = n.querySelectorAll('.card');
                            for (var k = 0; k < inner.length; k++) {
                                var movie2 = getMovieFromCard(inner[k]);
                                if (movie2) decorate(inner[k], movie2);
                            }
                        }
                    }
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        } catch (err) {}
    }
}

if (window.appready) init();
else {
    Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') init();
    });
}
})();
