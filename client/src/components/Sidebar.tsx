import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Chat } from "@shared/schema";
import { createChat } from "@/lib/openai";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/App";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  onNewBot: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ onNewBot, onOpenSettings }: SidebarProps) {
  const { 
    activeBot, 
    setActiveBot, 
    activeChat, 
    setActiveChat,
    sidebarOpen,
    setSidebarOpen
  } = useAppContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bots
  const {
    data: bots = [],
    isLoading: isLoadingBots,
  } = useQuery({
    queryKey: ['/api/bots'],
  });

  // Fetch chats for active bot
  const {
    data: chats = [],
    isLoading: isLoadingChats,
  } = useQuery({
    queryKey: ['/api/chats', activeBot?.id],
    enabled: !!activeBot,
  });

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (botId: number) => {
      return createChat(botId, "New Chat");
    },
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', activeBot?.id] });
      setActiveChat(newChat);
      toast({
        title: "Chat created",
        description: "New chat has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Select bot and create new chat if needed
  const handleSelectBot = async (bot: Bot) => {
    setActiveBot(bot);
    
    // Get chats for this bot
    const botChats = await queryClient.fetchQuery({
      queryKey: ['/api/chats', bot.id],
    });
    
    // If no chats exist, create a new one
    if (!botChats || botChats.length === 0) {
      createChatMutation.mutate(bot.id);
    } else {
      // Otherwise select the most recent chat
      setActiveChat(botChats[0]);
    }
  };

  // Create new chat for current bot
  const handleNewChat = () => {
    if (activeBot) {
      createChatMutation.mutate(activeBot.id);
    }
  };

  // Format date for chat list
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const day = 24 * 60 * 60 * 1000;
    
    if (diff < day) {
      return "Today";
    } else if (diff < 2 * day) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  useEffect(() => {
    // Set first bot as active on initial load if none selected
    if (bots && bots.length > 0 && !activeBot) {
      handleSelectBot(bots[0]);
    }
  }, [bots]);

  return (
    <aside className={cn(
      "bg-white w-64 border-r border-neutral-200 flex flex-col transition-all duration-300 h-full",
      sidebarOpen ? "translate-x-0" : "-translate-x-full",
      "fixed md:static z-20"
    )}>
      {/* Mobile close button */}
      <div className="md:hidden absolute -right-10 top-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full bg-white"
          onClick={() => setSidebarOpen(false)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* New bot button */}
      <div className="p-4 border-b border-neutral-200">
        <Button 
          className="w-full flex items-center justify-center gap-2"
          onClick={onNewBot}
        >
          <Plus className="h-5 w-5" />
          <span>New Bot</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        {/* Bots list */}
        <div className="p-2">
          <h2 className="text-xs font-semibold uppercase text-neutral-500 px-3 py-2">My Bots</h2>
          {isLoadingBots ? (
            <div className="px-3 py-2 text-sm text-neutral-500">Loading bots...</div>
          ) : bots.length === 0 ? (
            <div className="px-3 py-2 text-sm text-neutral-500">No bots found</div>
          ) : (
            bots.map((bot: Bot) => (
              <div
                key={bot.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                  activeBot?.id === bot.id ? "bg-neutral-100" : "hover:bg-neutral-100"
                )}
                onClick={() => handleSelectBot(bot)}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: bot.color }}
                >
                  {bot.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {bot.name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Recent chats list */}
        {activeBot && (
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-xs font-semibold uppercase text-neutral-500">Recent Chats</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={handleNewChat}
                disabled={createChatMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoadingChats ? (
              <div className="px-3 py-2 text-sm text-neutral-500">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-500">No chats found</div>
            ) : (
              chats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                    activeChat?.id === chat.id ? "bg-neutral-100" : "hover:bg-neutral-100"
                  )}
                  onClick={() => setActiveChat(chat)}
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: activeBot.color }}
                  >
                    {activeBot.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {formatDate(chat.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Settings button */}
      <div className="p-3 border-t border-neutral-200">
        <button 
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
          onClick={onOpenSettings}
        >
          <Settings className="h-5 w-5 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-700">Settings</span>
        </button>
      </div>
    </aside>
  );
}
