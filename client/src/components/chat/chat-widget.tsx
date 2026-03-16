import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Paths where the chat widget should always be visible (Support & Dashboard)
const ALWAYS_VISIBLE_PATHS = [
    "/dashboard",
    "/community",
    "/contact",
    "/help",
    "/support"
];

interface Chat {
    id: number;
    claimId: number;
    reportId: number;
    finderId: number;
    claimantId: number;
    messages?: Message[];
}

interface Message {
    id: number;
    chatId: number;
    senderId: number;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export function ChatWidget() {
    const { user } = useAuth();
    const [location] = useLocation();
    const { joinChat, leaveChat, sendTyping, onEvent } = useSocket();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch user's chats
    const { data: chats } = useQuery<Chat[]>({
        queryKey: ["/api/chats"],
        enabled: !!user, // Always check for chats if logged in to handle visibility
    });

    // URL param handling: auto-open if chatId is in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlChatId = params.get('chatId');
        if (urlChatId) {
            setIsOpen(true);
            setActiveChatId(parseInt(urlChatId));
        }
    }, [window.location.search]);

    // Visibility logic
    const isAlwaysVisiblePath = ALWAYS_VISIBLE_PATHS.includes(location);
    const hasActiveChats = chats && chats.length > 0;
    const shouldShow = isAlwaysVisiblePath || hasActiveChats || isOpen;

    // Fetch active chat messages

    // Fetch active chat messages
    const { data: activeChat } = useQuery<Chat>({
        queryKey: [`/api/chats/${activeChatId}`],
        enabled: !!activeChatId,
        refetchInterval: false,
    });

    // Listen for real-time messages
    useEffect(() => {
        const cleanup = onEvent("chat:message", (message: Message) => {
            // Invalidate the active chat query to get new messages
            if (message.chatId === activeChatId) {
                queryClient.invalidateQueries({ queryKey: [`/api/chats/${activeChatId}`] });
            }
            // Also invalidate the chat list for unread indicators
            queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
        });
        return cleanup;
    }, [onEvent, activeChatId, queryClient]);

    // Listen for typing
    useEffect(() => {
        const cleanup = onEvent("chat:typing", (data: { userId: number; isTyping: boolean }) => {
            if (data.userId !== user?.id) {
                setIsTyping(data.isTyping);
            }
        });
        return cleanup;
    }, [onEvent, user]);

    // Join/leave chat room
    useEffect(() => {
        if (activeChatId) {
            joinChat(activeChatId);
            return () => leaveChat(activeChatId);
        }
    }, [activeChatId, joinChat, leaveChat]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeChat?.messages]);

    // Send message mutation
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            return apiRequest(`/api/chats/${activeChatId}/messages`, {
                method: "POST",
                data: { content }
            });
        },
        onSuccess: () => {
            setMessageInput("");
            queryClient.invalidateQueries({ queryKey: [`/api/chats/${activeChatId}`] });
        },
    });

    const handleSend = () => {
        if (!messageInput.trim() || !activeChatId) return;
        sendMessage.mutate(messageInput.trim());
        sendTyping(activeChatId, false);
    };

    const handleInputChange = (value: string) => {
        setMessageInput(value);
        if (activeChatId) {
            sendTyping(activeChatId, true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(activeChatId, false);
            }, 2000);
        }
    };

    if (!user || !shouldShow) return null;

    return (
        <>
            {/* Floating button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed z-50"
                        style={{ bottom: '1.5rem', left: '1.5rem' }}
                    >
                        <Button
                            size="lg"
                            className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
                            onClick={() => setIsOpen(true)}
                        >
                            <MessageCircle className="h-6 w-6" />
                        </Button>
                        {chats && chats.length > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                {chats.length}
                            </Badge>
                        )}
                    </motion.div>
                )}
            </AnimatePresence >

            {/* Chat Panel */}
            <AnimatePresence>
                {
                    isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed z-50 w-[380px] max-w-[calc(100vw-3rem)] max-h-[500px] flex flex-col"
                            style={{ bottom: '1.5rem', left: '1.5rem' }}
                        >
                            <Card className="shadow-2xl border-border/50 flex flex-col h-[500px]">
                                <CardHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        {activeChatId ? `Chat #${activeChatId}` : "Messages"}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        {activeChatId && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveChatId(null)}>
                                                <Minimize2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsOpen(false); setActiveChatId(null); }}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                                    {!activeChatId ? (
                                        /* Chat List */
                                        <ScrollArea className="flex-1">
                                            {chats && chats.length > 0 ? (
                                                <div className="divide-y">
                                                    {chats.map((chat) => (
                                                        <button
                                                            key={chat.id}
                                                            className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                                                            onClick={() => setActiveChatId(chat.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9">
                                                                    <AvatarFallback className="text-xs">C{chat.claimId}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">
                                                                        Claim #{chat.claimId}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        Report #{chat.reportId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                                    <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                                    <p className="text-sm text-muted-foreground">No active chats</p>
                                                    <p className="text-xs text-muted-foreground/70 mt-1">Start a chat from a claim page</p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    ) : (
                                        /* Active Chat */
                                        <>
                                            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                                <div className="space-y-3">
                                                    {activeChat?.messages?.map((msg) => {
                                                        const isMe = msg.senderId === user.id;
                                                        return (
                                                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                                                <div className={cn(
                                                                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                                                    isMe
                                                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                                                        : "bg-muted rounded-bl-sm"
                                                                )}>
                                                                    {msg.content}
                                                                    <p className={cn("text-[10px] mt-1 opacity-60", isMe ? "text-right" : "text-left")}>
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {isTyping && (
                                                        <div className="flex justify-start">
                                                            <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground italic">
                                                                typing...
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>

                                            {/* Input area */}
                                            <div className="p-3 border-t flex items-center gap-2 shrink-0">
                                                <Input
                                                    placeholder="Type a message..."
                                                    value={messageInput}
                                                    onChange={(e) => handleInputChange(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                                    className="flex-1 rounded-full"
                                                />
                                                <Button
                                                    size="icon"
                                                    className="rounded-full h-9 w-9 shrink-0"
                                                    onClick={handleSend}
                                                    disabled={!messageInput.trim() || sendMessage.isPending}
                                                >
                                                    {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </>
    );
}
