
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === "bot";

  return (
    <div
      className={cn(
        "flex w-full gap-2 p-4",
        isBot ? "bg-muted/50" : "bg-background"
      )}
    >
      <div className={cn("flex-1", !isBot && "flex justify-end")}>
        <div
          className={cn(
            "rounded-lg p-4",
            isBot
              ? "bg-background border border-border"
              : "bg-primary text-primary-foreground"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
