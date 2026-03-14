import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/api/messageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, RefreshCw, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatWindowProps {
  selectedUser: {
    _id: string;
    name: string;
    role: string;
  } | null;
}

const ChatWindow = ({ selectedUser }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!selectedUser) return;
    try {
      const data = await messageService.getMessages(selectedUser._id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setIsLoading(true);
      fetchMessages().finally(() => setIsLoading(false));
      
      const interval = setInterval(fetchMessages, 10000); // Polling every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser || isSending) return;

    setIsSending(true);
    try {
      const sentMsg = await messageService.sendMessage(selectedUser._id, newMessage);
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Send className="h-8 w-8 opacity-20" />
        </div>
        <h3 className="text-lg font-medium">Your Messages</h3>
        <p className="max-w-xs text-sm">Select an employee from the list to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {selectedUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-foreground">{selectedUser.name}</h3>
            <p className="text-xs text-muted-foreground capitalize font-medium">{selectedUser.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchMessages} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === user?.id;
              return (
                <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm text-sm",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none border"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.createdAt), 'hh:mm a')}
                  </span>
                </div>
              );
            })
          )}
          {isLoading && messages.length === 0 && (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
             </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4 bg-muted/20">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-background"
            autoFocus
          />
          <Button type="submit" disabled={!newMessage.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
