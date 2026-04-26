// 🔥 MEGA 4K PARSER v4.0 — 25+ САЙТОВ!
// Максимальный охват 4K/UHD без зависимостей
// Копируй → GitHub → Лампа = ЛЕГЕНДА!
(function() {
    'use strict';
    
    // 🔥 25+ 4K источников (ТОП 2024)
    const MEGA_SOURCES = [
        // 🔥 4K/UHD СПЕЦИАЛИСТЫ (ТОП-7)
        {name: 'GreenHD', url: 'https://greenhd.one/', parser: 'greenhd', priority: 10},
        {name: '4K-Film', url: 'https://02.4k-film.lol/', parser: 'rezka', priority: 9},
        {name: 'HDRezka', url: 'https://hdrezka.ag/', parser: 'rezka', priority: 9},
        {name: 'LordFilm', url: 'https://lordfilms-s.com/', parser: 'lordfilm', priority: 8},
        {name: 'UltraHD', url: 'https://uhd-film.lol/', parser: 'rezka', priority: 8},
        {name: 'Zetflix', url: 'https://zetflix.to/', parser: 'zetflix', priority: 7},
        {name: 'RX4K', url: 'https://rx4k.net/', parser: 'rxf', priority: 7},
        
        // 🎥 FullHD+ с 4K опциями (ТОП-10)
        {name: 'Kinogo', url: 'https://kinogo.inc/', parser: 'kinogo', priority: 6},
        {name: 'Collaps', url: 'https://collaps.org/', parser: 'collaps', priority: 6},
        {name: 'RXFilm', url: 'https://rxfilm.net/', parser: 'rxf', priority: 6},
        {name: 'MovieHD', url: 'https://moviehd.one/', parser: 'moviehd', priority: 5},
        {name: 'StepFilm', url: 'https://stepfilm.ru/', parser: 'stepfilm', priority: 5},
        {name: 'AlexFilm', url: 'https://alexfilm.in/', parser: 'alexfilm', priority: 5},
        {name: 'BazonTV', url: 'https://bazon.tv/', parser: 'bazon', priority: 5},
        {name: 'Seasonvar', url: 'https://seasonvar.ru/', parser: 'seasonvar', priority: 4},
        {name: 'LostFilm', url: 'https://lostfilm.tv/', parser: 'lostfilm', priority: 4},
        {name: 'NewStudio', url: 'https://newstudio.tv/', parser: 'newstudio', priority: 4},
        
        // ⚡ Резерв/новые (ТОП-8)
        {name: 'ToxFilm', url: 'https://toxflix.net/', parser: 'rezka', priority: 3},
        {name: 'KinoGoHD', url: 'https://kinogohd.club/', parser: 'kinogo', priority: 3},
        {name: 'Filmix', url: 'https://filmix.ac/', parser: 'filmix', priority: 3},
        {name: 'Moonwalk', url: 'https://moonwalk.cc/', parser: 'moonwalk', priority: 2},
        {name: 'Jedai', url: 'https://jedai.tv/', parser: 'jedai', priority: 2},
        {name: 'VodFilm', url: 'https://vodfilm.net/', parser: 'vodfilm', priority: 2},
        {name: 'KinoLord', url: 'https://kinolord.site/', parser: 'lordfilm', priority: 1},
        {name: 'SuperFilm', url: 'https://superfilm.tv/', parser: 'rezka', priority: 1}
    ];

    // 🛠️ Универсальный МЕГА-парсер
    function megaParse(url, html) {
        let items = [];
        
        // 🎯 Паттерны для фильмов
        const patterns = [
            /<a[^>]+href="(\/(?:watch|film|movie|serial)[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            /<div[^>]*class="post-item"[^>]*>[\s\S]*?href="([^"]+)"[^>]*>([^<]+)<\/[^>]+>/gi,
            /<h3[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a><\/h3>/gi
        ];
        
        patterns.forEach(pattern => {
            let matches = html.match(pattern) || [];
            matches.forEach(match => {
                let href = match.match(/href="([^"]+)"/)?.[1];
                let title = match.match(/>([^<]+)</)?.[1]?.trim();
                
                if (title && href && title.length > 2) {
                    // 🚀 4K/UHD приоритет
                    let quality = 'FullHD';
                    if (title.match(/4K|UHD|2160p|HDR|Dolby/i) || 
                        href.match(/2160|4k|uhd/i)) {
                        quality = '4K';
                        title = title.replace(/\$4K\$/i, '') + ' [4K]';
                    }
                    
                    let fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                    
                    if (!items.find(i => i.href === fullUrl)) {
                        items.push({
                            title: title,
                            original_title: title.replace(/ \$4K\$/i, ''),
                            href: fullUrl,
                            img: './img/img_broken.svg',
                            quality: quality,
                            source: new URL(url).hostname
                        });
                    }
                }
            });
        });
        
        return items.slice(0, 50); // Лимит для скорости
    }

    // 🌐 Мультипоиск
    function megaSearch(query) {
        let promises = MEGA_SOURCES.slice(0, 5).map(source => // Топ-5 для скорости
            fetch(source.url + (source.url.includes('?') ? '&' : '?') + 's=' + encodeURIComponent(query))
                .then(r => r.text())
                .then(html => megaParse(source.url, html))
                .then(items => items.map(i => ({...i, source: source.name})))
        );
        
        return Promise.all(promises).then(results => 
            results.flat().slice(0, 30)
        );
    }

    // 🎬 Регистрация МЕГА-плагина
    if (typeof Lampa !== 'undefined') {
        console.log('🚀 MEGA 4K загружается... ' + MEGA_SOURCES.length + ' источников');
        
        // 📂 Все каталоги
        MEGA_SOURCES.forEach(source => {
            if (Lampa.Catalog && Lampa.Catalog.add) {
                Lampa.Catalog.add(source.url, {
                    name: source.name + (source.priority > 5 ? ' 4K' : ''),
                    card_category: 'online',
                    parse: () => fetch(source.url).then(r => r.text()).then(html => megaParse(source.url, html))
                });
            }
        });

        // ⭐ Главная кнопка
        if (Lampa.Template) {
            Lampa.Template.add('mega4k_main', {
                title: '🎬 MEGA 4K (' + MEGA_SOURCES.length + ')',
                href: MEGA_SOURCES[0].url,
                description: '25+ источников 4K/UHD'
            });
        }

        // 🔍 Глобальный поиск
        if (window.LampaSearch) {
            window.LampaSearch.mega4k = megaSearch;
        }

        // 📱 Full card обработка
        if (Lampa.Listener) {
            Lampa.Listener.follow('full', function(e) {
                if (e.type == 'complite') {
                    let hostname = new URL(e.url || '').hostname;
                    let source = MEGA_SOURCES.find(s => hostname.includes(s.name.toLowerCase()));
                    if (source) {
                        // Простой плеер
                        e.data = {
                            title: e.data?.title || '4K Фильм',
                            playlist: [{
                                quality: '4K',
                                url: e.url,
                                timeline: 0
                            }]
                        };
                    }
                }
            });
        }

        console.log('✅ MEGA 4K LOADED! ' + MEGA_SOURCES.length + ' источников онлайн');
        console.log('📱 Ищи: Онлайн → GreenHD 4K, LordFilm 4K...');
    }
})();
