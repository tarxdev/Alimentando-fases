import './global/developer-console.js';
document.addEventListener('DOMContentLoaded', () => {

    // Referências dos elementos de estado
    const btnEntrar = document.getElementById('btn-entrar');
    const userProfileActions = document.getElementById('user-profile-actions');
    const userDisplayName = document.getElementById('user-display-name');
    // Note que 'btnSair' foi removido desta lista.

    // Verifica o estado de autenticação do usuário
    // O auth é definido no seu firebase-config.js
    if (typeof firebase !== 'undefined' && firebase.auth) {
        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // --- USUÁRIO ESTÁ LOGADO ---
                
                // 1. Esconde o botão 'Entrar'
                if (btnEntrar) btnEntrar.style.display = 'none';

                // 2. Mostra as ações do Perfil (Olá, Nome)
                // Usamos 'flex' porque o CSS do .profile-actions depende disso para alinhar
                if (userProfileActions) userProfileActions.style.display = 'flex'; 

                // 3. Atualiza o nome de exibição
                const name = user.displayName || user.email; // Pega o nome ou o e-mail
                if (userDisplayName) {
                    // Exibe apenas o primeiro nome, usando 'Perfil' como fallback
                    const firstName = name.split(' ')[0] || 'Perfil'; 
                    userDisplayName.textContent = firstName;
                }

                // ❌ O CÓDIGO DO BOTÃO SAIR FOI REMOVIDO DAQUI ❌
                // A lógica de sair agora será tratada apenas dentro do perfil/script.js

            } else {
                // --- USUÁRIO ESTÁ DESLOGADO ---
                
                // 1. Mostra o botão 'Entrar'
                if (btnEntrar) btnEntrar.style.display = 'flex'; 
                
                // 2. Esconde as ações do Perfil
                if (userProfileActions) userProfileActions.style.display = 'none';
            }
        });
    } else {
        console.error("Firebase Auth não está carregado. Verifique o firebase-config.js");
    }
});