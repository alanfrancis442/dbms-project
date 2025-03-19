"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: isAgentMode 
          ? `Agent mode response to: ${input.trim()}`
          : `Normal mode response to: ${input.trim()}`,
        role: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const toggleMode = () => {
    setIsAgentMode(!isAgentMode);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">SQL Assistant</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isAgentMode ? 'Agent Mode' : 'Normal Mode'}
          </span>
          <Switch checked={isAgentMode} onCheckedChange={toggleMode} />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Ask something about SQL!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "mb-4 flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === 'user' 
                      ? <User className="h-4 w-4" /> 
                      : <Bot className="h-4 w-4" />
                    }
                    <span className="text-xs">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="resize-none min-h-[80px]"
          />
          <Button 
            onClick={handleSendMessage} 
            className="self-end"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
