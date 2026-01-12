import { PostService } from '../services/post.service.js';
import { auth, onAuthStateChanged } from '../config/firebase.proxy.js';

export class PostController {
    // CORREÇÃO: Apenas um construtor com argumento opcional
    constructor(editor = null) {
        this.postService = new PostService();
        this.currentUser = null;
        this.editor = editor; // Salva a referência do editor se for passada
        
        // Elementos do DOM
        this.modal = document.getElementById('modal-new-post');
        this.btnOpen = document.getElementById('btn-open-modal-post');
        this.btnClose = document.getElementById('btn-close-modal');
        this.input = document.getElementById('modal-post-input');
        this.btnSubmit = document.getElementById('btn-submit-post');
        
        // Upload
        this.fileInput = document.getElementById('modal-file-upload');
        this.previewArea = document.getElementById('modal-image-preview-area');
        this.selectedImages = [];
    }

    init() {
        onAuthStateChanged(auth, user => {
            this.currentUser = user;
        });

        if (this.btnOpen) {
            this.btnOpen.addEventListener('click', () => {
                if (!this.currentUser) return alert('Faça login para postar');
                this.modal.classList.add('open');
            });
        }

        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.resetAndClose());
        }

        if (this.input) {
            this.input.addEventListener('input', () => this.checkInput());
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (this.btnSubmit) {
            this.btnSubmit.addEventListener('click', () => this.submitPost());
        }
    }

    checkInput() {
        const hasText = this.input.value.trim().length > 0;
        const hasImage = this.selectedImages.length > 0;
        if(this.btnSubmit) this.btnSubmit.disabled = !(hasText || hasImage);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Se o editor foi injetado (via index.js), usa ele
        if (this.editor) {
            this.editor.open(file, (base64) => {
                this.selectedImages.push(base64);
                this.renderPreview();
                this.checkInput();
                e.target.value = ''; // Limpa para permitir selecionar de novo
            });
        } else {
            // Fallback direto se não houver editor
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                this.selectedImages.push(base64);
                this.renderPreview();
                this.checkInput();
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
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

        // Listener para remover imagem (Delegado ao documento para simplificar HTML inline)
        // Nota: Em produção, idealmente adicionamos listeners diretos, mas isso funciona com o HTML acima
        if (!this._hasRemoveListener) {
            document.addEventListener('remove-img', (e) => {
                this.selectedImages.splice(e.detail, 1);
                this.renderPreview();
                if(this.selectedImages.length === 0) this.previewArea.classList.add('hidden');
                this.checkInput();
            });
            this._hasRemoveListener = true;
        }
    }

    async submitPost() {
        const text = this.input.value.trim();
        if (!text && this.selectedImages.length === 0) return;

        this.btnSubmit.innerText = "Publicando...";
        this.btnSubmit.disabled = true;

        try {
            await this.postService.createPost(this.currentUser, text, this.selectedImages);
            
            // Event Bus: Notifica Feed para recarregar
            document.dispatchEvent(new Event('post-created'));
            
            if(window.Swal) Swal.fire({ icon: 'success', title: 'Post publicado!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            this.resetAndClose();

        } catch (error) {
            console.error(error);
            alert("Erro ao publicar.");
        } finally {
            if(this.btnSubmit) {
                this.btnSubmit.innerText = "Publicar";
                this.btnSubmit.disabled = false;
            }
        }
    }

    resetAndClose() {
        this.modal.classList.remove('open');
        this.input.value = '';
        this.selectedImages = [];
        if(this.previewArea) {
            this.previewArea.innerHTML = '';
            this.previewArea.classList.add('hidden');
        }
        if(this.fileInput) this.fileInput.value = '';
    }
}