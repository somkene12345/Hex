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
  Pressable,
  Clipboard,
  Alert,
  Image, // Add this import
} from "react-native";
import { fetchGroqResponse } from "../services/groqService";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";

const Chat = () => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Copied!", "Code copied to clipboard");
  };

  const renderCodeBlock = ({ node, ...props }: any) => {
    const code = node.children[0].children[0].value;
    return (
      <View style={markdownStyles.code_blockContainer}>
        <Pressable
          onPress={() => copyToClipboard(code)}
          style={styles.copyButton}
        >
          <Ionicons name="copy-outline" size={16} color="#666" />
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>
        <View style={markdownStyles.code_block}>
          <Text style={markdownStyles.code_blockText}>{code}</Text>
        </View>
      </View>
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const botResponse = await fetchGroqResponse(input);
    const botMessage = { role: "bot", text: botResponse };
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
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View style={[
            styles.messageWrapper,
            item.role === "user" ? styles.userWrapper : styles.botWrapper
          ]}>
            {item.role === "bot" && (
              <View style={styles.botAvatar}>
                <Image
                  source={{ uri: 'https://github.com/somkene12345/Hex/blob/main/assets/images/icon.png?raw=true' }}
                  style={styles.botAvatarImage}
                />
              </View>
            )}
            <View style={[
              styles.messageContent,
              item.role === "user" ? styles.userContent : styles.botContent
            ]}>
              <Markdown 
                style={markdownStyles}
                rules={{
                  code_block: renderCodeBlock
                }}
              >
                {item.text}
              </Markdown>
            </View>
            {item.role === "user" && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={20} color="white" />
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    width: "100%",
  },
  botWrapper: {
    justifyContent: "flex-start",
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  messageContent: {
    maxWidth: "80%",
    paddingVertical: 3,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  botContent: {
    backgroundColor: "transparent",
    marginLeft: 8,
  },
  userContent: {
    backgroundColor: "#EAEAEA",
    marginRight: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    overflow: 'hidden', // Ensures the image stays within the circular bounds
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#EEE',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: -1,
  },
  copyText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: "#333",
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 6,
  },
  paragraph: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginVertical: 4,
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  code_inline: {
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
