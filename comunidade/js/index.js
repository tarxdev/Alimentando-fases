import { UIController } from './controllers/ui.controller.js';
import { FeedController } from './controllers/feed.controller.js';
import { PostController } from './controllers/post.controller.js';
import { PostDetailController } from './controllers/post-detail.controller.js';
import { EditorController } from './controllers/editor.controller.js';
import { UsdaController } from './controllers/usda.controller.js';
import { Calculators } from './utils/calculators.js';
import { InteractionService } from './services/interaction.service.js';
import { IdentityService } from './services/identity.service.js';
import { auth, db, doc, updateDoc } from './config/firebase.proxy.js'; // Importações críticas adicionadas

document.addEventListener('DOMContentLoaded', () => {
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

        // =================================================================
        // 🛠️ KIT DE FERRAMENTAS DE EMERGÊNCIA (CONSOLE)
        // =================================================================

        /**
         * FERRAMENTA 1: Reparar Perfil Completo
         * Uso: window.recoverProfile('URL_DA_SUA_FOTO')
         * Ação: Salva a foto no banco E atualiza todos os comentários antigos.
         */
        window.recoverProfile = async (photoUrl) => {
            const user = auth.currentUser;
            if (!user) return alert("Erro: Aguarde o login ou recarregue a página.");
            if (!photoUrl) return alert("Erro: Você precisa fornecer o link da foto entre aspas.\nEx: window.recoverProfile('https://site.com/foto.jpg')");

            console.log(`[Recovery] Iniciando recuperação total para: ${user.displayName}...`);
            
            try {
                // Passo 1: Consertar o "Agora" (Perfil do Usuário)
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { 
                    photo: photoUrl,
                    avatar: photoUrl, // Redundância para garantir compatibilidade
                    updatedAt: new Date()
                });
                console.log("✅ Passo 1/2: Perfil atual salvo no banco.");

                // Passo 2: Consertar o "Passado" (Histórico de Comentários)
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

        /**
         * FERRAMENTA 2: Consertar Contadores de Comentários
         * Uso: window.fixPostCount('ID_DO_POST')
         */
        window.fixPostCount = async (postId) => {
            if (!postId) return console.warn("ID do post obrigatório.");
            const service = new InteractionService();
            try {
                const newTotal = await service.syncPostCommentCount(postId);
                console.log(`[Fix] Novo total: ${newTotal}`);
                alert(`Post corrigido! Total real: ${newTotal}`);
            } catch (e) { console.error(e); }
        };

        console.log("[System] Ferramentas de Admin carregadas. Digite 'window.recoverProfile(url)' para corrigir sua foto.");

    } catch (error) {
        console.error("[CRITICAL] Falha no boot:", error);
    }
});