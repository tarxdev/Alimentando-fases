/**
 * FIREBASE CONFIGURATION (CDN MODE)
 * Contexto: Infraestrutura / Singleton
 * Configuração adaptada para execução direta no navegador (GitHub Pages/Localhost).
 */

// 1. Importação dos Módulos do SDK (Versão 10.7.1)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'; // Adicionado para fotos de perfil
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// 2. Credenciais estáticas para Runtime Client-Side
const firebaseConfig = {
  apiKey: "AIzaSyCUjS5ZmQBJdv5TVBKayG_YIxYgDBFIauo",
  authDomain: "alimentando-fases.firebaseapp.com",
  projectId: "alimentando-fases",
  storageBucket: "alimentando-fases.firebasestorage.app",
  messagingSenderId: "312896864162",
  appId: "1:312896864162:web:ee61bac2c67b19303dbcfb",
  measurementId: "G-9865RHDG8Z"
};

// 3. Inicialização Singleton
const app = initializeApp(firebaseConfig);

// 4. Exportação de Serviços (Instâncias Prontas)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Serviço de Arquivos exportado
export const analytics = getAnalytics(app);

// 5. Persistência Offline (Resiliência de Conexão)
enableIndexedDbPersistence(db).catch((err) => {
    // Silencia erros conhecidos de múltiplas abas abertas em dev
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.warn('Persistence Error:', err);
    }
});

console.info('Firebase Core Services Initialized (CDN Mode)');