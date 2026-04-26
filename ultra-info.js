(function () {
'use strict';

function init() {
    function addInfo(e) {
        try {
            var movie = (e && e.data && e.data.movie) || (e && e.data) || {};
            if (!movie || !Object.keys(movie).length) return;

            var container = $('.full-start-new__details, .full-start__info, .full__info').first();
            if (!container.length) return;
            if ($('.ultra-info').length) return;

            var year = movie.year || movie.release_date || movie.first_air_date || '';
            year = String(year);
            if (year.length > 4) year = year.substring(0, 4);
            if (!year) year = '—';

            var rate = (movie.vote_average && Number(movie.vote_average) > 0)
                ? Number(movie.vote_average).toFixed(1)
                : '—';

            var runtime = '';
            if (movie.runtime && Number(movie.runtime) > 0) {
                var h = Math.floor(movie.runtime / 60);
                var m = movie.runtime % 60;
                runtime = (h ? h + ' ч ' : '') + (m ? m + ' мин' : '').trim();
            }

            var genres = '';
            if (movie.genres && movie.genres.length) {
                genres = movie.genres.slice(0, 3).map(function (g) { return g.name; }).join(', ');
            }

            var quality = movie.quality || '';
            if (!quality) {
                var title = String(movie.title || movie.name || '').toLowerCase();
                if (/\b(2160p?|4k|uhd)\b/.test(title)) quality = '4K UHD';
                else if (/\b1440p?\b/.test(title)) quality = '1440p';
                else if (/\b1080p?\b/.test(title)) quality = '1080p';
            }

            var parts = [];
            parts.push('Год: ' + year);
            parts.push('Рейтинг: ' + rate);
            if (runtime) parts.push('Время: ' + runtime);
            if (genres) parts.push('Жанр: ' + genres);
            if (quality) parts.push('Качество: ' + quality);

            var html = $('<div class="ultra-info" style="margin-top:10px; font-size:1.1em; line-height:1.4;">' + parts.join('  •  ') + '</div>');
            container.append(html);
        } catch (err) {
            console.log('ULTRA-INFO ERROR', err);
        }
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            setTimeout(function () { addInfo(e); }, 500);
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
