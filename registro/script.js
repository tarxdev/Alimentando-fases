import { auth, db } from '../firebase-config.js'; 
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 1. IMPORTAÇÃO DO MOTOR DE SEGURANÇA (Assembly)
import { asmCrypto } from '../mensagens/js/services/asm-loader.js';

document.addEventListener('DOMContentLoaded', () => {

    // 2. INICIALIZAÇÃO IMEDIATA DA SEGURANÇA
    asmCrypto.init();

    // --- CONFIGURAÇÃO DE TEMAS ---
    const CONFIG_PRO = {
        'nutricionista': {
            label: 'Número do CRN',
            placeholder: 'Ex: 12345',
            msg: 'Para prescrever dietas, precisamos validar seu CRN.',
            icon: 'fa-apple-whole',
            themeColor: '#53954a', // Verde
            welcomeTitle: 'Área do Nutricionista'
        },
        'personal': {
            label: 'Número do CREF',
            placeholder: 'Ex: 000000-G/PE',
            msg: 'Para prescrever treinos, precisamos validar seu CREF.',
            icon: 'fa-dumbbell',
            themeColor: '#e67e22', // Laranja
            welcomeTitle: 'Área do Treinador'
        },
        'medico': {
            label: 'Número do CRM',
            placeholder: 'Ex: 123456',
            msg: 'Para acompanhamento clínico, valide seu CRM.',
            icon: 'fa-user-doctor',
            themeColor: '#3498db', // Azul
            welcomeTitle: 'Área Médica'
        },
        'psicologo': {
            label: 'Número do CRP',
            placeholder: 'Ex: 00/12345',
            msg: 'Para terapia, valide seu CRP.',
            icon: 'fa-brain',
            themeColor: '#9b59b6', // Roxo
            welcomeTitle: 'Área da Psicologia'
        }
    };

    let selectedRole = null;
    let selectedProfession = null;

    // --- FUNÇÃO DE NAVEGAÇÃO ---
    const showStep = (stepId, title, sub) => {
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById(stepId).classList.add('active');
        document.getElementById('page-title').innerText = title;
        document.getElementById('page-subtitle').innerText = sub;
        document.getElementById('legal-footer').style.display = (stepId === 'step-0') ? 'block' : 'none';
    };

    // --- MÁSCARAS DE INPUT (SÊNIOR) ---
    
    // Data de Nascimento (DD/MM/AAAA)
    document.getElementById('birthdate').addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não é dígito
        
        if (v.length > 8) v = v.slice(0, 8); // Limita a 8 números

        // Máscara 00/00/0000
        if (v.length > 4) {
            v = v.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
        }
        
        e.target.value = v;
    });

    // Telefone
    document.getElementById('phone').addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g,"");
        if(v.length > 11) v = v.slice(0,11);
        v=v.replace(/^(\d{2})(\d)/g,"($1) $2");
        v=v.replace(/(\d)(\d{4})$/,"$1-$2");
        e.target.value = v;
    });

    // --- FLUXO DE NAVEGAÇÃO ---

    // 1. SELEÇÃO DE PERFIL
    document.querySelectorAll('#step-0 .type-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const role = card.getAttribute('data-role');

            if (role === 'student' || role === 'professional') {
                e.preventDefault();
                Swal.fire({
                    icon: 'info',
                    title: 'Em Breve!',
                    text: 'O cadastro para estudantes e profissionais estará disponível em breve. Agradecemos seu interesse!',
                    confirmButtonColor: '#53954a'
                });
                // Desmarcar qualquer seleção para evitar confusão visual
                document.querySelectorAll('#step-0 .type-card').forEach(c => c.classList.remove('selected'));
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
                selectedRole = null;
                return;
            }

            selectedRole = role;
            if(selectedRole !== 'professional') {
                document.documentElement.style.setProperty('--color-primary', '#53954a');
            }
            document.querySelectorAll('#step-0 .type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    document.getElementById('btn-next-0').onclick = () => {
        if(!selectedRole) return showLuxuryModal("Atenção", "Selecione um perfil.", "warning");
        if (selectedRole === 'professional') {
            showStep('step-pro-selection', 'Sua Especialidade', 'Qual sua área de atuação?');
        } else {
            showStep('step-1', 'Criar Acesso', 'Defina seu e-mail e senha');
        }
    };

    // 2. SELEÇÃO DE ESPECIALIDADE
    document.querySelectorAll('#step-pro-selection .pro-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedProfession = card.getAttribute('data-pro');
            document.querySelectorAll('#step-pro-selection .pro-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const config = CONFIG_PRO[selectedProfession];
            if(config) document.documentElement.style.setProperty('--color-primary', config.themeColor);
        });
    });

    document.getElementById('btn-next-pro-select').onclick = () => {
        if(!selectedProfession) return showLuxuryModal("Atenção", "Selecione sua profissão.", "warning");
        
        const config = CONFIG_PRO[selectedProfession];
        document.getElementById('pro-register').placeholder = config.placeholder;
        document.getElementById('dynamic-msg').innerText = config.msg;
        document.getElementById('dynamic-icon').className = `fa-solid ${config.icon}`;
        
        showStep('step-1', config.welcomeTitle, 'Crie suas credenciais');
    };
    
    document.getElementById('back-to-0-from-pro').onclick = (e) => { 
        e.preventDefault(); 
        document.documentElement.style.setProperty('--color-primary', '#53954a');
        showStep('step-0', 'Boas-vindas!', 'Selecione seu perfil:'); 
    };

    // 3. CREDENCIAIS
    document.getElementById('btn-next-1').onclick = () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('reg-password').value;
        const conf = document.getElementById('confirm-password').value;
        
        if(!email || !pass) return showLuxuryModal("Campos Vazios", "Preencha tudo.", "warning");
        if(pass.length < 6) return showLuxuryModal("Senha Curta", "Mínimo 6 caracteres.", "warning");
        if(pass !== conf) return showLuxuryModal("Erro", "Senhas não conferem.", "error");

        showStep('step-2', 'Dados Pessoais', 'Identificação básica');
    };
    
    document.getElementById('back-to-prev-1').onclick = (e) => {
        e.preventDefault();
        if(selectedRole === 'professional') showStep('step-pro-selection', 'Sua Especialidade', 'Qual sua área de atuação?');
        else showStep('step-0', 'Boas-vindas!', 'Selecione seu perfil:');
    };

    // 4. DADOS PESSOAIS (Agora com Data Manual)
    document.getElementById('btn-next-2').onclick = () => {
        const nome = document.getElementById('fullname').value;
        const nasc = document.getElementById('birthdate').value;
        const tel = document.getElementById('phone').value;

        if(!nome || !nasc || tel.length < 14) return showLuxuryModal("Dados Incompletos", "Preencha nome, data e celular.", "warning");
        // Validação simples de data (tamanho)
        if(nasc.length < 10) return showLuxuryModal("Data Inválida", "Use o formato DD/MM/AAAA", "warning");

        if(selectedRole === 'professional') {
            const config = CONFIG_PRO[selectedProfession];
            showStep('step-3', 'Validação Profissional', config.msg);
        } else {
            submitRegistration();
        }
    };
    document.getElementById('back-to-1').onclick = (e) => { e.preventDefault(); showStep('step-1', 'Criar Acesso', 'Defina e-mail e senha'); };

    // 5. TÉCNICO
    document.getElementById('btn-next-3').onclick = () => {
        const reg = document.getElementById('pro-register').value;
        const uf = document.getElementById('pro-uf').value;
        if(!reg || !uf) return showLuxuryModal("Faltam Dados", "Informe registro e UF.", "warning");
        showStep('step-4', 'Perfil Público', 'Como você será visto?');
    };
    document.getElementById('back-to-2').onclick = (e) => { e.preventDefault(); showStep('step-2', 'Dados Pessoais', 'Identificação básica'); };

    // 6. PERFIL
    document.getElementById('btn-finish-pro').onclick = (e) => {
        e.preventDefault();
        const disp = document.getElementById('display-name').value;
        const user = document.getElementById('username-handle').value;
        const term = document.getElementById('terms-check').checked;
        
        if(!disp || !user) return showLuxuryModal("Perfil", "Defina nome e @usuario.", "warning");
        if(!term) return showLuxuryModal("Termos", "Aceite os termos.", "warning");
        
        submitRegistration();
    };
    document.getElementById('back-to-3').onclick = (e) => { e.preventDefault(); showStep('step-3', 'Validação Profissional', 'Informe seus dados'); };


    // --- LÓGICA DE LOGIN SOCIAL (NOVO) ---
    const handleSocialRegister = async (providerName) => {
        try {
            let provider;
            if (providerName === 'google') {
                provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
            } else if (providerName === 'facebook') {
                provider = new FacebookAuthProvider();
            }

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Verifica se o usuário já existe no Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                const baseData = {
                    uid: user.uid,
                    realname: user.displayName || "Usuário",
                    email: user.email,
                    photo: user.photoURL,
                    role: selectedRole || 'user', 
                    createdAt: new Date(),
                    authProvider: providerName,
                    username: user.email.split('@')[0] + Math.floor(Math.random()*999)
                };

                if (selectedRole === 'professional') {
                    baseData.professionType = selectedProfession || 'indefinido';
                    baseData.isVerified = false;
                }

                await setDoc(userDocRef, baseData);
                showLuxuryModal("Conta Criada!", `Bem-vindo(a), ${user.displayName || ''}!`, "success");
            } else {
                showLuxuryModal("Bem-vindo de volta!", "Você já possui conta.", "success");
            }

            setTimeout(() => window.location.href = '../index.html', 1500);

        } catch (error) {
            console.error("Social Auth Error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                let msg = "Erro ao conectar.";
                if (error.code === 'auth/popup-blocked') msg = "Popup bloqueado pelo navegador.";
                if (error.code === 'auth/unauthorized-domain') msg = "Domínio não autorizado (verifique o Console do Firebase).";
                showLuxuryModal("Ops!", msg, "error");
            }
        }
    };

    // Listeners dos Botões Sociais
    const btnGoogle = document.getElementById('btn-google-reg');
    const btnFacebook = document.getElementById('btn-facebook-reg');
    
    if (btnGoogle) {
        btnGoogle.onclick = (e) => {
            e.preventDefault(); 
            handleSocialRegister('google');
        };
    }
    if (btnFacebook) {
        btnFacebook.onclick = (e) => {
            e.preventDefault();
            handleSocialRegister('facebook');
        };
    }


    // --- SUBMIT (TRADICIONAL COM BLINDAGEM ASSEMBLY) ---
    async function submitRegistration() {
        const btn = selectedRole === 'professional' ? document.getElementById('btn-finish-pro') : document.getElementById('btn-next-2');
        const oldTxt = btn.innerText;
        btn.innerText = "Blindando..."; btn.disabled = true;

        try {
            const email = document.getElementById('email').value;
            let pass = document.getElementById('reg-password').value;
            const name = document.getElementById('fullname').value;

            // 3. APLICAÇÃO DO PASSWORD PEPPER (HASHING)
            // Transforma a senha "123456" em Hash antes de criar a conta
            if (asmCrypto.isReady) {
                console.log("🔒 Assembly: Blindando credenciais de registro...");
                pass = asmCrypto.hashPassword(pass);
            } else {
                console.warn("⚠️ Atenção: Assembly não carregado. Senha pode ficar vulnerável.");
            }

            // Envia a senha HASHED para o Firebase (Auth)
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(cred.user, { displayName: name });

            const userData = {
                uid: cred.user.uid,
                realname: name,
                email: email,
                birthDate: document.getElementById('birthdate').value,
                phone: document.getElementById('phone').value,
                role: selectedRole,
                createdAt: new Date(),
                photo: "https://ui-avatars.com/api/?name="+encodeURIComponent(name)+"&background=random&color=fff"
            };

            if (selectedRole === 'professional') {
                userData.professionType = selectedProfession;
                userData.registerNumber = document.getElementById('pro-register').value;
                userData.registerUF = document.getElementById('pro-uf').value;
                userData.displayName = document.getElementById('display-name').value;
                userData.username = document.getElementById('username-handle').value;
                userData.isVerified = false;
            } else {
                userData.username = email.split('@')[0] + Math.floor(Math.random()*9999);
            }

            await setDoc(doc(db, "users", cred.user.uid), userData);
            showLuxuryModal("Bem-vindo(a)!", "Conta segura criada com sucesso.", "success");
            setTimeout(() => window.location.href = '../login/index.html', 2000);

        } catch (error) {
            console.error(error);
            let msg = error.message;
            if(error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
            showLuxuryModal("Erro", msg, "error");
            btn.innerText = oldTxt; btn.disabled = false;
        }
    }

    // --- UTILITÁRIOS ---
    document.querySelectorAll('.toggle-password').forEach(i => {
        i.onclick = function() {
            const el = document.getElementById(this.dataset.target);
            el.type = el.type === 'password' ? 'text' : 'password';
            this.classList.toggle('fa-eye'); this.classList.toggle('fa-eye-slash');
        }
    });

    const modal = document.getElementById('luxury-modal');
    window.showLuxuryModal = (t, m, type) => {
        document.getElementById('lux-title').innerText = t;
        document.getElementById('lux-msg').innerText = m;
        const icon = document.getElementById('lux-icon');
        const box = document.getElementById('lux-icon-container');
        box.className = 'luxury-icon-pulse ' + type;
        icon.className = type==='error'?'fa-solid fa-xmark':(type==='warning'?'fa-solid fa-triangle-exclamation':'fa-solid fa-check');
        modal.style.display = 'flex'; setTimeout(()=>modal.classList.add('active'),10);
    };
    document.getElementById('btn-lux-close').onclick = () => {
        modal.classList.remove('active'); setTimeout(()=>modal.style.display='none',300);
    };
});