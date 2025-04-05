import { 
  users, type User, type InsertUser, 
  bots, type Bot, type InsertBot,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage,
  settings, type Settings, type InsertSettings
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot methods
  getBot(id: number): Promise<Bot | undefined>;
  getBots(): Promise<Bot[]>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, bot: Partial<InsertBot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;
  
  // Chat methods
  getChat(id: number): Promise<Chat | undefined>;
  getChatsByBotId(botId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat | undefined>;
  deleteChat(id: number): Promise<boolean>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByChatId(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bots: Map<number, Bot>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private settings: Settings | undefined;
  
  private userCurrentId: number;
  private botCurrentId: number;
  private chatCurrentId: number;
  private messageCurrentId: number;
  private settingsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.bots = new Map();
    this.chats = new Map();
    this.messages = new Map();
    
    this.userCurrentId = 1;
    this.botCurrentId = 1;
    this.chatCurrentId = 1;
    this.messageCurrentId = 1;
    this.settingsCurrentId = 1;
    
    // Create default settings
    this.settings = {
      id: this.settingsCurrentId,
      apiKey: "",
      apiUrl: "https://api.openai.com/v1",
      tokenLimit: 4000,
      temperature: "0.7",
      topK: "0.5",
      useStreamingApi: true,
      customApiHeaders: "",
      hasApiKey: false
    };
    
    // Create default bot
    const defaultBot: Bot = {
      id: this.botCurrentId++,
      name: "AI Assistant",
      avatar: "A",
      color: "#0078D4",
      description: "General AI Assistant",
      model: "gpt-4o",
      createdAt: new Date()
    };
    this.bots.set(defaultBot.id, defaultBot);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Bot methods
  async getBot(id: number): Promise<Bot | undefined> {
    return this.bots.get(id);
  }
  
  async getBots(): Promise<Bot[]> {
    return Array.from(this.bots.values());
  }
  
  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = this.botCurrentId++;
    const bot: Bot = { 
      ...insertBot, 
      id,
      createdAt: new Date()
    };
    this.bots.set(id, bot);
    return bot;
  }
  
  async updateBot(id: number, botUpdate: Partial<InsertBot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot: Bot = { 
      ...bot, 
      ...botUpdate 
    };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }
  
  async deleteBot(id: number): Promise<boolean> {
    return this.bots.delete(id);
  }
  
  // Chat methods
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  async getChatsByBotId(botId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.botId === botId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.chatCurrentId++;
    const chat: Chat = { 
      ...insertChat, 
      id,
      createdAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  async updateChat(id: number, chatUpdate: Partial<InsertChat>): Promise<Chat | undefined> {
    const chat = this.chats.get(id);
    if (!chat) return undefined;
    
    const updatedChat: Chat = { 
      ...chat, 
      ...chatUpdate 
    };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }
  
  async deleteChat(id: number): Promise<boolean> {
    return this.chats.delete(id);
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessagesByChatId(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const message: Message = { 
      ...insertMessage, 
      id,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
  
  async updateMessage(id: number, messageUpdate: Partial<InsertMessage>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage: Message = { 
      ...message, 
      ...messageUpdate 
    };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
  
  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }
  
  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { 
      ...this.settings!, 
      ...settingsUpdate 
    };
    return this.settings;
  }
}

export const storage = new MemStorage();
