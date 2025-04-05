import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useState } from "react";
import { Bot, Chat } from "@shared/schema";

// App Context types
export type AppContextType = {
  activeBot: Bot | null;
  setActiveBot: (bot: Bot | null) => void;
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

// Create App Context
import { createContext, useContext } from "react";

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // App state
  const [activeBot, setActiveBot] = useState<Bot | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={{ 
        activeBot, 
        setActiveBot, 
        activeChat, 
        setActiveChat,
        sidebarOpen,
        setSidebarOpen
      }}>
        <Router />
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
