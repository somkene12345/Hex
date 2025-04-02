import { ChatGroq } from "@langchain/groq";

const GROQ_API_KEY = "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"; // Store securely
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Choose the appropriate model
const TEMPERATURE = 0.7; // Adjust for creativity

// Initialize the chat model with markdown instruction
const chatModel = new ChatGroq({
  apiKey: GROQ_API_KEY,
  model: GROQ_MODEL,
  temperature: TEMPERATURE,
});

// Simple memory storage
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [
  // System message to instruct AI to always use markdown
  {
    role: "assistant",
    content: "I will always format my responses using markdown for better readability. I'll use: \n" +
             "- **Bold** for emphasis\n" +
             "- *Italics* for subtle emphasis\n" +
             "- `Code blocks` for technical terms\n" +
             "- ```\nCode fences\n``` for longer code\n" +
             "- - Bullet points for lists\n" +
             "- [Links](url) for references\n" +
             "- > Blockquotes for important notes\n" +
             "- Headers (#, ##) for section organization"
  }
];

// Function to fetch response from Groq with markdown enforcement
export const fetchGroqResponse = async (message: string) => {
  try {
    // Add user message to history with markdown hint
    conversationHistory.push({ 
      role: "user", 
      content: `${message}` 
    });

    // Invoke the chat model with memory
    const response = await chatModel.invoke(conversationHistory);

    // Store AI response in memory
    const aiMessage = { 
      role: "assistant", 
      content: response.content 
    };
    conversationHistory.push(aiMessage);

    // Return AI's message
    return aiMessage.content;
  } catch (error) {
    console.error("Error fetching response from Groq:", error);
    return "**Error**: Unable to connect to Groq."; // Even errors in markdown
  }
};

// Function to reset memory
export const resetMemory = () => {
  conversationHistory = [
    // Reset with the markdown instruction
    {
      role: "assistant",
      content: "I will always format my responses using markdown for better readability..."
    }
  ];
};