export class Calculators {
    static init() {
        // --- Água (Mantido) ---
        const weightInput = document.getElementById('user-weight-water');
        if (weightInput) {
            weightInput.addEventListener('input', () => {
                const weight = parseFloat(weightInput.value);
                const result = document.getElementById('water-result-text');
                const area = document.getElementById('calc-result-area');
                if (weight > 0) {
                    const liters = (weight * 35 / 1000).toFixed(2);
                    result.innerText = `${liters} Litros`;
                    area.classList.remove('hidden');
                } else { area.classList.add('hidden'); }
            });
        }

        // --- IMC (Mantido) ---
        const btnIMC = document.getElementById('btn-calc-imc');
        if (btnIMC) {
            btnIMC.addEventListener('click', () => {
                const h = parseFloat(document.getElementById('imc-height').value) / 100;
                const w = parseFloat(document.getElementById('imc-weight').value);
                const valEl = document.getElementById('imc-value');
                const badge = document.getElementById('imc-status-badge');
                const area = document.getElementById('imc-result-area');
                if (h > 0 && w > 0) {
                    const imc = (w / (h * h)).toFixed(1);
                    valEl.innerText = imc;
                    area.classList.remove('hidden');
                    if (imc < 18.5) { badge.innerText = "Abaixo do peso"; badge.style.color = "#e67e22"; }
                    else if (imc < 24.9) { badge.innerText = "Peso Normal"; badge.style.color = "#27ae60"; }
                    else if (imc < 29.9) { badge.innerText = "Sobrepeso"; badge.style.color = "#f39c12"; }
                    else { badge.innerText = "Obesidade"; badge.style.color = "#c0392b"; }
                }
            });
        }

        // --- TMB MODAL LOGIC (ATUALIZADO) ---
        const btnTMB = document.getElementById('btn-calc-tmb');
        const modalTMB = document.getElementById('modal-tmb-result');
        const btnCloseTMB = document.querySelector('.btn-close-tmb-modal');

        if (btnTMB && modalTMB) {
            
            // Fechar Modal
            const closeModal = () => modalTMB.classList.remove('active');
            if(btnCloseTMB) btnCloseTMB.onclick = closeModal;
            modalTMB.onclick = (e) => { if(e.target === modalTMB) closeModal(); };

            // Calcular e Abrir
            btnTMB.addEventListener('click', () => {
                const weight = parseFloat(document.getElementById('tmb-weight').value);
                const height = parseFloat(document.getElementById('tmb-height').value);
                const age = parseFloat(document.getElementById('tmb-age').value);
                const activity = parseFloat(document.getElementById('tmb-activity').value);
                const genderEl = document.querySelector('input[name="tmb-gender"]:checked');
                const gender = genderEl ? genderEl.value : 'male';

                if (weight > 0 && height > 0 && age > 0) {
                    // Mifflin-St Jeor
                    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
                    bmr = (gender === 'male') ? bmr + 5 : bmr - 161;
                    const totalTDEE = bmr * activity;

                    // Abre Modal
                    modalTMB.classList.add('active');

                    // Animação dos Números (Count Up)
                    this.animateValue("modal-tmb-basal", 0, Math.round(bmr), 1500);
                    this.animateValue("modal-tmb-total", 0, Math.round(totalTDEE), 2000);
                } else {
                    alert('Preencha peso, altura e idade corretamente.');
                }
            });
        }
    }

    // Função Utilitária de Animação Numérica
    static animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}