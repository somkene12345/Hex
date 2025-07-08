import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";
import { saveChatToHistory, loadChatHistory } from "../utils/chatStorage";

const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const queryParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const queryChatId = queryParams?.get('chatId');
  const metadata = queryParams?.get('metadata');
  const chatId = route?.params?.chatId || queryChatId;

  useEffect(() => {
    const handleMetadata = async () => {
      if (metadata && chatId) {
        try {
          const parsedMetadata = JSON.parse(decodeURIComponent(metadata));
          console.log('📄 Received metadata:', parsedMetadata);

          // Load existing chat history
          const history = await loadChatHistory();

          // Check if the chat already exists in history
          if (!history[chatId]) {
            // Add the metadata to the chat history
            const newChat = {
              messages: [], // Initialize with an empty messages array
              title: parsedMetadata.title || "Untitled Chat",
              timestamp: parsedMetadata.timestamp || Date.now(),
            };

            await saveChatToHistory(chatId, newChat.messages);
            console.log(`✅ Metadata added to chat history for chatId: ${chatId}`);
          }
        } catch (err) {
          console.error('❌ Failed to parse or save metadata:', err);
        }
      }
    };

    handleMetadata();
  }, [metadata, chatId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
