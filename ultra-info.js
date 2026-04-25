(function () {
'use strict';

function init(){

    function addInfo(e){
        try{
            var movie = e.data.movie || e.data;

            if(!movie) return;

            var container = $('.full-start__info, .full__info');

            if(!container.length) return;

            if(container.find('.ultra-info').length) return;

            var year = movie.year || movie.release_date || '—';
            if(year !== '—' && year.length > 4) year = year.substring(0,4);

            var rate = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

            var quality = '';
            var title = (movie.title || movie.name || '').toLowerCase();

            if(title.includes('2160') || title.includes('4k') || title.includes('uhd')) quality = '4K UHD';
            else if(title.includes('1440')) quality = '1440p';
            else if(title.includes('1080')) quality = '1080p';

            var parts = [];
            parts.push('📅 ' + year);
            parts.push('⭐ ' + rate);
            if(quality) parts.push('🎬 ' + quality);

            var html = $(`
                <div class="ultra-info" style="margin-top:10px; font-size:1.1em;">
                    ${parts.join(' | ')}
                </div>
            `);

            container.append(html);

        }catch(err){
            console.log('ULTRA ERROR', err);
        }
    }

    Lampa.Listener.follow('full', function(e){
        if(e.type === 'complite'){
            setTimeout(function(){
                addInfo(e);
            }, 500);
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
