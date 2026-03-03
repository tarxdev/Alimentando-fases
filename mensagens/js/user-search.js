import { searchUsersByUsername } from '../../comunidade/js/services/user-search.service.js';
import { escapeHtml } from '../../comunidade/js/utils/formatters.js';

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('sidebar-user-search');
    if (!input) return;

    let dropdown = document.getElementById('sidebar-user-search-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'sidebar-user-search-dropdown';
        dropdown.className = 'search-dropdown';
        input.parentNode.appendChild(dropdown);
    }

    input.addEventListener('input', async (e) => {
        const term = e.target.value.trim();
        if (term.length < 2) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
            return;
        }
        const users = await searchUsersByUsername(term);
        dropdown.innerHTML = '';
        if (users.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#888;">Nenhum usuário encontrado.</div>';
        } else {
            users.forEach(user => {
                const div = document.createElement('div');
                div.className = 'search-item';
                div.innerHTML = `
                    <div class="s-icon-box"><i class="fa-solid fa-user"></i></div>
                    <div class="s-info">
                        <span class="s-title">@${escapeHtml(user.username)}</span>
                        <span class="s-desc">${escapeHtml(user.name || user.realname || '')}</span>
                    </div>
                `;
                div.addEventListener('click', () => {
                    window.location.href = `/perfil/index.html?uid=${user.uid}`;
                });
                dropdown.appendChild(div);
            });
        }
        dropdown.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
});
