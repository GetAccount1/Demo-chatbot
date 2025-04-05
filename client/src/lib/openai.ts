import { apiRequest } from "./queryClient";

// API functions for OpenAI integration
export async function createBot(data: {
  name: string;
  avatar: string;
  color: string;
  description?: string;
  model: string;
}) {
  const res = await apiRequest("POST", "/api/bots", data);
  return res.json();
}

export async function updateBot(id: number, data: {
  name?: string;
  avatar?: string;
  color?: string;
  description?: string;
  model?: string;
}) {
  const res = await apiRequest("PATCH", `/api/bots/${id}`, data);
  return res.json();
}

export async function createChat(botId: number, title: string) {
  const res = await apiRequest("POST", "/api/chats", { botId, title });
  return res.json();
}

export async function sendMessage(chatId: number, content: string, files?: File[]) {
  // Create FormData to handle file upload
  const formData = new FormData();
  formData.append("content", content);
  
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append("files", file);
    });
  }
  
  // Use fetch directly for FormData
  const res = await fetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
}

export async function updateMessage(id: number, content: string) {
  const res = await apiRequest("PATCH", `/api/messages/${id}`, { content });
  return res.json();
}

export async function updateSettings(settings: {
  apiKey?: string;
  apiUrl?: string;
  tokenLimit?: number;
  temperature?: string;
  topK?: string;
  useStreamingApi?: boolean;
  customApiHeaders?: string;
  hasApiKey?: boolean;
}) {
  // Remove null values before sending
  Object.keys(settings).forEach(key => {
    if (settings[key as keyof typeof settings] === null) {
      delete settings[key as keyof typeof settings];
    }
  });
  
  const res = await apiRequest("PATCH", "/api/settings", settings);
  return res.json();
}

// File utility functions
export function isAcceptedFileType(file: File): boolean {
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
  ];
  
  const allowedExtensions = [
    'txt', 'pdf', 'py', 'tsx', 'js', 'ts', 'jsx', 'css', 'html', 'md'
  ];
  
  // Check by mimetype or extension
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  return Boolean(
    allowedTypes.includes(file.type) || 
    (fileExt && allowedExtensions.includes(fileExt))
  );
}

export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'py':
      return '🐍'; // Python
    case 'js':
    case 'jsx':
      return '📜'; // JavaScript
    case 'ts':
    case 'tsx':
      return '📘'; // TypeScript
    case 'html':
      return '🌐'; // HTML
    case 'css':
      return '🎨'; // CSS
    case 'pdf':
      return '📄'; // PDF
    case 'txt':
    case 'md':
      return '📝'; // Text or Markdown
    default:
      return '📁'; // Generic file
  }
}
