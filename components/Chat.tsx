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
  Alert,
  Image,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
 TextInputKeyPressEventData,
 ScrollView, 
} from "react-native";
import { fetchGroqResponse } from "../services/groqService";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import Clipboard from '@react-native-clipboard/clipboard';

// Add this state to track shift key

const {width} = Dimensions.get('window');


const Chat = () => {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [shiftPressed, setShiftPressed] = useState(false);
  


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

  // Add these keyboard handlers
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftPressed(true);
    }
  };
  
  const handleKeyRelease = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftPressed(false);
    }
  };
  
  // Add event listeners (in useEffect)
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyPress);
      window.addEventListener('keyup', handleKeyRelease);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('keyup', handleKeyRelease);
      };
    }
  }, []);

  const renderCodeBlock = ({ node }: { node: any }) => {
    const code = node.children[0]?.children[0]?.value || '';
    const language = node.attributes?.language || 'text';
  
    const handleCopy = () => {
      Clipboard.setString(code);
      Alert.alert('Copied!', 'Code copied to clipboard');
    };
  
    return (
      <View style={codeBlockStyles.container}>
        {/* Header with language and copy button */}
        <View style={codeBlockStyles.header}>
          <Text style={codeBlockStyles.language}>{language.toUpperCase()}</Text>
          <TouchableOpacity
            style={codeBlockStyles.copyButton}
            onPress={handleCopy}
            accessibilityLabel="Copy code"
          >
            <Ionicons name="copy-outline" size={14} color="#666" />
            <Text style={codeBlockStyles.copyText}>COPY</Text>
          </TouchableOpacity>
        </View>
        
        {/* Code content */}
        <ScrollView horizontal>
          <Text style={codeBlockStyles.codeText}>
            {code}
          </Text>
        </ScrollView>
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
  onSubmitEditing={() => {
    if (input.trim() && !shiftPressed) {
      sendMessage();
    }
  }}
  onKeyPress={(e) => {
    if (e.nativeEvent.key === 'Enter' && !shiftPressed) {
      if (input.trim()) {
        sendMessage();
        if (Platform.OS === 'web') {
          e.preventDefault();
        }
      }
    }
  }}
  returnKeyType="send"
  multiline
  submitBehavior="submit"
  enablesReturnKeyAutomatically={true}
/>
    <TouchableOpacity 
      onPress={sendMessage} 
      style={styles.sendButton}
      disabled={!input.trim()} // Disable when empty
    >
      <Ionicons 
        name="send" 
        size={20} 
        color={input.trim() ? "white" : "#ccc"} // Gray when disabled
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
  // Text Elements
  body: {
    color: "#333",
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Headers
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

  // Paragraphs and Text Formatting
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

  // Code and Technical Elements
  code_inline: {
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 3,
    paddingHorizontal: 4,  // Reduced from default
    paddingVertical: 2,    // Reduced from default
    lineHeight: 18,        // Tighter line height
  },
  code_block: {
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
  },
  math_inline: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#d63384",
    paddingHorizontal: 2,  // Minimal padding
  },
  math_block: {
    fontSize: 15,
    fontFamily: "monospace",
    backgroundColor: "#f8f8f8",
    padding: 6,
    marginVertical: 8,
    borderRadius: 4,
  },

  // Links and References
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  blocklink: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 8,
  },

  // Images and Media
  image: {
    width: width * 0.5,
    maxWidth: width * 0.7,
    height: 'auto',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
    marginVertical: 8,
    ...Platform.select({
      web: {
        width: '50%',
        maxWidth: '70%',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
      },
      default: {
        resizeMode: 'contain',
      }
    }),
  },

  // Tables
  table: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 4,
    marginVertical: 8,
  },
  th: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
    padding: 8,
    textAlign: "center",
  },
  td: {
    padding: 6,
    borderTopWidth: 1,
    borderColor: "#DDD",
  },
  tr: {
    flexDirection: "row",
  },

  // Lists
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    flexDirection: "row",
    marginVertical: 2,
  },
  bullet_list_icon: {
    marginRight: 8,
  },
  ordered_list_icon: {
    marginRight: 8,
  },

  // Quotes and Blocks
  blockquote: {
    backgroundColor: "#f9f9f9",
    borderLeftWidth: 4,
    borderLeftColor: "#DDD",
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  hr: {
    height: 1,
    backgroundColor: "#DDD",
    marginVertical: 16,
  },
});
  
const codeBlockStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  language: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#e8e8e8',
  },
  copyText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
    fontWeight: '500',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#333',
    padding: 12,
  },
});

export default Chat;