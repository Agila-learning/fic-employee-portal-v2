import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { messageService } from '@/api/messageService';
import { employeeService } from '@/api/employeeService';
import ChatWindow from '@/components/chat/ChatWindow';
import { cn, getInitials } from '@/lib/utils';

const EmployeeChat = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      setLoading(true);
      try {
        // Find the admin user
        const emps = await employeeService.getEmployees();
        // Typically admin has role 'admin'. Let's find one.
        // If the system has multiple admins, this might need refinement.
        // For now, let's assume we chat with the primary admin.
        // We can also fetch the chat list to see who we've talked to.
        const chats = await messageService.getChatList();
        const adminChat = chats.find(c => c.role === 'admin');
        
        if (adminChat) {
          setAdminUser(adminChat);
        } else {
          // If no chat history, find an admin from employee list
          // Assuming the getEmployees returns role info or we can find an admin
          // Actually, let's just use a placeholder if not found, 
          // but in this system there's usually an admin.
          const adminFromList = emps.find(e => e.role === 'admin' || e.designation?.toLowerCase().includes('admin'));
          if (adminFromList) {
            setAdminUser({
              _id: adminFromList.user_id?._id || adminFromList.user_id || adminFromList._id,
              name: adminFromList.name,
              role: 'admin'
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin info', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  return (
    <DashboardLayout requiredRole="employee">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Chat
          </h1>
          <p className="text-muted-foreground text-sm">Chat with the Administrator</p>
        </div>

        <Card className="flex-1 overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardContent className="p-0 flex h-full">
            {/* Sidebar (Fixed for Employee - only Admin) */}
            <div className="w-full md:w-80 border-r flex flex-col bg-muted/10">
              <div className="p-4 border-b font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Admin Support
              </div>

              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                  </div>
                ) : adminUser ? (
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors bg-primary/10 border-l-4 border-primary"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {getInitials(adminUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        <ShieldCheck className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{adminUser.name}</p>
                      <Badge variant="outline" className="text-[10px] h-4 bg-primary/5 border-primary/20 text-primary">Admin</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No admin found.
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="hidden md:flex flex-1">
              <ChatWindow selectedUser={adminUser} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeChat;
