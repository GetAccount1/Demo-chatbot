import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  createdAt: timestamp("created_at").defaultNow(),
  files: jsonb("files").$type<FileAttachment[]>(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key"),
  apiUrl: text("api_url").default("https://api.openai.com/v1"),
  tokenLimit: integer("token_limit").default(4000),
  temperature: text("temperature").default("0.7"),
  topK: text("top_k").default("0.5"),
  useStreamingApi: boolean("use_streaming_api").default(true),
  customApiHeaders: text("custom_api_headers"),
  hasApiKey: boolean("has_api_key").default(false),
});

// Types
export type FileAttachment = {
  name: string;
  type: string;
  content: string;
};

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBotSchema = createInsertSchema(bots).pick({
  name: true,
  avatar: true,
  color: true,
  description: true,
  model: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  botId: true,
  title: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
  role: true,
  files: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  apiKey: true,
  apiUrl: true,
  tokenLimit: true,
  temperature: true,
  topK: true,
  useStreamingApi: true,
  customApiHeaders: true,
  hasApiKey: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
