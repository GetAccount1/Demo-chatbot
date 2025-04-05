import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import { createChatCompletion, processFileContent } from "./openai";
import { 
  insertBotSchema, 
  insertChatSchema, 
  insertMessageSchema, 
  insertSettingsSchema,
  type FileAttachment
} from "@shared/schema";

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = [
      'text/plain', 
      'application/pdf',
      'text/html',
      'text/css',
      'application/javascript',
      'text/javascript',
      'application/typescript',
      'text/x-python',
      'text/markdown',
      'application/x-typescript',
    ];
    
    const allowedExtensions = [
      'txt', 'pdf', 'py', 'tsx', 'js', 'ts', 'jsx', 'css', 'html', 'md'
    ];
    
    // Check by mimetype or extension
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (allowedTypes.includes(file.mimetype) || 
        (fileExt && allowedExtensions.includes(fileExt))) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// WebSocket clients map
type Client = {
  ws: WebSocket;
  chatId?: number;
};

const clients = new Map<string, Client>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substring(2, 10);
    clients.set(id, { ws });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'join') {
          const client = clients.get(id);
          if (client) {
            client.chatId = data.chatId;
            clients.set(id, client);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(id);
    });
  });

  // Bot Routes
  app.get('/api/bots', async (req: Request, res: Response) => {
    try {
      const bots = await storage.getBots();
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get bots' });
    }
  });

  app.post('/api/bots', async (req: Request, res: Response) => {
    try {
      const validationResult = insertBotSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid bot data', errors: validationResult.error });
      }
      
      const bot = await storage.createBot(validationResult.data);
      res.status(201).json(bot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create bot' });
    }
  });

  app.get('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const bot = await storage.getBot(id);
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      res.json(bot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get bot' });
    }
  });

  app.patch('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const bot = await storage.getBot(id);
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      const validationResult = insertBotSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid bot data', errors: validationResult.error });
      }
      
      const updatedBot = await storage.updateBot(id, validationResult.data);
      res.json(updatedBot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update bot' });
    }
  });

  app.delete('/api/bots/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      const deleted = await storage.deleteBot(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete bot' });
    }
  });

  // Chat Routes
  app.get('/api/chats', async (req: Request, res: Response) => {
    try {
      const botId = req.query.botId ? parseInt(req.query.botId as string) : undefined;
      if (botId !== undefined && isNaN(botId)) {
        return res.status(400).json({ message: 'Invalid bot ID' });
      }
      
      let chats = [];
      if (botId !== undefined) {
        chats = await storage.getChatsByBotId(botId);
      } else {
        // Get all chats for all bots
        const bots = await storage.getBots();
        for (const bot of bots) {
          const botChats = await storage.getChatsByBotId(bot.id);
          chats.push(...botChats);
        }
      }
      
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get chats' });
    }
  });

  app.post('/api/chats', async (req: Request, res: Response) => {
    try {
      const validationResult = insertChatSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid chat data', errors: validationResult.error });
      }
      
      const bot = await storage.getBot(validationResult.data.botId);
      if (!bot) {
        return res.status(400).json({ message: 'Bot not found' });
      }
      
      const chat = await storage.createChat(validationResult.data);
      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create chat' });
    }
  });

  app.get('/api/chats/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid chat ID' });
      }
      
      const chat = await storage.getChat(id);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      res.json(chat);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get chat' });
    }
  });

  app.delete('/api/chats/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid chat ID' });
      }
      
      const deleted = await storage.deleteChat(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete chat' });
    }
  });

  // Message Routes
  app.get('/api/chats/:chatId/messages', async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: 'Invalid chat ID' });
      }
      
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  // Message with file upload
  app.post('/api/chats/:chatId/messages', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: 'Invalid chat ID' });
      }
      
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      
      // Process uploaded files
      const files = req.files as Express.Multer.File[];
      const fileAttachments: FileAttachment[] = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          const content = file.buffer.toString('base64');
          fileAttachments.push({
            name: file.originalname,
            type: file.mimetype,
            content
          });
        }
      }
      
      // Create message with files
      const messageData = {
        chatId,
        content: req.body.content,
        role: 'user',
        files: fileAttachments.length > 0 ? fileAttachments : undefined
      };
      
      const validationResult = insertMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid message data', errors: validationResult.error });
      }
      
      const message = await storage.createMessage(validationResult.data);
      
      // Get bot response
      const settings = await storage.getSettings();
      
      // Check for API key in settings or environment variables
      const hasApiKey = settings?.apiKey || process.env.OPENAI_API_KEY;
      if (!hasApiKey) {
        return res.status(400).json({ message: 'API key not configured in settings or environment variables (.env)' });
      }
      
      const bot = await storage.getBot(chat.botId);
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' });
      }
      
      // Prepare conversation history
      const history = await storage.getMessagesByChatId(chatId);
      const messages = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));
      
      // Process file attachments if any
      let fileContentPrompt = "";
      if (fileAttachments.length > 0) {
        fileContentPrompt = "The user has shared the following files:\n\n";
        
        for (const file of fileAttachments) {
          const contentBuffer = Buffer.from(file.content, 'base64');
          const fileContent = contentBuffer.toString('utf-8');
          
          try {
            fileContentPrompt += `File: ${file.name}\n\n${fileContent}\n\n`;
          } catch (error) {
            fileContentPrompt += `File: ${file.name} (binary file)\n\n`;
          }
        }
        
        fileContentPrompt += "Please analyze these files and respond to the user's message.";
      }
      
      // Add system message for the bot
      messages.unshift({
        role: "system",
        content: `You are ${bot.name}, ${bot.description || "an AI assistant"}. ${fileContentPrompt}`
      });
      
      // Create AI response message placeholder
      const responseMessage = await storage.createMessage({
        chatId,
        content: "",
        role: "assistant",
        files: undefined
      });
      
      // Send initial response
      res.status(201).json({ 
        userMessage: message,
        botMessage: responseMessage
      });
      
      // Start streaming chat completion
      try {
        // Handle missing settings with defaults
        const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY || '';
        const model = bot.model || 'gpt-4o';
        const temperature = settings?.temperature ? parseFloat(settings.temperature) : 0.7;
        const max_tokens = settings?.tokenLimit || 4000;
        const top_p = settings?.topK ? parseFloat(settings.topK) : 0.5;
        const apiUrl = settings?.apiUrl || process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
        const useStreaming = settings?.useStreamingApi !== false;
        const customHeaders = settings?.customApiHeaders || undefined;
        
        // Create completion with proper handling of null values
        const stream = await createChatCompletion(
          apiKey,
          messages,
          {
            model,
            temperature,
            max_tokens,
            top_p,
            apiUrl,
            customHeaders,
            useStreaming
          }
        );
        
        let fullContent = "";
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            
            // Update message in storage
            await storage.updateMessage(responseMessage.id, {
              content: fullContent
            });
            
            // Broadcast to WebSocket clients
            for (const [clientId, client] of clients.entries()) {
              if (client.chatId === chatId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                  type: 'message-update',
                  messageId: responseMessage.id,
                  content: fullContent
                }));
              }
            }
          }
        }
        
        // Final update
        const finalMessage = await storage.updateMessage(responseMessage.id, {
          content: fullContent
        });
        
        // Broadcast completion to WebSocket clients
        for (const [clientId, client] of clients.entries()) {
          if (client.chatId === chatId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: 'message-complete',
              messageId: responseMessage.id,
              message: finalMessage
            }));
          }
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        // Update message with error
        await storage.updateMessage(responseMessage.id, {
          content: "Sorry, I had trouble generating a response. Please try again."
        });
        
        // Broadcast error to WebSocket clients
        for (const [clientId, client] of clients.entries()) {
          if (client.chatId === chatId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: 'message-error',
              messageId: responseMessage.id,
              error: "Error generating response"
            }));
          }
        }
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  app.patch('/api/messages/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid message ID' });
      }
      
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      const validationResult = insertMessageSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid message data', errors: validationResult.error });
      }
      
      const updatedMessage = await storage.updateMessage(id, validationResult.data);
      res.json(updatedMessage);
      
      // Broadcast update to WebSocket clients
      for (const [clientId, client] of clients.entries()) {
        if (client.chatId === message.chatId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'message-edited',
            messageId: id,
            message: updatedMessage
          }));
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to update message' });
    }
  });

  // Settings Routes
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      // Don't send API key to frontend
      const { apiKey, ...safeSettings } = settings;
      
      // Include environment-based settings information
      const hasEnvApiKey = Boolean(process.env.OPENAI_API_KEY);
      const envApiUrl = process.env.OPENAI_API_URL;
      const hasEnvApiHeaders = Boolean(process.env.OPENAI_API_HEADERS);
      
      res.json({
        ...safeSettings,
        hasApiKey: Boolean(apiKey) || hasEnvApiKey,
        envApiUrl: envApiUrl || undefined,
        hasEnvApiHeaders
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get settings' });
    }
  });

  app.patch('/api/settings', async (req: Request, res: Response) => {
    try {
      const validationResult = insertSettingsSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid settings data', errors: validationResult.error });
      }
      
      const settings = await storage.updateSettings(validationResult.data);
      
      // Don't send API key to frontend
      const { apiKey, ...safeSettings } = settings;
      
      // Include environment-based settings information
      const hasEnvApiKey = Boolean(process.env.OPENAI_API_KEY);
      const envApiUrl = process.env.OPENAI_API_URL;
      const hasEnvApiHeaders = Boolean(process.env.OPENAI_API_HEADERS);
      
      res.json({
        ...safeSettings,
        hasApiKey: Boolean(apiKey) || hasEnvApiKey,
        envApiUrl: envApiUrl || undefined,
        hasEnvApiHeaders
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  return httpServer;
}
