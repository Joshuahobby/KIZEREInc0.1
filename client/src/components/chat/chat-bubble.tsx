import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Message } from "@shared/schema";

interface ChatBubbleProps {
    message: Message;
    isMe: boolean;
    senderName?: string;
}

export function ChatBubble({ message, isMe, senderName }: ChatBubbleProps) {
    return (
        <div className={cn(
            "flex flex-col mb-4 max-w-[80%]",
            isMe ? "ml-auto items-end" : "mr-auto items-start"
        )}>
            {!isMe && senderName && (
                <span className="text-xs text-muted-foreground mb-1 ml-1">
                    {senderName}
                </span>
            )}
            <div className={cn(
                "px-4 py-2 rounded-2xl text-sm shadow-sm",
                isMe
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-muted-foreground rounded-tl-none border"
            )}>
                {message.content}
            </div>
            <div className="flex items-center mt-1 gap-1 px-1">
                <span className="text-[10px] text-muted-foreground">
                    {format(new Date(message.timestamp), "HH:mm")}
                </span>
                {isMe && (
                    <span className={cn(
                        "text-[10px]",
                        message.isRead ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                        {message.isRead ? "✓✓" : "✓"}
                    </span>
                )}
            </div>
        </div>
    );
}
