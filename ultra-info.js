// Ultra-Info + 4K-Film.lol Mega Parser v3.0
// Для Lampa by ms4295 + Blackbox AI
(function() {
    'use strict';

    // === ОСНОВНОЙ ПАРСЕР 4K-FILM.LOL ===
    const fourKFilm = {
        name: '4K-Film.lol',
        url: 'https://02.4k-film.lol/',
        hosts: ['4k-film.lol', '02.4k-film.lol']
    };

    // Главная страница
    function parseCatalog(url) {
        return networks.silent(url, function(html) {
            let items = [];
            
            // Парсим посты
            let posts = html.match(/<article[^>]*class="post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi) || [];
            posts.forEach(post => {
                let title = post.match(/<h2[^>]*>([^<]+)<\/h2>/i)?.[1]?.trim();
                let href = post.match(/href="([^"]+)"/i)?.[1];
                let img = post.match(/data-src="([^"]+)"/i)?.[1] || post.match(/src="([^"]+)"/i)?.[1];
                
                if (title && href) {
                    items.push({
                        title: title.replace(/\s*\$4K\$/i, '') + ' [4K]',
                        original_title: title,
                        href: href.startsWith('http') ? href : fourKFilm.url + href,
                        img: img || './img/img_broken.svg',
                        quality: '4K'
                    });
                }
            });
            
            // Дополнительный парсинг
            $(html).find('.movie-item a, .post-item a').each(function() {
                let title = $(this).find('.title, h3').text().trim();
                let href = $(this).attr('href');
                let img = $(this).find('img').attr('src') || $(this).find('img').attr('data-src');
                
                if (title && href && !items.find(i => i.href === href)) {
                    items.push({
                        title: title + ' [4K]',
                        href: href,
                        img: img || './img/img_broken.svg'
                    });
                }
            });
            
            return items.slice(0, 50); // Лимит для скорости
        });
    }

    // Страница фильма
    function parseCard(url) {
        return networks.silent(url, function(html) {
            let data = {
                title: $('h1.entry-title', html).text().trim() || $('.title', html).text().trim() || '',
                original_title: $('.original-title', html).text().trim() || '',
                img: $('.post-thumb img, .poster img', html).attr('src') || $('.cover img', html).attr('src') || '',
                description: $('.entry-content p:first', html).text().trim() || $('.description', html).text().trim() || '',
                year: parseInt($('.year', html).text()) || new Date().getFullYear(),
                rating_imdb: parseFloat($('.rating', html).text()) || 0,
                genres: $('.genres a', html).map(function() { return $(this).text(); }).get(),
                countries: $('.country', html).text().trim().split(','),
                playlist: []
            };

            // Все возможные плееры
            let players = [];
            let iframes = html.match(/<iframe[^>]+src\s*=\s*"([^"]+)"/gi);
            if (iframes) {
                iframes.forEach(function(iframe) {
                    let src = iframe.match(/src\s*=\s*"([^"]+)"/)[1];
                    players.push({
                        quality: src.includes('4k') || src.includes('2160') ? '4K' : 'FullHD',
                        url: src,
                        timeline: 0
                    });
                });
            }

            // Видео ссылки
            let videos = html.match(/file:\s*"([^"]+\.mp4[^"]*)"/gi);
            if (videos) {
                videos.forEach(function(video) {
                    let src = video.match(/file:\s*"([^"]+)"/)[1];
                    players.push({
                        quality: '4K',
                        url: src,
                        timeline: 0
                    });
                });
            }

            data.playlist = players.length ? players : [{
                quality: '4K',
                url: $('.player iframe', html).attr('src') || '',
                timeline: 0
            }];

            return data;
        });
    }

    // Поиск
    function search4k(query) {
        let searchUrl = `${fourKFilm.url}?s=${encodeURIComponent(query)}`;
        return parseCatalog(searchUrl);
    }

    // === РЕГИСТРАЦИЯ В ЛАМПЕ ===
    Lampa.Plugins.call({
        name: 'Ultra-4K-Film',
        version: '3.0',
        description: '4K-Film.lol + Ultra Info',
        start: function() {
            console.log('🔥 4K-Film.lol плагин загружен!');

            // Каталог
            Lampa.Catalogs.push({
                url: fourKFilm.url,
                name: fourKFilm.name,
                card_category: 'online',
                parse: parseCatalog
            });

            // Кнопка в меню
            Lampa.Template.add('catalog_4kfilm', {
                title: fourKFilm.name,
                href: fourKFilm.url,
                object: {
                    parse: parseCatalog,
                    search: search4k
                }
            });

            // Full card
            Lampa.Listener.follow('full', function(e) {
                if (e.type == 'complite' && e.url.includes(fourKFilm.hosts[0])) {
                    parseCard(e.url).then(function(data) {
                        e.data = data;
                        Lampa.Controller.toggle('full_start');
                    }).catch(console.error);
                }
            });

            // Главное меню
            Lampa.Template.add('main_menu_catalog', {
                title: '4K Фильмы',
                html: `<div class="full-start__item selector focus" data-subtitle="4K контент" data-href="${fourKFilm.url}">
                    <div class="full-start__img selector">
                        <svg width="36px" height="36px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </div>
                    <div class="full-start__body">
                        <div class="full-start__title">${fourKFilm.name}</div>
                        <div class="full-start__text">4K UHD фильмы</div>
                    </div>
                </div>`
            });
        }
    });

    // Экспорт для поиска
    window.Search4KFilm = search4k;
})();
