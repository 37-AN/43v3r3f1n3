import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConsoleMessage } from '@/components/Console';

interface ConsoleContextType {
  messages: ConsoleMessage[];
  addMessage: (type: ConsoleMessage['type'], message: string) => void;
  clearMessages: () => void;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  const addMessage = useCallback((type: ConsoleMessage['type'], message: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ConsoleContext.Provider value={{ messages, addMessage, clearMessages }}>
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (context === undefined) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return context;
}