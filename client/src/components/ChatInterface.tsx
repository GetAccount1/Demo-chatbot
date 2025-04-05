import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Edit } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { Dropzone } from "@/components/ui/dropzone";
import FilePreview from "@/components/FilePreview";
import { Message, Bot, FileAttachment } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage, updateMessage } from "@/lib/openai";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  bot: Bot | null;
  chatId: number | null;
  messages: Message[];
  onSendMessage: (content: string, files: File[]) => Promise<void>;
}

export default function ChatInterface({ 
  bot, 
  chatId, 
  messages, 
  onSendMessage 
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showDropzone, setShowDropzone] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // WebSocket connection for real-time updates
  const { status: wsStatus } = useWebSocket(chatId || undefined, {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message-update') {
          // Update message content during streaming
          queryClient.setQueryData([`/api/chats/${chatId}/messages`], (oldData: Message[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(msg => 
              msg.id === data.messageId ? { ...msg, content: data.content } : msg
            );
          });
        } 
        else if (data.type === 'message-complete' || data.type === 'message-edited') {
          // Refresh messages after completion or edit
          queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return updateMessage(id, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      setEditingMessage(null);
      toast({
        title: "Message updated",
        description: "Your message has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && files.length === 0) return;
    if (!chatId) return;
    
    try {
      await onSendMessage(messageInput, files);
      setMessageInput("");
      setFiles([]);
      setShowDropzone(false);
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = () => {
    if (!editingMessage || !editContent.trim()) return;
    
    editMessageMutation.mutate({
      id: editingMessage.id,
      content: editContent,
    });
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  // Get avatar for message
  const getAvatar = (role: string) => {
    if (role === 'user') {
      return (
        <div className="h-10 w-10 rounded-full bg-neutral-300 flex items-center justify-center text-white font-medium flex-shrink-0">
          U
        </div>
      );
    } else if (bot) {
      return (
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
          style={{ backgroundColor: bot.color }}
        >
          {bot.avatar}
        </div>
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0">
          A
        </div>
      );
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-neutral-100 overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-neutral-700 mb-2">Start a new conversation</h2>
              <p className="text-neutral-500">Send a message to begin chatting with the AI</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="mb-6">
              {message.role === 'user' ? (
                // User Message
                <div className="flex items-start justify-end">
                  <div className="flex items-center group max-w-3xl ml-auto">
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1 mr-2">
                      <button 
                        className="text-neutral-400 hover:text-neutral-700 transition-colors" 
                        title="Edit message"
                        onClick={() => startEditing(message)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-primary text-white rounded-lg p-4 shadow-sm">
                      {editingMessage?.id === message.id ? (
                        <div className="min-w-[200px]">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mb-2 bg-primary-dark text-white border-primary-dark placeholder-white/50 resize-none"
                            placeholder="Edit your message..."
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditing}
                              className="h-7 bg-primary-dark text-white border-primary-dark hover:bg-primary hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={handleEditSubmit}
                              className="h-7"
                              disabled={editMessageMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.files && message.files.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-primary-dark">
                              {message.files.map((file: FileAttachment, idx: number) => (
                                <div key={idx} className="flex items-center bg-primary-dark rounded p-2 text-sm mt-1">
                                  <span>{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {getAvatar('user')}
                </div>
              ) : (
                // Bot Message
                <div className="flex items-start">
                  {getAvatar('assistant')}
                  <div className="flex items-center group max-w-3xl">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      {editingMessage?.id === message.id ? (
                        <div className="min-w-[200px]">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mb-2 resize-none"
                            placeholder="Edit bot message..."
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditing}
                              className="h-7"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={handleEditSubmit}
                              className="h-7"
                              disabled={editMessageMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-900">
                          {message.content ? (
                            <Markdown content={message.content} />
                          ) : (
                            <div className="text-sm text-neutral-900 bot-message-typing">
                              Thinking...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-1 ml-2">
                      <button 
                        className="text-neutral-400 hover:text-neutral-700 transition-colors" 
                        title="Edit message"
                        onClick={() => startEditing(message)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-neutral-200 bg-white p-4">
        {/* File upload previews */}
        {files.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <FilePreview
                key={index}
                file={file}
                onRemove={() => {
                  const newFiles = [...files];
                  newFiles.splice(index, 1);
                  setFiles(newFiles);
                }}
              />
            ))}
          </div>
        )}

        {/* File dropzone */}
        {showDropzone && (
          <Dropzone
            onFilesSelected={handleFilesSelected}
            currentFiles={files}
            className="mb-4"
            maxFiles={5}
          />
        )}
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-end">
          <div className="flex-1 bg-neutral-100 rounded-lg border border-neutral-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            {/* Upload attachment button */}
            <div className="flex items-center px-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDropzone(!showDropzone)}
                className={cn(
                  "text-neutral-500 hover:text-neutral-700 transition-colors p-1 rounded",
                  showDropzone && "bg-neutral-200 text-neutral-700"
                )}
              >
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            
            {/* Textarea */}
            <Textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="border-0 focus-visible:ring-0 resize-none bg-transparent min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          
          {/* Send button */}
          <Button 
            type="submit" 
            className="ml-2 rounded-full p-2 w-10 h-10"
            disabled={(!messageInput.trim() && files.length === 0) || !chatId}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </main>
  );
}
