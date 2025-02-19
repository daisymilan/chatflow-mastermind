import { useState } from "react";
import { ChatMessage as ChatMessageComponent } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage, CommandType, PostRequest } from "@/types/chat";
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

const TEMPLATES = [
  { id: "template1", name: "Navigating Template" },
  { id: "template2", name: "Connect template" },
  { id: "template3", name: "Birthday Template" }
];


const PLATFORMS = ["Instagram", "Facebook", "TikTok"];

interface PostCreationState {
  step: number;
  postType?: string;
  postDetails?: string;
  targetPlatforms?: string[];
  templateKey?: string;
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
          canvaTemplateLink: postCreation.canvaTemplateLink // Keep the canvaTemplateLink
        });

        setIsProcessing(true);
        try {
          const requestBody = JSON.stringify({ 
            prompt: `Give me details for a ${postType} social media post.`,
            canvaTemplateLink: postCreation.canvaTemplateLink // Send the canvaTemplateLink
          });
          console.log("Sending request to n8n with body:", requestBody);

          const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: requestBody,
          });

          console.log("n8n response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("n8n response body:", errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }

          const data = await response.json();
          console.log("n8n response data:", data);
          if (data && data.details) {
            addBotMessage(data.details); // Assuming the response has a "details" field
          } else {
            addBotMessage("Received an empty response from the server.");
          }
          addBotMessage("Great! Now, please provide the details for your post.");
        } catch (error: any) {
          console.error('Error sending request:', error);
          toast({
            title: "Error",
            description: `Failed to get post details. Please try again. ${error.message}`,
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
          templateKey: TEMPLATES[templateIndex].id,
        });
        addBotMessage("Finally, describe your company's tone (formal, casual, playful):");
        break;
      
      case 5: // Company tone
        const postRequest: PostRequest = {
          postType: postCreation.postType!,
          postDetails: postCreation.postDetails!,
          targetPlatforms: postCreation.targetPlatforms!,
          templateKey: postCreation.templateKey!,
          companyTone: message,
        };
      
        setIsProcessing(true);
        try {
          const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(postRequest),
          });
      

          if (!response.ok) {
            const errorText = await response.text();
            console.error("n8n response body:", errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }

          const data = await response.json();
          addBotMessage("Your post has been submitted for creation! Use /status to check its progress.");
          console.log('Response from n8n:', data);
          setPostCreation(null);
        } catch (error: any) {
          console.error('Error sending request:', error);
          toast({
            title: "Error",
            description: `Failed to create post. Please try again. ${error.message}`,
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
            setPostCreation({ step: 1, templateKey: "" }); // Initialize templateKey
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
