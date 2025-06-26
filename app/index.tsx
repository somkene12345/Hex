import React from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat"; // Adjust path if needed
import { useTheme } from '../theme/ThemeContext'; // adjust path

const { darkMode } = useTheme();


const Index = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Chat />
    </SafeAreaView>
  );
};
export default Index;
