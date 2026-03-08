import { db } from '../firebase-config.js';
import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

function normalizeActorName(actorName) {
    const name = String(actorName || '').trim();
    return name || 'Alguem';
}

function normalizeActorPhoto(actorPhoto, actorName) {
    const src = String(actorPhoto || '').trim();
    if (src) return src;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizeActorName(actorName))}`;
}

async function createNotification(payload) {
    const recipientId = String(payload?.recipientId || '').trim();
    const actorId = String(payload?.actorId || '').trim();

    if (!recipientId || !actorId || recipientId === actorId) return;

    const data = {
        type: String(payload.type || 'generic'),
        recipientId,
        actorId,
        actorName: normalizeActorName(payload.actorName),
        actorPhoto: normalizeActorPhoto(payload.actorPhoto, payload.actorName),
        postId: payload.postId || null,
        read: false,
        timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), data);
}

export async function notifyFollow({ recipientId, actorId, actorName, actorPhoto }) {
    await createNotification({
        type: 'follow',
        recipientId,
        actorId,
        actorName,
        actorPhoto
    });
}

export async function notifyPostLike({ recipientId, actorId, actorName, actorPhoto, postId }) {
    await createNotification({
        type: 'like',
        recipientId,
        actorId,
        actorName,
        actorPhoto,
        postId
    });
}

export async function notifyPostComment({ recipientId, actorId, actorName, actorPhoto, postId }) {
    await createNotification({
        type: 'comment',
        recipientId,
        actorId,
        actorName,
        actorPhoto,
        postId
    });
}
