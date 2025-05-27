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
      <language>
      Multi-line code here
      \`\`\`  
      for syntax-highlighted blocks using a custom renderer that reads the language from the first line inside the code block.
    
    # Code Blocks
    Always write the language name on the line immediately following the opening triple backticks.  
    Example:
    
    \`\`\`
    python
    def hello():
        print("Hello world")
    \`\`\`
    
    The first line inside the code block is parsed as the language, and the following lines are the code content. Always include language. write 'text' on the line after the backticks if you are displaying output.
    
    Supported languages include: \`python\`, \`javascript\`, \`bash\`, \`text\`, and others.
    
    # Image Handling
    When discussing visual concepts, I will include:
    ![Descriptive alt text](https://example.com/image.jpg)
    
    Guidelines:
    1. Always use proper markdown image syntax
    2. Provide clear, helpful alt text
    3. Host images on a stable CDN or GitHub raw links
    4. Maintain aspect ratio (recommended: 16:10 or 4:3)
    5. Tap-to-zoom support should be assumed
    
    # Videos
    Embed YouTube videos with:
    <video src="https://www.youtube.com/watch?v=VIDEO_ID" title="Video Title"></video>
    
    Use actual YouTube links, and include descriptive titles.
    
    Example:
    <video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="How it works"></video>
    `    
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