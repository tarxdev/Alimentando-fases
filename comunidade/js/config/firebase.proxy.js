// Importa as instâncias JÁ INICIALIZADAS da raiz
import { db, auth } from '../../../firebase-config.js';

// Importa TODAS as funções Modulares (V9) necessárias
import { 
    collection, collectionGroup, 
    doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, // <--- ADICIONADO setDoc
    query, where, orderBy, limit, onSnapshot, 
    arrayUnion, arrayRemove, increment, serverTimestamp,
    writeBatch // <--- ADICIONADO writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Exporta tudo corrigido
export { 
    db, auth, 
    collection, collectionGroup,
    doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, onSnapshot, 
    arrayUnion, arrayRemove, increment, serverTimestamp,
    writeBatch,
    onAuthStateChanged, signOut 
};