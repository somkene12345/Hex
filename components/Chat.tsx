import {React,  useState, useRef, useEffect } from "react";
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
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { fetchGroqResponse } from "../services/groqService";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";

const {width} = Dimensions.get('window');


const Chat = () => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll when new messages arrive
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

    // Show scroll button if not near bottom
    if (contentHeight - (offsetY + layoutHeight) > 300) {
      showScrollButton || showScrollBtn();
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Centered Floating Scroll Down Button */}
      {showScrollButton && (
        <Animated.View style={[styles.scrollButton, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={scrollToBottom}>
            <View style={styles.scrollButtonInner}>
              <Ionicons name="chevron-down" size={24} color="#007AFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Floating Input Panel */}
      <View style={styles.floatingInputContainer}>
        <View style={styles.inputWrapper}>
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
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 16,
    maxHeight: 120,
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
      marginVertical: 1, // Adds spacing above/below
    },
    image: {
        width: '50%',                    // Take 50% of container width
        maxWidth: width * 0.7,           // But no more than 70% of screen width
        aspectRatio: 1,                  // Default to square (adjust as needed)
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        resizeMode: 'contain',           // Ensures whole image fits while maintaining ratio
        alignSelf: 'center',             // Centers the image horizontally
        marginVertical: 8,
    },
          table: {
      borderWidth: 1,
      borderColor: "#DDD",
      padding: 5,
      marginVertical: 5,
    },
  });
  

export default Chat;