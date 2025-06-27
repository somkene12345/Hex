import React from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";

const Index = () => {
  const { darkMode } = useTheme(); // ✅ now inside functional component

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat />
    </SafeAreaView>
  );
};

export default Index;
