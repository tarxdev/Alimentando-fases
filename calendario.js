const FullPageCalendar = {
    date: new Date(),
    today: new Date(),

    events: [
        {
            date: '2025-10-23',
            title: 'Acao Infantil e Idosos',
            type: 'acao',
            desc: 'Atividades ludicas e roda de conversa.',
            loc: 'Escola Gilberto Freyre | Parque Santana',
            images: ['Imagens/acaoinfancia3.webp', 'Imagens/acaoidosos4.webp']
        },
        {
            date: '2025-10-24',
            title: 'Acao Idosos (Dia 2)',
            type: 'acao',
            desc: 'Continuacao das atividades.',
            loc: 'Parque Santana',
            images: ['Imagens/acaoidosos1.webp']
        },
        {
            date: '2025-11-03',
            title: 'Acao Adultos',
            type: 'acao',
            desc: 'Saude do trabalhador e DCNT.',
            loc: 'CDC',
            images: ['Imagens/acaoadultos1.webp']
        },
        {
            date: '2025-11-05',
            title: 'Acao Adultos (Dia 2)',
            type: 'acao',
            desc: 'Palestras e avaliacoes.',
            loc: 'CDC',
            images: ['Imagens/acaoadultos2.webp']
        },
        {
            date: '2025-12-25',
            title: 'Natal',
            type: 'feriado',
            desc: 'Feriado nacional.',
            loc: 'Em todo lugar',
            images: ['Imagens/Farofa Festiva.webp', 'Imagens/Rabanada de Forno.webp']
        }
    ],

    init() {
        const container = document.getElementById('calendar-days-full');
        if (!container) return;

        const prevBtn = document.getElementById('prev-month-full');
        const nextBtn = document.getElementById('next-month-full');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() - 1);
                this.render();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.date.setMonth(this.date.getMonth() + 1);
                this.render();
            });
        }

        this.render();
    },

    render() {
        const monthYear = document.getElementById('current-month-full');
        const daysContainer = document.getElementById('calendar-days-full');
        if (!daysContainer) return;

        this.date.setDate(1);

        const month = this.date.getMonth();
        const year = this.date.getFullYear();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();
        const firstDayIndex = this.date.getDay();

        const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        if (monthYear) monthYear.innerText = `${months[month]} ${year}`;
        daysContainer.innerHTML = '';

        for (let x = firstDayIndex; x > 0; x -= 1) {
            daysContainer.innerHTML += `<li class="inactive">${prevLastDay - x + 1}</li>`;
        }

        for (let i = 1; i <= lastDay; i += 1) {
            const li = document.createElement('li');
            let content = `<span>${i}</span>`;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (
                i === this.today.getDate()
                && month === this.today.getMonth()
                && year === this.today.getFullYear()
            ) {
                li.classList.add('current-day');
            }

            const event = this.events.find((e) => e.date === dateStr);

            if (event) {
                li.classList.add('has-event', `type-${event.type}`);
                li.setAttribute('data-title', event.title);

                let iconClass = 'fa-circle';
                if (event.type === 'acao') iconClass = 'fa-handshake';
                if (event.type === 'feriado') iconClass = 'fa-star';

                content += `<div class="event-icon-marker"><i class="fa-solid ${iconClass}"></i></div>`;
            }

            li.innerHTML = content;
            li.addEventListener('click', () => {
                document.querySelectorAll('.days-full li').forEach((el) => el.classList.remove('selected-day'));
                li.classList.add('selected-day');
                this.showDetails(i, month, months, event);
            });

            daysContainer.appendChild(li);
        }
    },

    showDetails(day, monthIndex, monthNames, event) {
        const display = document.getElementById('event-card-display');
        if (!display) return;

        const fullDate = `${day} de ${monthNames[monthIndex]}`;

        if (event) {
            let iconClass = 'fa-calendar-check';
            if (event.type === 'acao') iconClass = 'fa-users';
            if (event.type === 'feriado') iconClass = 'fa-star';

            const googleDate = event.date.replace(/-/g, '') + 'T090000';
            const googleDateEnd = event.date.replace(/-/g, '') + 'T120000';
            const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.desc)}&location=${encodeURIComponent(event.loc)}&dates=${googleDate}/${googleDateEnd}`;

            let galleryHTML = '';
            if (event.images && event.images.length > 0) {
                galleryHTML = '<div class="event-gallery-stack">';
                event.images.forEach((imgSrc) => {
                    galleryHTML += `<div class="gallery-stack-item"><img src="${imgSrc}" alt="Foto do evento"></div>`;
                });
                galleryHTML += '</div>';
            }

            display.innerHTML = `
                <div class="event-card-full">
                    ${galleryHTML}
                    <span class="date-badge">${fullDate}</span>
                    <h2>${event.title}</h2>
                    <p>${event.desc}</p>
                    <div class="event-meta-grid">
                        <div class="meta-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>${event.loc}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid ${iconClass}"></i>
                            <span style="text-transform: capitalize;">${event.type}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px;">
                        <a href="${googleUrl}" target="_blank" class="cta-button" style="padding:10px 20px; font-size:0.9em; flex:1; display:flex; align-items:center; justify-content:center; gap:8px; text-align:center;">
                            <i class="fa-solid fa-calendar-plus"></i> Salvar
                        </a>
                    </div>
                </div>
            `;
        } else {
            display.innerHTML = `
                <div class="empty-state-full">
                    <i class="fa-regular fa-calendar"></i>
                    <h4 style="color: var(--color-secondary);">${fullDate}</h4>
                    <p>Nao ha eventos agendados para este dia.</p>
                </div>
            `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FullPageCalendar.init();

    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    const btnCloseMobileMenu = document.getElementById('btn-close-mobile-menu');

    if (btnMobileMenu && mobileOverlay) {
        btnMobileMenu.addEventListener('click', () => mobileOverlay.classList.add('open'));
    }

    if (btnCloseMobileMenu && mobileOverlay) {
        btnCloseMobileMenu.addEventListener('click', () => mobileOverlay.classList.remove('open'));
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', (event) => {
            if (event.target === mobileOverlay) {
                mobileOverlay.classList.remove('open');
            }
        });

        mobileOverlay.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => mobileOverlay.classList.remove('open'));
        });
    }
});
