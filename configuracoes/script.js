document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.settings-tab');
    const sections = document.querySelectorAll('.settings-section');
    const saveBtn = document.getElementById('btn-save-settings');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;
            tabs.forEach((btn) => btn.classList.remove('active'));
            sections.forEach((section) => section.classList.remove('active'));

            tab.classList.add('active');
            const selected = document.getElementById(target);
            if (selected) selected.classList.add('active');
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            window.alert('Configuracoes salvas com sucesso.');
        });
    }
});
