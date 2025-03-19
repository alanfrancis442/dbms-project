"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { genereateAIResponse } from "@/lib/genai-service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  role: "user" | "bot";
  timestamp: Date;
}

export default function ChatBot({
  selectedDatabase,
  databaseConnection,
}: {
  selectedDatabase: string;
  databaseConnection: any;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Format previous messages for the AI
      const messageHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Call API with message history
      const response = await genereateAIResponse(
        userMessage.content,
        databaseConnection,
        selectedDatabase,
        messageHistory
      );

      // Add bot response - handle the new response format
      const botMessage: Message = {
        id: response.id || Date.now().toString(),
        content: response.content || "Sorry, I couldn't generate a response.",
        role: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, there was an error processing your request.",
        role: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">SQL Assistant</h2>
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
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {message.role === "user" ? "You" : "Assistant"}
                    </span>
                  </div>

                  {/* Render user message as plain text */}
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    /* Render bot message as markdown */
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Apply syntax highlighting for code blocks
                          code({
                            node,
                            //@ts-ignore
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return !inline && match ? (
                              <pre className="p-2 bg-zinc-800 text-zinc-100 rounded overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                          // Style tables
                          table({ node, ...props }) {
                            return (
                              <table
                                className="border-collapse border border-slate-300 my-4"
                                {...props}
                              />
                            );
                          },
                          th({ node, ...props }) {
                            return (
                              <th
                                className="border border-slate-300 p-2 bg-slate-100 dark:bg-slate-700"
                                {...props}
                              />
                            );
                          },
                          td({ node, ...props }) {
                            return (
                              <td
                                className="border border-slate-300 p-2"
                                {...props}
                              />
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
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
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            className="self-end"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
