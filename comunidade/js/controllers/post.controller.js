import { PostService } from '../services/post.service.js';
import { auth, onAuthStateChanged } from '../config/firebase.proxy.js';

export class PostController {
    constructor(editor = null) {
        this.postService = new PostService();
        this.currentUser = null;
        this.editor = editor; 
        
        // Seletores atualizados para o novo layout Luxury V2
        this.modal = document.getElementById('modal-create-luxury');
        this.card = this.modal ? this.modal.querySelector('.luxury-modal-card') : null;
        
        this.btnOpen = document.getElementById('btn-open-modal-post'); 
        this.btnClose = document.getElementById('btn-close-create-luxury');
        
        this.input = document.getElementById('luxury-post-input');
        this.btnSubmit = document.getElementById('btn-submit-luxury');
        this.fileInput = document.getElementById('luxury-file-upload');
        this.previewArea = document.getElementById('luxury-preview-area');
        
        this.selectedImages = [];
        // Flag para evitar duplicação de listeners
        this._listenerAttached = false;
    }

    init() {
        onAuthStateChanged(auth, user => {
            this.currentUser = user;
        });

        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', (e) => {
                if(e) e.preventDefault();
                if (!this.currentUser) return alert('Faça login para postar');
                this.openModal();
            });
        }

        if (this.btnClose) this.btnClose.addEventListener('click', () => this.closeModal());
        
        // Fechar clicando fora (no overlay)
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }

        if (this.input) this.input.addEventListener('input', () => this.checkInput());
        if (this.fileInput) this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (this.btnSubmit) this.btnSubmit.addEventListener('click', () => this.submitPost());
    }

    openModal() {
        if(!this.modal) return;
        this.modal.style.display = 'flex';
        // Delay mínimo para permitir o render antes da animação CSS
        setTimeout(() => {
            this.modal.classList.add('active'); // Anima opacidade do fundo
            if(this.input) this.input.focus();
        }, 10);
    }

    closeModal() {
        if(!this.modal) return;
        this.modal.classList.remove('active'); // Remove opacidade e escala
        
        // Espera a transição CSS (0.4s) antes de dar display:none
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.resetForm();
        }, 400);
    }

    resetForm() {
        if(this.input) this.input.value = '';
        this.selectedImages = [];
        if(this.previewArea) {
            this.previewArea.innerHTML = '';
            this.previewArea.classList.add('hidden');
        }
        if(this.fileInput) this.fileInput.value = '';
        this.checkInput();
    }

    checkInput() {
        if(!this.btnSubmit) return;
        const hasText = this.input && this.input.value.trim().length > 0;
        const hasImage = this.selectedImages.length > 0;
        this.btnSubmit.disabled = !(hasText || hasImage);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (this.editor) {
            this.editor.open(file, (base64) => {
                this.addWithPreview(base64);
                e.target.value = ''; 
            });
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.addWithPreview(event.target.result);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    }

    addWithPreview(base64) {
        this.selectedImages.push(base64);
        this.renderPreview();
        this.checkInput();
    }

    renderPreview() {
        if(!this.previewArea) return;
        this.previewArea.classList.remove('hidden');
        
        this.previewArea.innerHTML = this.selectedImages.map((img, idx) => `
            <div class="preview-item-wrapper">
                <img src="${img}">
                <button class="btn-remove-preview" onclick="document.dispatchEvent(new CustomEvent('remove-img', {detail: ${idx}}))">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');

        // Listener de remoção (Event Delegation Simplificado)
        if(!this._listenerAttached) {
            document.addEventListener('remove-img', (e) => {
                this.selectedImages.splice(e.detail, 1);
                this.renderPreview();
                if(this.selectedImages.length === 0) this.previewArea.classList.add('hidden');
                this.checkInput();
            });
            this._listenerAttached = true;
        }
    }

    async submitPost() {
        const text = this.input.value.trim();
        if (!text && this.selectedImages.length === 0) return;

        const originalText = this.btnSubmit.innerHTML;
        this.btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Publicando...';
        this.btnSubmit.disabled = true;

        try {
            await this.postService.createPost(this.currentUser, text, this.selectedImages);
            document.dispatchEvent(new Event('post-created'));
            
            // Efeito de sucesso visual no próprio botão
            this.btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Sucesso!';
            this.btnSubmit.style.background = '#4cd137';
            
            setTimeout(() => {
                this.closeModal();
                // Restaura estilo original após fechar
                setTimeout(() => {
                    this.btnSubmit.innerHTML = originalText;
                    this.btnSubmit.style.background = ''; // Volta ao gradiente CSS
                    this.btnSubmit.disabled = false;
                }, 500);
            }, 800);

        } catch (error) {
            console.error(error);
            this.btnSubmit.innerHTML = 'Erro :(';
            setTimeout(() => {
                this.btnSubmit.innerHTML = originalText;
                this.btnSubmit.disabled = false;
            }, 2000);
        }
    }
}