import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Loader2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble } from "./chat-bubble";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Message, type Chat } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
    chatId: number;
    onClose?: () => void;
    title: string;
}

export function ChatWindow({ chatId, onClose, title }: ChatWindowProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch chat and messages
    const { data: chatData, isLoading } = useQuery<Chat & { messages: Message[] }>({
        queryKey: [`/api/chats/${chatId}`],
        refetchInterval: 3000, // Poll every 3 seconds
    });

    // Mark as read when messages change and window is open
    useEffect(() => {
        if (chatData?.messages?.some(m => !m.isRead && m.senderId !== user?.id)) {
            apiRequest(`/api/chats/${chatId}/read`, { method: 'PATCH' }).then(() => {
                queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
            });
        }
    }, [chatData?.messages, chatId, user?.id]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatData?.messages]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            return apiRequest(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                data: { content }
            });
        },
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}`] });
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || sendMutation.isPending) return;
        sendMutation.mutate(message.trim());
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col h-[500px] w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden glass-morphism sticky bottom-4 right-4 z-50"
        >
            {/* Header */}
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold leading-none">{title}</h3>
                        <span className="text-[10px] opacity-70">Live Chat</span>
                    </div>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/10">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-neutral-50/50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="text-center mb-6">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white px-2 py-1 rounded-full border">
                                Chat started
                            </span>
                        </div>
                        {chatData?.messages?.slice().reverse().map((msg) => (
                            <ChatBubble
                                key={msg.id}
                                message={msg}
                                isMe={msg.senderId === user?.id}
                            />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                    disabled={sendMutation.isPending}
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || sendMutation.isPending}
                    className="shadow-md hover:scale-105 transition-transform"
                >
                    {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </motion.div>
    );
}
