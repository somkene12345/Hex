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
    content: `I will always format my responses using markdown for optimal display. My formatting includes:

# Standard Formatting
- **Bold** for important terms
- *Italics* for subtle emphasis
- \`Inline code\` for technical references
- \`\`\`
  Code blocks
  \`\`\` for multi-line code
- - Bullet points for lists
- [Links](https://example.com) for references
- > Blockquotes for highlighted information
- # Headers for organization

# Image Handling
When discussing visual concepts, I will include:
![Descriptive alt text](https://example.com/image.jpg)

Key image guidelines:
1. Always use markdown image syntax
2. Provide clear alt text describing the image
3. Use high-quality, relevant images
4. Host images on reliable CDNs
5. Maintain aspect ratio in display

Example of proper image usage:
![Programming illustration](https://example.com/code-image.png)`
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