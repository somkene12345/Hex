import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { fetchGroqResponse } from "../services/groqService";
import { Ionicons } from "@expo/vector-icons";
import Markdown, {  ASTNode } from 'react-native-markdown-display';
import MarkdownRules from "react-native-markdown-display"
import Clipboard from '@react-native-clipboard/clipboard';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/styles/hljs';
import { Video, ResizeMode } from 'expo-av';




const { width } = Dimensions.get('window');

type Message = {
  role: string;
  text: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shiftPressed, setShiftPressed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      hideScrollButton();
    }
  }, [messages]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    if (contentHeight - (offsetY + layoutHeight) > 300) {
      showScrollBtn();
    } else {
      hideScrollButton();
    }
  };

  const showScrollBtn = () => {
    setShowScrollButton(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideScrollButton = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowScrollButton(false);
    });
  };

  const renderCodeBlock = (node: ASTNode) => {
    const code = node.children[0]?.children[0]?.value || '';
    const language = node.attributes?.language || 'text';
    
    return (
      <View style={codeBlockStyles.container}>
        <View style={codeBlockStyles.header}>
          <Text style={codeBlockStyles.language}>{language}</Text>
          <TouchableOpacity 
            onPress={() => Clipboard.setString(code)}
            style={codeBlockStyles.copyButton}
          >
            <Ionicons name="copy-outline" size={16} color="#f8f8f2" />
          </TouchableOpacity>
        </View>
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          highlighter="hljs"
          fontSize={13}
          paddingHorizontal={16}
          paddingVertical={12}
        >
          {code}
        </SyntaxHighlighter>
      </View>
    );
  };

  const renderImage = (node: ASTNode) => {
    const source = node.attributes.src;
    const alt = node.attributes.alt || 'Image';
    
    return (
      <View style={markdownStyles.imageContainer}>
        <Image
          source={{ uri: source }}
          style={markdownStyles.image}
          resizeMode="contain"
          accessibilityLabel={alt}
        />
        {alt && alt !== 'Image' && (
          <Text style={markdownStyles.imageCaption}>{alt}</Text>
        )}
      </View>
    );
  };

  const videoRule = {
    match: (source: string) =>
      /^@\[video\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/.exec(source),
  
    parse: (match: RegExpExecArray) => ({
      href: match[1],
      title: match[2] || 'Video',
    }),
  
    react: (node: any, children: React.ReactNode[], parentNodes: any[], styles: any, styleObj?: any, ...args: any[]): React.ReactNode[] => {
      const source = node.attributes?.href;
      const caption = node.attributes?.title;
  
      return [
        <View key={args[0]?.key} style={styles.imageContainer}>
          <Video
            source={{ uri: source }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            style={styles.image}
          />
          {caption && <Text style={styles.imageCaption}>{caption}</Text>}
        </View>
      ];
    },
  };
  
  
  
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const botResponse = await fetchGroqResponse(input);
      const botMessage: Message = { role: "bot", text: botResponse };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { role: "bot", text: "Sorry, I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Shift') {
      setShiftPressed(true);
      return;
    }

    if (e.nativeEvent.key === 'Enter' && !shiftPressed) {
      e.preventDefault();
      sendMessage();
      return;
    }
  };

  const handleKeyRelease = () => {
    setShiftPressed(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
    >
      <FlatList
        ref={flatListRef}
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
    code_block: renderCodeBlock,
    image: renderImage,
    video: videoRule,
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {showScrollButton && (
        <Animated.View style={[styles.scrollButton, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={scrollToBottom}>
            <View style={styles.scrollButtonInner}>
              <Ionicons name="chevron-down" size={24} color="#007AFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.floatingInputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            onKeyPress={handleKeyPress}
            onKeyRelease={handleKeyRelease}
            returnKeyType="default"
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={styles.sendButton}
            disabled={!input.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={input.trim() ? "white" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
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
    paddingBottom: 100,
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
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    display: 'flex',
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
    overflow: 'hidden',
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
  floatingInputContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollButton: {
    position: 'absolute',
    left: width / 2 - 20, 
    bottom: 90,
    zIndex: 10,
  },
  scrollButtonInner: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  heading3: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 4,
  },
  paragraph: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginVertical: 4,
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  u: {
    textDecorationLine: "underline",
  },
  s: {
    textDecorationLine: "line-through",
  },
  code_inline: {
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    lineHeight: 18,
  },
  imageContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  image: {
    width: '500%',
    maxWidth: width * 0.8,
    height: 'auto',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

const codeBlockStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#343746',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  language: {
    color: '#f8f8f2',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 4,
  },
});

export default Chat;