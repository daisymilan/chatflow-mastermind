
import { useState } from "react";
import { ChatMessage as ChatMessageComponent } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage, CommandType } from "@/types/chat";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const N8N_WEBHOOK_URL = "https://n8n.servenorobot.com/webhook/social-media-post";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    content: `Welcome! I can help you create and manage social media posts. Try these commands:

/create-post - Start new social media post creation
/templates - List available Canva templates
/platforms - Show available social media platforms
/status - Check post status
/help - Show available commands`,
    type: "bot",
    timestamp: new Date(),
  },
];

const COMMANDS: Record<CommandType, string> = {
  "/create-post": "Let's create a new social media post. What type of post would you like to create? (product showcase, promotional offer, or company update)",
  "/templates": "Here are the available Canva templates...",
  "/platforms": "Available platforms: Instagram, Facebook, TikTok",
  "/status": "Checking your post status...",
  "/help": `Available commands:
/create-post - Start new social media post creation
/templates - List available Canva templates
/platforms - Show available social media platforms
/status - Check post status
/help - Show this help message`,
};

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      type: "user",
      timestamp: new Date(),
      command: content.startsWith("/") ? content as CommandType : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Handle commands
    if (content.startsWith("/")) {
      const command = content as CommandType;
      if (COMMANDS[command]) {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: COMMANDS[command],
          type: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } else {
        toast({
          title: "Unknown Command",
          description: "Type /help to see available commands",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      </div>
      <ChatInput onSendMessage={handleSendMessage} disabled={isProcessing} />
    </div>
  );
};

export default Index;
