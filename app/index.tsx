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
  const data = queryParams?.get('data');
  const chatId = route?.params?.chatId || queryChatId;

  useEffect(() => {
    const handleData = async () => {
      if (data && chatId) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(data));
          console.log('📄 Received data:', parsedData);

          // Load existing chat history
          const history = await loadChatHistory();

          // Check if the chat already exists in history
          if (!history[chatId]) {
            // Add the data (messages and metadata) to the chat history
            const newChat = {
              messages: parsedData.messages || [],
              title: parsedData.title || "Untitled Chat",
              timestamp: parsedData.timestamp || Date.now(),
            };

            await saveChatToHistory(chatId, newChat.messages);
            console.log(`✅ Data added to chat history for chatId: ${chatId}`);
          }
        } catch (err) {
          console.error('❌ Failed to parse or save data:', err);
        }
      }
    };

    handleData();
  }, [data, chatId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
