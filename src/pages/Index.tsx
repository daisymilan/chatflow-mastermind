import { useState } from "react";
import { ChatMessage as ChatMessageComponent } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage, CommandType, PostRequest } from "@/types/chat";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const PROXY_URL = "/api/proxy";

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

const TEMPLATES = [
  { id: "https://www.canva.com/design/DAGfDeZzMpA/MQ5X3mBx_RjTX1HbyVYmJA/view?utm_content=DAGfDeZzMpA&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview", name: "Navigating Template" },
  { id: "https://www.canva.com/design/DAGe_IUdrY0/SMjJ7yuBBcyyii9q2QwC9A/view?utm_content=DAGe_IUdrY0&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview", name: "Connect template" },
  { id: "https://www.canva.com/design/DAGfh0eGtZQ/j0bxHFUyXOtPdmJiSGijoA/view?utm_content=DAGfh0eGtZQ&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview", name: "Birthday Template" }
];

const PLATFORMS = ["Instagram", "Facebook", "TikTok"];

interface PostCreationState {
  step: number;
  postType?: string;
  postDetails?: string;
  targetPlatforms?: string[];
  canvaTemplateLink?: string;
  companyTone?: string;
}

const COMMANDS: Record<CommandType, string> = {
  "/create-post": "Let's create a new social media post. What type of post would you like to create?\n\n1. Product showcase\n2. Promotional offer\n3. Company update",
  "/templates": `Available Canva templates:\n${TEMPLATES.map((t) => `• ${t.name}`).join("\n")}`,
  "/platforms": `Available platforms:\n${PLATFORMS.map((p) => `• ${p}`).join("\n")}`,
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
  const [postCreation, setPostCreation] = useState<PostCreationState | null>(null);

  const addBotMessage = (content: string) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      type: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handlePostCreationStep = async (message: string) => {
    if (!postCreation) return;

    switch (postCreation.step) {
      case 1: // Post type
        const postType = message.toLowerCase();
        if (!["product showcase", "promotional offer", "company update"].includes(postType)) {
          addBotMessage("Please select a valid post type: product showcase, promotional offer, or company update");
          return;
        }
        setPostCreation({
          ...postCreation,
          step: 2,
          postType,
        });

        setIsProcessing(true);
        try {
          const response = await fetch(PROXY_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ prompt: `Give me details for a ${postType} social media post.` }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          addBotMessage(data.details); // Assuming the response has a "details" field
          addBotMessage("Great! Now, please provide the details for your post.");
        } catch (error) {
          console.error('Error sending request:', error);
          toast({
            title: "Error",
            description: "Failed to get post details. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
        break;

      case 2: // Post details
        setPostCreation({
          ...postCreation,
          step: 3,
          postDetails: message,
        });
        addBotMessage(`Select target platforms (comma-separated):\n${PLATFORMS.join(", ")}`);
        break;

      case 3: // Platforms
        const platforms = message.split(",").map((p) => p.trim());
        const validPlatforms = platforms.every((p) => PLATFORMS.includes(p));
        if (!validPlatforms) {
          addBotMessage("Please select valid platforms");
          return;
        }
        setPostCreation({
          ...postCreation,
          step: 4,
          targetPlatforms: platforms,
        });
        addBotMessage(`Select a template:\n${TEMPLATES.map((t, i) => `${i + 1}. ${t.name}`).join("\n")}`);
        break;

      case 4: // Template
        const templateIndex = parseInt(message) - 1;
        if (isNaN(templateIndex) || templateIndex < 0 || templateIndex >= TEMPLATES.length) {
          addBotMessage("Please select a valid template number");
          return;
        }
        setPostCreation({
          ...postCreation,
          step: 5,
          canvaTemplateLink: TEMPLATES[templateIndex].id,
        });
        addBotMessage("Finally, describe your company's tone (formal, casual, playful):");
        break;

      case 5: // Company tone
        const postRequest: PostRequest = {
          postType: postCreation.postType!,
          postDetails: postCreation.postDetails!,
          targetPlatforms: postCreation.targetPlatforms!,
          canvaTemplateLink: postCreation.canvaTemplateLink!,
          companyTone: message,
        };

        setIsProcessing(true);
        try {
          const response = await fetch(PROXY_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(postRequest),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          addBotMessage("Your post has been submitted for creation! Use /status to check its progress.");
          console.log('Response from proxy server:', data);
          setPostCreation(null);
        } catch (error) {
          console.error('Error sending request:', error);
          toast({
            title: "Error",
            description: "Failed to create post. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
        break;
    }
  };

    const handleSendMessage = async (content: string) => {
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            content,
            type: "user",
            timestamp: new Date(),
            command: content.startsWith("/") ? content as CommandType : undefined,
        };

        setMessages((prev) => [...prev, userMessage]);

        if (content.startsWith("/")) {
            const command = content as CommandType;
            if (command === "/create-post") {
                setPostCreation({ step: 1 });
            }
            if (COMMANDS[command]) {
                addBotMessage(COMMANDS[command]);
            } else {
                toast({
                    title: "Unknown Command",
                    description: "Type /help to see available commands",
                    variant: "destructive",
                });
            }
        } else if (postCreation) {
            await handlePostCreationStep(content);
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
