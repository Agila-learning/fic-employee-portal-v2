import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Loader2, MessageSquare } from 'lucide-react';
import { messageService } from '@/api/messageService';
import { employeeService } from '@/api/employeeService';
import ChatWindow from '@/components/chat/ChatWindow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AdminChat = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [chatList, setChatList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empData, chats] = await Promise.all([
          employeeService.getEmployees(),
          messageService.getChatList()
        ]);
        setEmployees(empData || []);
        setChatList(chats || []);
      } catch (error) {
        console.error('Failed to fetch chat data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole="admin">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Messages
          </h1>
          <p className="text-muted-foreground text-sm">Chat with employees individually</p>
        </div>

        <Card className="flex-1 overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardContent className="p-0 flex h-full">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r flex flex-col bg-muted/10">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search employees..." 
                    className="pl-9 h-9 text-xs bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {filteredEmployees.map((emp) => {
                      const chatInfo = chatList.find(c => c._id === (emp.user_id?._id || emp.user_id || emp._id));
                      const isSelected = selectedUser?._id === (emp.user_id?._id || emp.user_id || emp._id);
                      
                      return (
                        <div 
                          key={emp._id}
                          className={cn(
                            "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-primary/5",
                            isSelected && "bg-primary/10 border-l-4 border-primary"
                          )}
                          onClick={() => setSelectedUser({
                            _id: emp.user_id?._id || emp.user_id || emp._id,
                            name: emp.name,
                            role: emp.department || 'Employee'
                          })}
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {emp.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold truncate">{emp.name}</p>
                              {chatInfo && (
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(chatInfo.lastMessageTime), 'HH:mm')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {chatInfo ? chatInfo.lastMessage : (emp.department || 'Employee')}
                              </p>
                              {chatInfo?.isUnread && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1">
              <ChatWindow selectedUser={selectedUser} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminChat;
