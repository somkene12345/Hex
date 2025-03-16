import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { fetchGroqResponse } from "../services/groqService";
import { Ionicons } from "@expo/vector-icons"; // For icons
import Markdown from "react-native-markdown-display";


// Function to create a clickable link
const renderLink = (url: string, text: string) => {
    return <Text style={{ color: "blue", textDecorationLine: "underline" }} onPress={() => Linking.openURL(url)}>{text}</Text>;
  };
  
  const renderTable = (tableString: string) => {
    const rows = tableString.trim().split("\n").map(row => row.split("|"));
    return (
      <View style={{ borderWidth: 1, borderColor: "#ccc", marginVertical: 5 }}>
        {rows.map((row, i) => (
            <View key={`row-${i}`} style={{ flexDirection: "row" }}>
  {row.map((cell, j) => (
    <Text key={`cell-${i}-${j}`} style={{ borderWidth: 1, padding: 5, flex: 1 }}>
      {cell.trim()}
    </Text>
  ))}
</View>

        ))}
      </View>
    );
  };



// Function to format AI output into readable Markdown
const formatText = (text: string): JSX.Element => {
    const parts: (string | JSX.Element)[] = [];
    
    // Handle markdown-style links
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_, text, url) => {
      parts.push(renderLink(url, text));
      return ""; // Remove link from the string
    });
  
    // Handle markdown-style tables
    text = text.replace(/\|(.+?)\|/gs, (_, table) => {
      parts.push(renderTable(table));
      return ""; // Remove table from the string
    });
  
    // Process remaining text formatting
    text = text
      .replace(/,0/g, ".") // End of sentence
      .replace(/,-/g, "\n") // Line break
      .replace(/,--/g, "\n\n") // Double line break
      .replace(/,\*/g, "- ") // List item
      .replace(/,1\./g, "1. ") // Numbered list item
      .replace(/,b(.*?)\b/g, "**$1**") // Bold
      .replace(/,i(.*?)\i/g, "*$1*") // Italic
      .replace(/,u(.*?)\u/g, "__$1__") // Underline
      .replace(/,bi(.*?)\bi/g, "***$1***") // Bold + Italic
      .replace(/,code(.*?)\code/g, "```\n$1\n```") // Code block
      .replace(/,quote(.*?)\quote/g, "> $1") // Quote
      .replace(/,h1(.*?)\h1/g, "# $1") // Header 1
      .replace(/,h2(.*?)\h2/g, "## $1") // Header 2
      .replace(/,h3(.*?)\h3/g, "### $1") // Header 3
      .replace(/,h4(.*?)\h4/g, "#### $1") // Header 4
      .replace(/,h5(.*?)\h5/g, "##### $1") // Header 5
      .replace(/,h6(.*?)\h6/g, "###### $1") // Header 6
      .replace(/,--/g, "---\n"); // Horizontal rule
  
        // Preserve the remaining text if nothing else matched
  if (text.trim()) {
    parts.push(<Text key={`text-${parts.length}`}>{text}</Text>);
}
      return (
        <View>
          {parts}
        </View>
      );
      
  };
  
  
  


const Chat = () => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const botResponse = await fetchGroqResponse(input);
    const formattedResponse = formatText(botResponse); // Format AI output

    const botMessage = { role: "bot", formattedText: formattedResponse, text: botResponse };
    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.role === "user" ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Markdown style={markdownStyles}>{item.text}</Markdown>
          </View>
        )}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#F5F5F5" },
  messageContainer: {
    paddingHorizontal: 10,
    paddingVertical:2,
    borderRadius: 8,
    margin: 5,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderColor: "#A3D9A5",
    borderWidth: 1,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#EAEAEA",
    borderColor: "#B0B0B0",
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 , borderRadius:50},
  sendButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 20,
    marginLeft: 5,
  },
});

// Markdown styles for better formatting
const markdownStyles = StyleSheet.create({
    heading1: { fontSize: 24, fontWeight: "bold", color: "#333" },
    heading2: { fontSize: 20, fontWeight: "bold", color: "#555" },
    heading3: { fontSize: 18, fontWeight: "bold", color: "#777" },
    paragraph: { fontSize: 16, color: "#444", lineHeight: 24 },
    strong: { fontWeight: "bold", color: "#000" },
    em: { fontStyle: "italic", color: "#666" },
    underline: { textDecorationLine: "underline" },
    blockquote: {
      fontSize: 16,
      color: "#777",
      fontStyle: "italic",
      borderLeftWidth: 4,
      borderLeftColor: "#CCC",
      paddingLeft: 10,
      marginVertical: 5,
    },
    code_inline: {
      backgroundColor: "#EEE",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontFamily: "monospace",
      fontSize: 14,
      lineHeight: 20, // Prevents overlap
    },
    code_block: {
      backgroundColor: "#EEE",
      padding: 10,
      borderRadius: 5,
      fontFamily: "monospace",
      fontSize: 14,
      lineHeight: 22, // Ensures proper spacing
      marginVertical: 5, // Adds spacing above/below
    },
    link: { color: "#007AFF" },
    image: { width: 200, height: 100 },
    table: {
      borderWidth: 1,
      borderColor: "#DDD",
      padding: 5,
      marginVertical: 5,
    },
  });
  

export default Chat;
