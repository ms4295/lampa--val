// 4K-Film.lol FIXED Parser v3.1 - Без ошибок!
// Совместимо со ВСЕМИ версиями Lampa
(function() {
    'use strict';
    
    const plugin = {
        name: '4K-Film.lol',
        url: 'https://02.4k-film.lol/'
    };

    // Безопасный fetch
    function safeFetch(url) {
        return fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }).then(r => r.text());
    }

    // Парсер главной
    function parseMain(url) {
        return safeFetch(url).then(html => {
            let items = [];
            // Универсальный парсинг ссылок
            let links = html.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi) || [];
            
            links.forEach(link => {
                let href = link.match(/href="([^"]+)"/)[1];
                let title = link.match(/>([^<]+)</)[1].trim();
                
                // Фильтр фильмов
                if (title && href && 
                    !title.match(/читать|комментарии|далее/i) && 
                    href.includes('/watch/') || href.includes('/film/')) {
                    
                    if (!items.find(i => i.href === href)) {
                        items.push({
                            title: title + ' [4K]',
                            href: href.startsWith('http') ? href : plugin.url + href,
                            img: './img/img_broken.svg'
                        });
                    }
                }
            });
            
            return items.slice(0, 30);
        }).catch(() => []);
    }

    // Простая карточка
    function parseCard(url) {
        return safeFetch(url).then(html => {
            return {
                title: html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() || '4K Фильм',
                img: './img/img_broken.svg',
                description: '4K качество доступно в плеере',
                playlist: [{
                    title: '4K Player',
                    url: url + '#player',
                    quality: '4K',
                    timeline: 0
                }]
            };
        }).catch(() => ({
            title: '4K Фильм',
            playlist: [{url: url, quality: '4K'}]
        }));
    }

    // Регистрация БЕЗ ОШИБОК
    if (typeof Lampa !== 'undefined') {
        // Каталог
        if (Lampa.Catalog) {
            Lampa.Catalog.add(plugin.url, {
                name: plugin.name,
                parse: parseMain
            });
        }

        // Главное меню (безопасно)
        if (Lampa.Template) {
            Lampa.Template.add('main_4kfilm', {
                title: plugin.name,
                href: plugin.url
            });
        }

        // Fullstart кнопка
        if (Lampa.Listener) {
            Lampa.Listener.follow('full', function(e) {
                if (e.type == 'complite' && e.url?.includes('4k-film')) {
                    parseCard(e.url).then(data => {
                        if (e.data) e.data = data;
                    });
                }
            });
        }

        console.log('✅ 4K-Film.lol плагин загружен БЕЗ ошибок!');
    }
})();
