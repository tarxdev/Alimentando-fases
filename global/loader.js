/* ARQUIVO: global/loader.js */
class GlobalLoaderManager {
    constructor() {
        this.id = 'af-global-loader';
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.inject());
        } else {
            this.inject();
        }
    }

    inject() {
        if (document.getElementById(this.id)) return;
        const html = `
            <div id="${this.id}" class="af-loader-overlay">
                <div class="af-spinner-container">
                    <div class="af-ring"></div>
                    <div class="af-ring-inner"></div>
                    <i class="fa-solid fa-leaf af-icon"></i>
                </div>
                <div class="af-text" id="af-loader-text">Carregando...</div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    show(msg = "Carregando...") {
        const el = document.getElementById(this.id);
        if(el) {
            el.querySelector('#af-loader-text').innerText = msg;
            el.classList.add('visible');
        }
    }

    hide() {
        const el = document.getElementById(this.id);
        if(el) el.classList.remove('visible');
    }
}
window.GlobalLoader = new GlobalLoaderManager();