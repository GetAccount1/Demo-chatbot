import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import SettingsPanel from "@/components/SettingsPanel";
import BotCreationModal from "@/components/BotCreationModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { sendMessage } from "@/lib/openai";
import { useAppContext } from "@/App";

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [showBotCreation, setShowBotCreation] = useState(false);
  
  const { 
    activeBot, 
    activeChat,
    sidebarOpen,
    setSidebarOpen
  } = useAppContext();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch messages for the active chat
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: [`/api/chats/${activeChat?.id}/messages`],
    enabled: !!activeChat?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files: File[] }) => {
      if (!activeChat?.id) throw new Error("No active chat");
      return sendMessage(activeChat.id, content, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${activeChat?.id}/messages`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async (content: string, files: File[]) => {
    return sendMessageMutation.mutateAsync({ content, files });
  };

  // Set page title
  useEffect(() => {
    document.title = activeBot ? `Chat with ${activeBot.name}` : "AI Chat Assistant";
  }, [activeBot]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-2 flex items-center justify-between h-14 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6 text-neutral-700" />
          </Button>
          <h1 className="text-xl font-semibold text-primary">AI Chat Assistant</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          onNewBot={() => setShowBotCreation(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Chat Interface */}
        <ChatInterface
          bot={activeBot}
          chatId={activeChat?.id || null}
          messages={isLoadingMessages ? [] : messages}
          onSendMessage={handleSendMessage}
        />

        {/* Settings Panel */}
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>

      {/* Bot Creation Modal */}
      <BotCreationModal
        open={showBotCreation}
        onClose={() => setShowBotCreation(false)}
      />
    </div>
  );
}
