import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp } from '../config/firebase.proxy.js';
import { IdentityService } from '../services/identity.service.js';

export class UIController {
    constructor() {
        this.identityService = new IdentityService();
        
        this.avatarElements = {
            sidebar: document.getElementById('nav-avatar-img'),
            widget: document.getElementById('widget-user-avatar'),
            modalPost: document.getElementById('modal-user-avatar'),
            instComment: document.getElementById('inst-author-photo')
        };

        this.nameElements = {
            sidebar: document.querySelector('.p-name'),
            modalPost: document.querySelector('.cp-username')
        };
    }

    init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Roda a sincronização automática silenciosa
                await this.handleAutomaticSync(user);
            } else {
                this.setGuestState();
            }
        });

        // Removi o listener de clique na foto da sidebar. 
        // Agora o link <a href="..."> funciona nativamente.

        const btnCreatePost = document.getElementById('btn-open-modal-post');
        if (btnCreatePost) {
            btnCreatePost.addEventListener('click', (e) => {
                if (!auth.currentUser) {
                    e.preventDefault(); e.stopPropagation();
                    this.showLoginAlert();
                }
            });
        }
    }

    async handleAutomaticSync(firebaseUser) {
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(userRef);
            
            const dbData = docSnap.exists() ? docSnap.data() : {};
            const authPhoto = firebaseUser.photoURL; 
            const authName = firebaseUser.displayName;

            // Lógica: Usa a foto do banco se existir. Se não, usa a do Auth.
            // Ignora placeholders antigos ("ui-avatars") se tiver uma foto real disponível.
            const hasValidDbPhoto = dbData.photo && !dbData.photo.includes('ui-avatars.com');
            
            let finalPhoto = null;
            if (hasValidDbPhoto) {
                finalPhoto = dbData.photo;
            } else if (authPhoto) {
                finalPhoto = authPhoto;
            }

            const finalName = dbData.name || authName || "Usuário";
            
            // Atualiza a tela imediatamente
            const displayPhoto = finalPhoto || `https://ui-avatars.com/api/?name=${finalName}&background=random&color=fff`;
            this.updateUI(finalName, displayPhoto);

            // === AUTO-CORREÇÃO DO PASSADO ===
            // Se a foto na tela (displayPhoto) for diferente do que está nos seus posts antigos,
            // ou se o banco estava vazio, forçamos a atualização agora.
            
            if (finalPhoto && (!hasValidDbPhoto || dbData.photo !== finalPhoto)) {
                console.log("[Auto] Sincronizando foto no perfil e histórico...");
                
                // 1. Salva no Perfil
                await setDoc(userRef, {
                    uid: firebaseUser.uid,
                    name: finalName,
                    photo: finalPhoto,
                    email: firebaseUser.email,
                    lastSynced: serverTimestamp()
                }, { merge: true });

                // 2. Corrige os comentários antigos
                this.identityService.propagateImage(firebaseUser.uid, finalPhoto);
            }
            
            // Garante criação do documento se for user novo
            if (!docSnap.exists()) {
                await setDoc(userRef, {
                    uid: firebaseUser.uid,
                    name: finalName,
                    email: firebaseUser.email,
                    createdAt: serverTimestamp()
                }, { merge: true });
            }

        } catch (error) {
            console.error("Erro no Auto-Sync:", error);
        }
    }

    updateUI(name, photo) {
        Object.values(this.avatarElements).forEach(img => {
            if (img && photo) img.src = photo;
        });
        if (name) {
            if (this.nameElements.sidebar) this.nameElements.sidebar.innerText = "Meu Perfil";
            if (this.nameElements.modalPost) this.nameElements.modalPost.innerText = name;
        }
    }

    setGuestState() {
        const guestPhoto = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        Object.values(this.avatarElements).forEach(img => { if (img) img.src = guestPhoto; });
        if (this.nameElements.sidebar) {
            this.nameElements.sidebar.innerText = "Fazer Login";
            this.nameElements.sidebar.style.color = "#53954a";
            const link = document.querySelector('.profile-pill-link');
            if(link) { link.href = "../login/index.html"; } // Restaura link original
        }
    }

    showLoginAlert() {
        if(window.Swal) {
            Swal.fire({
                title: 'Modo Visitante', text: 'Faça login para participar.', icon: 'info',
                showCancelButton: true, confirmButtonColor: '#53954a', confirmButtonText: 'Login'
            }).then((res) => { if (res.isConfirmed) window.location.href = '../login/index.html'; });
        } else {
            alert("Faça login para continuar.");
        }
    }
}