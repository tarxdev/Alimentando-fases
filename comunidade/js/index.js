import '../../global/developer-console.js';
import { UIController } from './controllers/ui.controller.js';
import { FeedController } from './controllers/feed.controller.js';
import { PostController } from './controllers/post.controller.js';
import { PostDetailController } from './controllers/post-detail.controller.js';
import { EditorController } from './controllers/editor.controller.js';
import { UsdaController } from './controllers/usda.controller.js';
import { Calculators } from './utils/calculators.js';
import { InteractionService } from './services/interaction.service.js';
import { IdentityService } from './services/identity.service.js';
import { auth, db, doc, updateDoc } from './config/firebase.proxy.js'; 

// =================================================================
// 🗑️ SISTEMA DE MODAL LUXURY (Global)
// =================================================================
let postToDeleteId = null;

// Abre o modal com animação
window.openDeleteModal = (postId) => {
    postToDeleteId = postId;
    const modal = document.getElementById('modal-delete-luxury');
    const card = modal.querySelector('.luxury-modal-card');
    
    modal.style.display = 'flex';
    // Delay para permitir reflow e transição CSS
    setTimeout(() => {
        modal.classList.add('active');
        card.classList.add('active');
    }, 10);
};

// Fecha o modal com animação reversa
window.closeDeleteModal = () => {
    const modal = document.getElementById('modal-delete-luxury');
    const card = modal.querySelector('.luxury-modal-card');
    
    modal.classList.remove('active');
    card.classList.remove('active');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Sincronizado com CSS transition
};

// Compatibilidade Legacy (se existir algum código chamando confirmDelete antigo)
window.confirmDelete = window.openDeleteModal;

document.addEventListener('DOMContentLoaded', () => {
    
    // Listener do Botão de Confirmação (Luxury)
    const btnConfirm = document.getElementById('confirmDeleteLuxuryBtn');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', async function() {
            if (!postToDeleteId) return;
            
            // Estado de Loading no Botão
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...';
            this.disabled = true;

            try {
                // Tenta encontrar a função de exclusão nos controladores ou escopo global
                // NOTA: Como deletePost pode não estar global, disparamos um evento customizado
                // que o FeedController ou PostController deve ouvir.
                if (typeof window.deletePost === 'function') {
                    await window.deletePost(postToDeleteId);
                } else {
                    // Fallback: Dispara evento para quem estiver ouvindo
                    console.log("[Modal] Disparando evento 'request-delete-post' para ID:", postToDeleteId);
                    document.dispatchEvent(new CustomEvent('request-delete-post', { detail: { postId: postToDeleteId } }));
                    
                    // Pequeno delay artificial se for evento, para UX
                    await new Promise(r => setTimeout(r, 500)); 
                }
                
                window.closeDeleteModal();
            } catch (error) {
                console.error("Erro ao excluir:", error);
                alert("Não foi possível excluir. Tente novamente.");
            } finally {
                // Restaura botão
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 300);
            }
        });
    }

    // Fechar ao clicar fora
    const modalLuxury = document.getElementById('modal-delete-luxury');
    if (modalLuxury) {
        modalLuxury.addEventListener('click', (e) => {
            if (e.target === modalLuxury) window.closeDeleteModal();
        });
    }

    try {
        console.log("[System] Booting Application Core (V9 Stable)...");

        // 1. Inicialização dos Controladores
        const ui = new UIController(); ui.init();
        const editor = new EditorController(); editor.init();
        const postCtrl = new PostController(editor); postCtrl.init();
        const postDetail = new PostDetailController(); postDetail.init();
        const feed = new FeedController(); feed.init();
        const usda = new UsdaController(); usda.init();
        
        if (Calculators && typeof Calculators.init === 'function') { Calculators.init(); }

        // Event Bus
        document.addEventListener('post-created', () => { if (feed) feed.loadFeed(); });
        
        // Ouve o evento do modal para atualizar feed após exclusão (se necessário)
        document.addEventListener('post-deleted', () => { if (feed) feed.loadFeed(); });

        // =================================================================
        // 🛠️ KIT DE FERRAMENTAS DE EMERGÊNCIA (CONSOLE)
        // =================================================================

        window.recoverProfile = async (photoUrl) => {
            const user = auth.currentUser;
            if (!user) return alert("Erro: Aguarde o login ou recarregue a página.");
            if (!photoUrl) return alert("Erro: Você precisa fornecer o link da foto entre aspas.\nEx: window.recoverProfile('https://site.com/foto.jpg')");

            console.log(`[Recovery] Iniciando recuperação total para: ${user.displayName}...`);
            
            try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { 
                    photo: photoUrl,
                    avatar: photoUrl,
                    updatedAt: new Date()
                });
                console.log("✅ Passo 1/2: Perfil atual salvo no banco.");

                const service = new IdentityService();
                const count = await service.propagateImage(user.uid, photoUrl);
                console.log(`✅ Passo 2/2: Histórico propagado para ${count} itens.`);

                alert(`Sucesso Absoluto!\n\n1. Perfil Salvo.\n2. ${count} comentários/posts atualizados.\n\nA página irá recarregar para aplicar.`);
                window.location.reload();

            } catch (error) {
                console.error("Falha na recuperação:", error);
                alert("Erro ao salvar. Verifique o console.");
            }
        };

        window.fixPostCount = async (postId) => {
            if (!postId) return console.warn("ID do post obrigatório.");
            const service = new InteractionService();
            try {
                const newTotal = await service.syncPostCommentCount(postId);
                console.log(`[Fix] Novo total: ${newTotal}`);
                alert(`Post corrigido! Total real: ${newTotal}`);
            } catch (e) { console.error(e); }
        };

        console.log("[System] Ferramentas de Admin carregadas.");

    } catch (error) {
        console.error("[CRITICAL] Falha no boot:", error);
    }
});