import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed';

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  automaticOpen?: boolean;
}

export function useWebSocket(chatId?: number, options: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const socket = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimerId = useRef<number | null>(null);

  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    automaticOpen = true
  } = options;

  const connect = useCallback(() => {
    if (socket.current?.readyState === WebSocket.OPEN) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    setStatus('connecting');
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = (event) => {
      setStatus('open');
      reconnectCount.current = 0;
      
      // Join chat room if chatId is provided
      if (chatId && socket.current) {
        socket.current.send(JSON.stringify({ 
          type: 'join', 
          chatId 
        }));
      }
      
      if (onOpen) onOpen(event);
    };

    socket.current.onmessage = (event) => {
      if (onMessage) onMessage(event);
    };

    socket.current.onclose = (event) => {
      setStatus('closed');
      
      if (onClose) onClose(event);
      
      // Attempt to reconnect if not closed manually
      if (reconnectCount.current < reconnectAttempts && !event.wasClean) {
        reconnectCount.current += 1;
        if (reconnectTimerId.current) window.clearTimeout(reconnectTimerId.current);
        reconnectTimerId.current = window.setTimeout(connect, reconnectInterval);
      }
    };

    socket.current.onerror = (event) => {
      if (onError) onError(event);
    };
  }, [chatId, onOpen, onMessage, onClose, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (!socket.current) return;
    
    // Clear any pending reconnect
    if (reconnectTimerId.current) {
      window.clearTimeout(reconnectTimerId.current);
      reconnectTimerId.current = null;
    }
    
    if (socket.current.readyState === WebSocket.OPEN) {
      setStatus('closing');
      socket.current.close();
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Connect on mount if automaticOpen is true
  useEffect(() => {
    if (automaticOpen) {
      connect();
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, automaticOpen]);

  // Reconnect when chatId changes
  useEffect(() => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN && chatId) {
      socket.current.send(JSON.stringify({ 
        type: 'join', 
        chatId 
      }));
    }
  }, [chatId]);

  return {
    status,
    connect,
    disconnect,
    sendMessage
  };
}
