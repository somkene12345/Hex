import { db, auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, set, get, child } from 'firebase/database';
import { loadChatHistory, saveChatToHistory } from './chatStorage';
import { v4 as uuidv4 } from 'uuid';

// 🔐 Get current user ID
export const getUserId = () => auth.currentUser?.uid || null;

/**
 * ☁️ Push chat to Realtime Database
 * Saves under:
 *   - users/{uid}/chats/{chatId}
 *   - chats/{uuid}
 */
export const pushChatToRTDB = async (
  chatId: string,
  chatData: { messages: any[]; title: string; timestamp: number; uuid?: string }
) => {
  const user = auth.currentUser;
  if (!user) return;

  const uuid = chatData.uuid || uuidv4();

  const chatPayload = {
    ...chatData,
    uuid,
  };

  // Save under user
  await set(ref(db, `users/${user.uid}/chats/${chatId}`), chatPayload);

  // Save by UUID for shareable links
  await set(ref(db, `chats/${uuid}`), {
    ...chatPayload,
    uid: user.uid,
  });

  return uuid;
};

// 🔎 Fetch chat using a public UUID
export const getChatByUUID = async (uuid: string) => {
  try {
    const snapshot = await get(ref(db, `chats/${uuid}`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (e) {
    console.error('❌ Error getting chat by UUID:', e);
    return null;
  }
};

/**
 * 🔄 Sync all Firebase chats on login
 * Merges local and remote chats, keeping the longer one.
 * Returns merged history object.
 */
export const syncOnLogin = async () => {
  const uid = getUserId();
  if (!uid) return {};

  try {
    const snapshot = await get(child(ref(db), `users/${uid}/chats`));
    const rtdbChats = snapshot.exists() ? snapshot.val() : {};
    const localChats = await loadChatHistory();

    const merged: Record<string, any> = { ...localChats };

    for (const id in rtdbChats) {
      const remote = rtdbChats[id];
      const local = localChats[id];

      const remoteLength = remote?.messages?.length || 0;
      const localLength = local?.messages?.length || 0;

      if (!local || remoteLength > localLength) {
        merged[id] = remote;
        await saveChatToHistory(id, remote.messages);
      }
    }

    return merged;
  } catch (err) {
    console.error('❌ Failed to sync from RTDB:', err);
    return {};
  }
};
