// Importa as instâncias JÁ INICIALIZADAS da raiz
import { db, auth } from '../../../firebase-config.js';

// Importa TODAS as funções Modulares (V9) necessárias
import { 
    collection, collectionGroup, 
    doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, startAt, endAt, onSnapshot, // <--- ADICIONADO startAt, endAt
    arrayUnion, arrayRemove, increment, serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Exportação consolidada da API de Persistência (Facade)
export { 
    db, auth, 
    collection, collectionGroup,
    doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, startAt, endAt, onSnapshot, // <--- ADICIONADO startAt, endAt
    arrayUnion, arrayRemove, increment, serverTimestamp,
    writeBatch,
    onAuthStateChanged, signOut 
};