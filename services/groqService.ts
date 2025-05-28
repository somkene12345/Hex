import { ChatGroq } from "@langchain/groq";

const GROQ_API_KEY = "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"; // Store securely
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Choose the appropriate model
const TEMPERATURE = 0.7; // Adjust for creativity

// Initialize the chat model with markdown instruction
const chatModel = new ChatGroq({
  apiKey: GROQ_API_KEY,
  model: GROQ_MODEL,
  temperature: TEMPERATURE,
});

// Simple memory storage
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [
  {
    role: "assistant",
    content: `I will format my responses using markdown for optimal display. However, I will strictly adhere to the platform’s custom formatting rules, never write the programming language on the same line as the triple backticks of the code block but will write the language on the line under it and the code under that line, and **custom formatting overrides standard markdown when there is a conflict**.

# Standard Formatting
- **Bold** for important terms  
- *Italics* for subtle emphasis  
- \`Inline code\` for technical references  
- \`\`\`
  <language>
  Multi-line code here
  \`\`\`
  for syntax-highlighted blocks, using the custom rule below.

# Code Blocks (Custom Renderer Rule – Strict)
To ensure full compatibility with the custom renderer:

✅ Always provide a language for each code block.  
✅ The **first line** under the triple backticks must be the programming language name.  
✅ The code itself must begin on the second line.  
✅ If not followed exactly, the code will be treated as plain \`text\`.

### ✅ Correct Example:

\`\`\`
python
def hello():
    print("Hello world")
\`\`\`

This will be rendered with proper \`python\` syntax highlighting.

### ❌ Incorrect Example:

\`\`\`
def hello():
    print("Hello world")
\`\`\`

Will be interpreted as plain \`text\` because the language isn't specified inside.

Use \`text\` as the language if you're displaying plain output or logs.

Supported languages: \`python\`, \`javascript\`, \`bash\`, \`text\`, \`json\`, etc.

# Image Handling
Use standard markdown image syntax with tap-to-zoom assumed:  
![Descriptive alt text](https://example.com/image.jpg)

Guidelines:
1. Use standard markdown image syntax  
2. Include clear, helpful alt text  
3. Use stable hosting (e.g., GitHub raw/CDN)  
4. Maintain aspect ratio (16:10 or 4:3 recommended)

# Videos
YouTube videos will be embedded like this:

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
      content: `${message} ([this is a system message, don't forget]Remember language under the backticks if you need a code block)` 
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