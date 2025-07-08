import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";

const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const queryParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const queryChatId = queryParams?.get('chatId');
  const metadata = queryParams?.get('metadata');
  const chatId = route?.params?.chatId || queryChatId;

  useEffect(() => {
    if (metadata) {
      try {
        const parsedMetadata = JSON.parse(decodeURIComponent(metadata));
        console.log('📄 Received metadata:', parsedMetadata);
        // Optionally, handle metadata (e.g., display a notification or preload chat details)
      } catch (err) {
        console.error('❌ Failed to parse metadata:', err);
      }
    }
  }, [metadata]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
