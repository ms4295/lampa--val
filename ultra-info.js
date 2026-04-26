// 4K-Film.lol Parser v2.0 for Lampa
// Автор: Blackbox AI Assistant
(function() {
    'use strict';
    
    const plugin = {
        name: '4K-Film.lol',
        version: '2.0',
        description: 'Полный парсер 4K фильмов',
        url: 'https://02.4k-film.lol/',
        hosts: ['4k-film.lol', '02.4k-film.lol']
    };

    // Главная страница / Каталог
    function parseMain(url) {
        return networks.silent(url, function(html) {
            let items = [];
            let parsed = html.match(/<div class="post-item[^>]*>([\s\S]*?)<\/div>/gi) || [];
            
            parsed.forEach(block => {
                let titleMatch = block.match(/<h3[^>]*>([^<]+)<\/h3>/i);
                let hrefMatch = block.match(/href="([^"]+)"/i);
                let imgMatch = block.match(/src="([^"]+\.(jpg|png|webp))"/i);
                
                if (titleMatch && hrefMatch) {
                    let title = titleMatch[1].trim();
                    let href = hrefMatch[1];
                    let img = imgMatch ? imgMatch[1] : '';
                    
                    // 4K маркер
                    if (title.match(/4K|UHD|2160p/i) || block.match(/4K|UHD/i)) {
                        title += ' [4K]';
                    }
                    
                    items.push({
                        title: title,
                        href: href.startsWith('http') ? href : plugin.url + href,
                        img: img || './img/img_broken.svg'
                    });
                }
            });
            
            return items;
        });
    }

    // Страница фильма
    function parseCard(url) {
        return networks.silent(url, function(html) {
            let data = {
                title: $('h1', html).text().trim() || '',
                original_title: $('.original-title', html).text().trim() || '',
                img: $('.poster img', html).attr('src') || '',
                description: $('.description', html).text().trim() || '',
                year: parseInt($('.year', html).text()) || 0,
                rating: parseFloat($('.rating', html).text()) || 0,
                playlist: []
            };

            // Ищем плееры 4K
            let iframes = html.match(/<iframe[^>]+src="([^"]+)"[^>]*>/gi);
            if (iframes) {
                iframes.forEach(iframe => {
                    let src = iframe.match(/src="([^"]+)"/)[1];
                    if (src.includes('4k') || src.includes('2160')) {
                        data.playlist.push({
                            quality: '4K',
                            url: src,
                            timeline: 0
                        });
                    }
                });
            }
            
            return data;
        });
    }

    // Поиск
    function search(query) {
        let url = `${plugin.url}search/?q=${encodeURIComponent(query)}`;
        return parseMain(url);
    }

    // Регистрация плагина
    Lampa.Plugins.call({
        name: plugin.name,
        start: function() {
            // Добавляем в каталог
            Lampa.Template.add('catalog', {
                title: plugin.name,
                href: plugin.url,
                content: 'online'
            });

            // Главная страница
            Lampa.Template.add('online', {
                href: plugin.url,
                handler: 'catalog',
                parse: parseMain
            });

            // Карточка фильма
            Lampa.Listener.follow('full', function(e) {
                if (e.type === 'complite' && e.url.includes(plugin.hosts[0])) {
                    parseCard(e.url).then(data => {
                        e.data = data;
                        Lampa.Controller.toggle('full_start');
                    });
                }
            });

            // Кнопка в меню
            Lampa.Template.add('button_catalog', {
                name: plugin.name,
                html: `<div class="selector focus" data-href="${plugin.url}">
                    <div class="selector__title">${plugin.name}</div>
                    <div class="selector__quality">4K</div>
                </div>`
            });
        }
    });

})();
