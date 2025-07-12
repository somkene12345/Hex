import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, Alert } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";
import { saveChatToHistory, loadChatHistory } from "../utils/chatStorage";
import { pushChatToRTDB, getChatByUUID } from "../utils/firebaseService";
import { auth } from "../services/firebase";
import pako from "pako";
import { decode as base64Decode } from "base-64";

const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [chatTitle, setChatTitle] = useState<string>("");

  const queryParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  const queryChatId = queryParams?.get("chatId");
  const uuidParam = queryParams?.get("uuid");
  const data = queryParams?.get("data");

  const chatId = route?.params?.chatId || queryChatId || "default";

  // 📥 Handle shared chat (UUID or compressed)
  useEffect(() => {
    const handleImport = async () => {
      if (uuidParam) {
        try {
          const remoteChat = await getChatByUUID(uuidParam);
          if (remoteChat?.messages) {
            await saveChatToHistory(chatId, remoteChat.messages);
            console.log("✅ Imported chat from UUID");
          }
        } catch (e) {
          console.error("❌ Failed to import chat via UUID:", e);
        }
      } else if (data) {
        try {
          const binaryStr = base64Decode(data);
          const byteArray = new Uint8Array(binaryStr.split("").map((c) => c.charCodeAt(0)));
          const decompressed = JSON.parse(pako.inflate(byteArray, { to: "string" }));

          if (decompressed?.messages) {
            await saveChatToHistory(chatId, decompressed.messages);
            console.log("✅ Imported chat from compressed link");
          }
        } catch (err) {
          console.error("❌ Failed to parse compressed chat data:", err);
        }
      }
    };

    handleImport();
  }, [uuidParam, data, chatId]);

  // 🔁 When messages change, save to local + RTDB
  const onChatUpdate = useCallback(
    async (messages: any[], title: string) => {
      setLocalMessages(messages);
      setChatTitle(title);

      try {
        await saveChatToHistory(chatId, messages);

        if (auth.currentUser) {
          await pushChatToRTDB(chatId, {
            messages,
            title,
            timestamp: Date.now(),
          });
          console.log("☁️ Synced chat to Firebase:", chatId);
        }
      } catch (err) {
        console.error("❌ Failed to save chat:", err);
        Alert.alert("Error", "Could not save your chat.");
      }
    },
    [chatId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} key={chatId} onUpdate={onChatUpdate} />
    </SafeAreaView>
  );
};

export default Index;
