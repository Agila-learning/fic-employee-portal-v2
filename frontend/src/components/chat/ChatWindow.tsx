import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/api/messageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, RefreshCw, Loader2, Paperclip, Mic, X, Image as ImageIcon, File as FileIcon, Download, Play, Square, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn, safeParseDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
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
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      
      const interval = setInterval(fetchMessages, 5000); // Polling every 5 seconds for better UX
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, extraData: any = {}) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !extraData.fileUrl && !isSending) return;

    setIsSending(true);
    try {
      const sentMsg = await messageService.sendMessage(selectedUser!._id, newMessage, extraData);
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadRes = await messageService.uploadFile(file);
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      await handleSend(undefined, {
        messageType,
        fileUrl: uploadRes.url,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize
      });
      toast.success('File sent');
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
          const uploadRes = await messageService.uploadFile(audioFile);
          await handleSend(undefined, {
            messageType: 'voice',
            fileUrl: uploadRes.url,
            duration: recordingTime
          });
        } catch (error) {
          toast.error('Voice message failed');
        } finally {
          setIsUploading(false);
          setRecordingTime(0);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.messageType) {
      case 'image':
        return (
          <div className="space-y-2">
            <img 
              src={msg.fileUrl} 
              alt={msg.fileName} 
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
              onClick={() => window.open(msg.fileUrl, '_blank')}
            />
            {msg.content && <p>{msg.content}</p>}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 bg-background/20 p-2 rounded-lg border border-white/10">
            <FileIcon className="h-8 w-8 text-primary-foreground/80" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{msg.fileName}</p>
              <p className="text-[10px] opacity-70">{(msg.fileSize! / 1024).toFixed(1)} KB</p>
            </div>
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Download className="h-4 w-4" />
            </a>
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Play className="h-4 w-4 fill-current" />
            <audio controls className="h-8 w-full filter invert brightness-200">
               <source src={msg.fileUrl} type="audio/webm" />
            </audio>
          </div>
        );
      default:
        return <div>{msg.content}</div>;
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/10 border-l border-white/5">
        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 animate-pulse">
          <MessageSquare className="h-10 w-10 text-primary/20" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Select a Conversation</h3>
        <p className="max-w-xs text-sm opacity-60">Pick an employee from the list to start chatting or view previous messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card border-l border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 bg-muted/30 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                {selectedUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-card rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{selectedUser.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{selectedUser.role}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={fetchMessages} disabled={isLoading} className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all">
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-0 bg-[#0b141a]/5 dark:bg-[#0b141a]/40">
        <div className="flex flex-col p-4 space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-sm italic">No messages yet. Send a greeting!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender === user?.id;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              
              const currentMsgDate = safeParseDate(msg.createdAt);
              const prevMsgDate = prevMsg ? safeParseDate(prevMsg.createdAt) : null;
              const nextMsgDate = nextMsg ? safeParseDate(nextMsg.createdAt) : null;

              const isStartOfGroup = !prevMsgDate || prevMsg.sender !== msg.sender || currentMsgDate.getTime() - prevMsgDate.getTime() > 60000;
              const isEndOfGroup = !nextMsgDate || nextMsg.sender !== msg.sender || nextMsgDate.getTime() - currentMsgDate.getTime() > 60000;
              
              const showTimeHeader = !prevMsgDate || currentMsgDate.getTime() - prevMsgDate.getTime() > 3600000; // 1 hour

              return (
                <div key={msg._id} className="flex flex-col">
                  {showTimeHeader && (
                    <div className="w-full flex justify-center my-6">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-muted/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                         {format(currentMsgDate, 'EEEE, MMM d')}
                       </span>
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex w-full mb-0.5",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "flex flex-col max-w-[75%] md:max-w-[70%] group relative",
                      isMe ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "relative px-3.5 py-2 shadow-sm transition-all duration-200",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                          : "bg-card text-foreground rounded-2xl rounded-tl-sm border border-border/40",
                        !isStartOfGroup && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl"),
                        !isEndOfGroup && (isMe ? "rounded-br-sm" : "rounded-bl-sm")
                      )}>
                        {renderMessageContent(msg)}
                        
                        <div className={cn(
                          "flex items-center gap-1 mt-1 justify-end",
                          isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        )}>
                          <span className="text-[9px] font-medium uppercase">
                            {format(currentMsgDate, 'hh:mm a')}
                          </span>
                          {isMe && (
                            <div className="flex ml-0.5">
                              {msg.isRead ? (
                                <div className="relative w-3.5 h-3.5">
                                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full stroke-[#4fc3f7]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 13l3 3 7-7" />
                                    <path d="M2 13l3 3 7-7" transform="translate(4,0)" />
                                  </svg>
                                </div>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 13l3 3 7-7" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isLoading && messages.length === 0 && (
             <div className="flex items-center justify-center py-20">
               <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
             </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-muted/10 border-t border-white/5">
        <form onSubmit={handleSend} className="relative">
          <div className={cn(
            "flex items-end gap-2 p-2 bg-background/50 backdrop-blur-xl rounded-2xl border transition-all duration-300 shadow-inner",
            isRecording ? "border-primary ring-2 ring-primary/20" : "border-white/10"
          )}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRecording}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-4 h-9 bg-primary/5 rounded-xl animate-pulse">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                   <div className="h-2 w-2 bg-primary rounded-full animate-ping" />
                   Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive h-7 hover:bg-destructive/10"
                  onClick={stopRecording}
                >
                  <Square className="h-3 w-3 mr-1 fill-current" /> Stop
                </Button>
              </div>
            ) : (
              <Input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-none focus-visible:ring-0 bg-transparent h-9 min-h-[36px] px-2 shadow-none"
                autoFocus
                disabled={isUploading}
              />
            )}

            {!newMessage.trim() && !isRecording ? (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={startRecording}
                disabled={isUploading}
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="h-9 w-9 shrink-0 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                disabled={!newMessage.trim() || isSending || isUploading}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
