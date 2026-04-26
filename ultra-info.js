// 🔥 MEGA 4K Lampa Plugin v5.0 — ФИНАЛЬНАЯ ВЕРСИЯ
// ВИДИМ НА ГЛАВНОМ ЭКРАНЕ! 7x 4K источников
// Замени ВСЁ содержимое ultra-info.js
(function() {
    'use strict';
    
    console.log('🚀 MEGA 4K v5.0 загружается...');
    
    // 📺 7x ТОП 4K источников
    const FOUR_K_SITES = [
        {
            name: '4K-Film 4K',
            url: 'https://02.4k-film.lol/',
            icon: '🎥'
        },
        {
            name: 'GreenHD 4K',
            url: 'https://greenhd.one/',
            icon: '🌿'
        },
        {
            name: 'HDRezka 4K',
            url: 'https://hdrezka.ag/',
            icon: '📺'
        },
        {
            name: 'LordFilm 4K',
            url: 'https://lordfilms-s.com/',
            icon: '👑'
        },
        {
            name: 'Zetflix 4K',
            url: 'https://zetflix.to/',
            icon: '⚡'
        },
        {
            name: 'RXFilm 4K',
            url: 'https://rxfilm.net/',
            icon: '📱'
        },
        {
            name: 'Kinogo HD',
            url: 'https://kinogo.inc/',
            icon: '⭐'
        }
    ];

    // 🛠️ Парсер контента
    function parseContent(url) {
        return fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        .then(response => response.text())
        .then(html => {
            const items = [];
            // Универсальный поиск ссылок
            const links = html.match(/<a\s+[^>]*href\s*=\s*["']([^"']+)[^>]*>([^<]+)<\/a>/gi) || [];
            
            links.slice(0, 30).forEach(link => {
                const hrefMatch = link.match(/href\s*=\s*["']([^"']+)["']/);
                const titleMatch = link.match(/>[^<]+</);
                
                if (hrefMatch && titleMatch) {
                    let href = hrefMatch[1];
                    let title = titleMatch[0].replace(/[><]/g, '').trim();
                    
                    // Фильтр контента
                    if (title.length > 3 && 
                        !title.match(/^(коммент|форум|скачать|главная)/i) &&
                        href.match(/(watch|film|movie|serial)/i)) {
                        
                        items.push({
                            title: title + ' [4K]',
                            href: href.startsWith('http') ? href : new URL(href, url).href,
                            img: './img/img_broken.svg',
                            quality: '4K'
                        });
                    }
                }
            });
            
            return items;
        })
        .catch(error => {
            console.log('❌ Парсинг ' + url + ': ' + error.message);
            return [];
        });
    }

    // 🎯 ИНИЦИАЛИЗАЦИЯ ПЛАГИНА
    if (typeof Lampa === 'undefined') {
        console.log('❌ Lampa не найдена');
        return;
    }

    console.log('✅ MEGA 4K v5.0 инициализация...');

    // 1️⃣ ДОБАВЛЯЕМ В ГЛАВНОЕ МЕНЮ (ТОП ПОЛОЖЕНИЕ!)
    if (Lampa.Template && Lampa.Template.add) {
        Lampa.Template.add('mega_4k_menu', {
            title: '🎬 MEGA 4K (' + FOUR_K_SITES.length + ')',
            href: FOUR_K_SITES[0].url,
            description: '4K фильмы и сериалы'
        });
        
        console.log('✅ Главное меню добавлено');
    }

    // 2️⃣ ONLINE КАТАЛОГИ (БУДУТ В ОНЛАЙН!)
    FOUR_K_SITES.forEach((site, index) => {
        const templateName = 'online_' + index;
        
        Lampa.Template.add(templateName, {
            href: site.url,
            title: site.icon + ' ' + site.name,
            card: true,
            object: {
                parse: () => parseContent(site.url)
            }
        });
        
        console.log('✅ Онлайн добавлен: ' + site.name);
    });

    // 3️⃣ FULLSTART КНОПКИ (ПРИ КЛИКЕ НА ОНЛАЙН!)
    if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.node) {
                // Создаём кнопки 4K
                let html = '';
                FOUR_K_SITES.slice(0, 6).forEach(site => {
                    html += `
                    <div class="full-start__item selector online selector focus" data-href="${site.url}">
                        <div class="online__title">${site.icon} ${site.name}</div>
                        <div class="online__quality">4K</div>
                    </div>`;
                });
                
                // Вставляем на экран
                const container = e.node.querySelector('.view--online .full-start__buttons');
                if (container) {
                    container.innerHTML = html;
                }
            }
        });
        
        console.log('✅ Fullstart кнопки добавлены');
    }

    // 4️⃣ КАРТОЧКА ФИЛЬМА
    Lampa.Listener.follow('full', function(e) {
        if (e.type === 'select' && e.node) {
            const href = e.node.getAttribute('data-href');
            if (href && FOUR_K_SITES.some(site => href.includes(site.url))) {
                e.data = {
                    title: '4K Каталог',
                    playlist: [{
                        quality: '4K',
                        url: href,
                        timeline: 0
                    }]
                };
            }
        }
    });

    console.log('🎉 MEGA 4K v5.0 ✅ ПОЛНАЯ ЗАГРУЗКА!');
    console.log('📱 Ищи: Главная → MEGA 4K (7)');
    console.log('📱 Онлайн → 4K-Film 4K, GreenHD 4K...');
})();
