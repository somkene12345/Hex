import { ChatGroq } from "@langchain/groq";

const GROQ_API_KEY = "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"; // Store securely
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Choose the appropriate model
const TEMPERATURE = 0.7; // Adjust for creativity

// Initialize the chat model with enhanced markdown instruction
const chatModel = new ChatGroq({
  apiKey: GROQ_API_KEY,
  model: GROQ_MODEL,
  temperature: TEMPERATURE,
});

// Enhanced memory storage with image support
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [
  // System message to instruct AI to always use markdown including images
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

// Enhanced function to fetch response from Groq with strict markdown enforcement
export const fetchGroqResponse = async (message: string): Promise<string> => {
  try {
    // Add user message with gentle reminder about images
    conversationHistory.push({ 
      role: "user", 
      content: `${message}\n\n(Please include relevant images in markdown format when appropriate)`
    });

    // Invoke with enhanced prompt structure
    const response = await chatModel.invoke([
      ...conversationHistory,
      {
        role: "system",
        content: "REMINDER: Always respond using markdown formatting. " +
                 "Include relevant images when discussing visual concepts " +
                 "using proper markdown image syntax: ![alt text](url). " +
                 "Ensure images are properly hosted and accessible."
      }
    ]);

    // Process response to ensure image formatting
    let processedContent = response.content;
    
    // Add default image if none provided for certain topics
    const visualTopics = ['design', 'illustration', 'photo', 'diagram', 'chart'];
    if (visualTopics.some(topic => message.toLowerCase().includes(topic)) && 
        !processedContent.includes('![')) {
      processedContent += `\n\n![Relevant ${visualTopics.find(t => message.includes(t)) || 'visual'}]` +
                         `(https://source.unsplash.com/random/300x200/?${visualTopics.find(t => message.includes(t)) || 'design'})`;
    }

    // Store AI response in memory
    const aiMessage = { 
      role: "assistant", 
      content: processedContent 
    };
    conversationHistory.push(aiMessage);

    // Return processed message
    return aiMessage.content;
  } catch (error) {
    console.error("Error fetching response from Groq:", error);
    return "**Error**: Unable to process request. Please try again later.";
  }
};

// Enhanced memory reset with image guidelines
export const resetMemory = () => {
  conversationHistory = [
    {
      role: "assistant",
      content: `I will format responses using markdown including:
- **Text formatting**
- \`Code examples\`
- ![Visual aids](https://example.com/default-image.png) when helpful
- Organized sections with headers`
    }
  ];
};

// Helper function to validate image URLs in responses
export const containsValidImageMarkdown = (content: string): boolean => {
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|svg)(?:\?\S*)?)\)/;
  return imageRegex.test(content);
};