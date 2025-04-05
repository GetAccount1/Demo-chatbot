import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

// Global OpenAI client instance
let openaiClient: OpenAI | null = null;
let lastConfig: any = {}; // Track last config to know when to reinitialize

// Initialize or get OpenAI client with current settings
export async function getOpenAIClient(
  apiKey: string | undefined = undefined, 
  options: {
    apiUrl?: string;
    customHeaders?: Record<string, string>;
  } = {}
): Promise<OpenAI> {
  // Use provided API key or fallback to env variable
  const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
  
  // If no API key is available, throw an error
  if (!finalApiKey) {
    throw new Error("API key is required. Set OPENAI_API_KEY in .env or provide it directly.");
  }
  
  const { apiUrl, customHeaders } = options;
  // Use custom API URL from options or .env file or default OpenAI API
  const finalApiUrl = apiUrl || process.env.OPENAI_API_URL || "https://api.openai.com/v1";
  
  // Merge provided custom headers with those from environment variables
  let mergedHeaders = { ...customHeaders };
  if (process.env.OPENAI_API_HEADERS) {
    try {
      const envHeaders = JSON.parse(process.env.OPENAI_API_HEADERS);
      mergedHeaders = { ...envHeaders, ...mergedHeaders };
    } catch (e) {
      console.warn('Failed to parse OPENAI_API_HEADERS from environment:', e);
    }
  }
  
  // Check if we need to reinitialize the client
  const needsReinit = 
    !openaiClient || 
    finalApiKey !== lastConfig.apiKey ||
    finalApiUrl !== lastConfig.apiUrl ||
    JSON.stringify(mergedHeaders) !== JSON.stringify(lastConfig.customHeaders);
  
  if (needsReinit) {
    const config: Record<string, any> = { apiKey: finalApiKey };
    
    // Always set baseURL to our finalized URL
    config.baseURL = finalApiUrl;
    
    // Add custom headers if provided
    if (mergedHeaders && Object.keys(mergedHeaders).length > 0) {
      config.defaultHeaders = mergedHeaders;
    }
    
    // Store the current config for future comparison
    lastConfig = { apiKey: finalApiKey, apiUrl: finalApiUrl, customHeaders: mergedHeaders };
    
    // Create a new OpenAI client
    openaiClient = new OpenAI(config);
    console.log(`OpenAI client initialized with API URL: ${finalApiUrl}`);
  }
  
  // Ensure we have a client before returning
  if (!openaiClient) {
    throw new Error("Failed to initialize OpenAI client");
  }
  
  return openaiClient;
}

// Chat completion function with streaming support
export async function createChatCompletion(
  apiKey: string | undefined = undefined,
  messages: { role: string; content: string }[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    apiUrl?: string;
    customHeaders?: Record<string, string> | string;
    useStreaming?: boolean;
  } = {}
) {
  // Parse custom headers if provided as string
  let customHeaders: Record<string, string> | undefined;
  if (options.customHeaders && typeof options.customHeaders === 'string') {
    try {
      customHeaders = JSON.parse(options.customHeaders);
    } catch (e) {
      console.warn('Failed to parse custom headers:', e);
    }
  } else if (options.customHeaders && typeof options.customHeaders === 'object') {
    customHeaders = options.customHeaders;
  }
  
  const client = await getOpenAIClient(apiKey, {
    apiUrl: options.apiUrl,
    customHeaders
  });
  
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const model = options.model || "gpt-4o";
  
  // Default to streaming unless explicitly disabled
  const useStreaming = options.useStreaming !== false;
  
  // Properly type and convert messages for OpenAI API
  const chatMessages: ChatCompletionMessageParam[] = messages.map(msg => {
    // Convert to proper OpenAI message format with appropriate type casting
    if (msg.role === 'user') {
      return { role: 'user', content: msg.content } as ChatCompletionMessageParam;
    } else if (msg.role === 'assistant') {
      return { role: 'assistant', content: msg.content } as ChatCompletionMessageParam;
    } else if (msg.role === 'system') {
      return { role: 'system', content: msg.content } as ChatCompletionMessageParam;
    } else {
      // Default to user if an unknown role is provided
      return { role: 'user', content: msg.content } as ChatCompletionMessageParam;
    }
  });
  
  return client.chat.completions.create({
    model,
    messages: chatMessages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    top_p: options.top_p,
    stream: useStreaming,
  });
}

// Process file content for the model
export async function processFileContent(
  apiKey: string | undefined = undefined,
  fileContent: string,
  fileName: string,
  fileType: string,
  options: {
    apiUrl?: string;
    customHeaders?: Record<string, string> | string;
  } = {}
) {
  // Parse custom headers if provided as string
  let customHeaders: Record<string, string> | undefined;
  if (options.customHeaders && typeof options.customHeaders === 'string') {
    try {
      customHeaders = JSON.parse(options.customHeaders);
    } catch (e) {
      console.warn('Failed to parse custom headers:', e);
    }
  } else if (options.customHeaders && typeof options.customHeaders === 'object') {
    customHeaders = options.customHeaders;
  }
  
  const client = await getOpenAIClient(apiKey, {
    apiUrl: options.apiUrl,
    customHeaders
  });
  
  // Extract file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Determine file type for prompt engineering
  let fileTypeDesc = "";
  if (extension === "py") fileTypeDesc = "Python";
  else if (["js", "jsx", "ts", "tsx"].includes(extension || "")) fileTypeDesc = "JavaScript/TypeScript";
  else if (extension === "html") fileTypeDesc = "HTML";
  else if (extension === "css") fileTypeDesc = "CSS";
  else if (extension === "pdf") fileTypeDesc = "PDF";
  else fileTypeDesc = "text";
  
  // Create prompt for file analysis
  const message = `This is the content of a ${fileTypeDesc} file named ${fileName}:\n\n${fileContent}\n\nPlease analyze this file and provide a brief summary.`;
  
  // Create properly typed message
  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: message } as ChatCompletionMessageParam
  ];
  
  const response = await client.chat.completions.create({
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    model: "gpt-4o",
    messages,
    temperature: 0.3,
    max_tokens: 500
  });
  
  return response.choices[0].message.content;
}
