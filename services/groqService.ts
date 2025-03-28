import { ChatGroq } from "@langchain/groq";

const GROQ_API_KEY = "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"; // Store securely
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Choose the appropriate model
const TEMPERATURE = 0.7; // Adjust for creativity

// Initialize the chat model
const chatModel = new ChatGroq({
  apiKey: GROQ_API_KEY,
  model: GROQ_MODEL,
  temperature: TEMPERATURE,
});

// ✅ Simple memory storage (since LangGraph isn't supported in Expo)
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [];

// Function to fetch response from Groq
export const fetchGroqResponse = async (message: string) => {
  try {
    // ✅ Add user message to history
    conversationHistory.push({ role: "user", content: message });

    // Invoke the chat model with memory
    const response = await chatModel.invoke(conversationHistory);

    // ✅ Store AI response in memory
    const aiMessage = { role: "assistant", content: response.content };
    conversationHistory.push(aiMessage);

    // Return AI's message
    return aiMessage.content;
  } catch (error) {
    console.error("Error fetching response from Groq:", error);
    return "Error: Unable to connect to Groq.";
  }
};

// ✅ Function to reset memory if needed
export const resetMemory = () => {
  conversationHistory = [];
};
