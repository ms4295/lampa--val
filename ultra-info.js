// 🎬 4K-FILM КНОПКА в ОНЛАЙН — ГАРАНТИЯ!
(function() {
    'use strict';
    
    console.log('🎯 4K-Film кнопка загружается...');
    
    // Ждём полной загрузки Лампы
    function init4KButton() {
        if (typeof Lampa === 'undefined') {
            setTimeout(init4KButton, 1000);
            return;
        }
        
        console.log('✅ Lampa найдена!');
        
        // 🎯 КНОПКА ТОЛЬКО в ONLINE Fullstart!
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite') {
                const container = document.querySelector('.view--online .full-start__buttons');
                if (container && !container.querySelector('.my-4k-film')) {
                    
                    // 🆕 КНОПКА 4K-FILM
                    const button = document.createElement('div');
                    button.className = 'full-start__item selector online selector focus my-4k-film';
                    button.setAttribute('data-href', 'https://02.4k-film.lol/');
                    button.innerHTML = `
                        <div class="online__title">🎥 4K-Film.lol</div>
                        <div class="online__quality">4K</div>
                    `;
                    
                    // Вставляем ПЕРВУЯ!
                    container.insertBefore(button, container.firstChild);
                    console.log('✅ 4K-Film кнопка ДОБАВЛЕНА в Онлайн!');
                }
            }
        });
        
        // Обработчик клика
        document.addEventListener('click', function(e) {
            if (e.target.closest('.my-4k-film')) {
                const href = e.target.closest('.my-4k-film').getAttribute('data-href');
                Lampa.Activity.push({
                    url: href,
                    title: '4K-Film.lol',
                    component: 'full',
                    search: '',
                    search_one: '',
                    search_two: '',
                    search_three: '',
                    page: 1
                });
                console.log('🎬 Переход на 4K-Film.lol');
            }
        });
        
        console.log('🎉 4K-Film плагин АКТИВЕН!');
    }
    
    // 🚀 СТАРТ
    init4KButton();
})();
