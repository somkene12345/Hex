import { db, auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, set, get, child } from 'firebase/database';
import { loadChatHistory, saveChatToHistory } from './chatStorage';
import { v4 as uuidv4 } from 'uuid';


export const getUserId = () => auth.currentUser?.uid || null;

export const pushChatToRTDB = async (
  chatId: string,
  chatData: { messages: any[]; title: string; timestamp: number; uuid?: string }
) => {
  const user = auth.currentUser;
  if (!user) return;

  const uuid = chatData.uuid || uuidv4();
  await set(ref(db, `users/${user.uid}/chats/${chatId}`), {
    ...chatData,
    uuid,
  });

  // Also store by uuid for shareable links
  await set(ref(db, `chats/${uuid}`), {
    ...chatData,
    uid: user.uid,
  });

  return uuid;
};

export const getChatByUUID = async (uuid: string) => {
  try {
    const snapshot = await get(ref(db, `chats/${uuid}`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (e) {
    console.error("❌ Error getting chat by UUID:", e);
    return null;
  }
};

export const syncOnLogin = async () => {
  const uid = getUserId();
  if (!uid) return {};

  const snapshot = await get(child(ref(db), `users/${uid}/chats`));
  const rtdbChats = snapshot.exists() ? snapshot.val() : {};
  const localChats = await loadChatHistory();

  const merged: Record<string, any> = { ...localChats };

  for (const id in rtdbChats) {
    if (
      !localChats[id] ||
      (rtdbChats[id].messages?.length || 0) > (localChats[id]?.messages?.length || 0)
    ) {
      merged[id] = rtdbChats[id];
      await saveChatToHistory(id, rtdbChats[id].messages);
    }
  }

  return merged;
};
