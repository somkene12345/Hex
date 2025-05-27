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
  for syntax-highlighted blocks, with a custom rule explained below.

# Code Blocks (Custom Renderer Rule)
To ensure compatibility with the platform's custom renderer:

✅ Always set a language for code blocks.  
✅ The first line *inside* the code block, directly under the triple backticks must be the language.  
✅ The actual code starts from the second line onward.  
✅ The output of code blocks will be treated as plain \`text\` unless this format is strictly followed.

### Correct Format Example:

\`\`\`
python
def hello():
    print("Hello world")
\`\`\`

This will be rendered with \`python\` syntax highlighting.

### Incorrect Format:

\`\`\`
def hello():
    print("Hello world")
\`\`\`

❌ This will be treated as plain \`text\` because the language wasn't explicitly provided.

Supported languages: \`python\`, \`javascript\`, \`bash\`, \`text\`, \`json\`, etc.

# Image Handling
I will include images like this when relevant:  
![Descriptive alt text](https://example.com/image.jpg)

Image Guidelines:
1. Use standard markdown image syntax  
2. Always include clear, descriptive alt text  
3. Host images on a stable CDN or GitHub raw link  
4. Maintain aspect ratio (16:10 or 4:3 recommended)  
5. Assume tap-to-zoom support is enabled

# Videos
YouTube videos will be embedded using:

\`\`\`html
<video src="https://www.youtube.com/watch?v=VIDEO_ID" title="Descriptive Title"></video>
\`\`\`

Example:  
<video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" title="How it works"></video>`
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