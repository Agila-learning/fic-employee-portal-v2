import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cake, Calendar, Search, Gift, PartyPopper, Users, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { employeeService } from '@/api/employeeService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isSameMonth } from 'date-fns';
import { getInitials } from '@/lib/utils';

const BirthdayList = ({ role }: { role: 'admin' | 'employee' }) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const data = await employeeService.getEmployees();
                const activeEmployees = Array.isArray(data) ? data.filter(e => e.is_active !== false) : [];
                const withBirthdays = activeEmployees.filter((emp: any) => emp.dob)
                    .sort((a: any, b: any) => {
                        const dateA = new Date(a.dob);
                        const dateB = new Date(b.dob);
                        return dateA.getMonth() - dateB.getMonth() || dateA.getDate() - dateB.getDate();
                    });
                setEmployees(withBirthdays);
            } catch (error) {
                console.error('Failed to fetch employees', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const todayBirthdays = filteredEmployees.filter(emp => isToday(new Date(emp.dob)));
    const monthBirthdays = filteredEmployees.filter(emp => isSameMonth(new Date(emp.dob), new Date()) && !isToday(new Date(emp.dob)));

    return (
        <DashboardLayout requiredRole={role}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Cake className="h-6 w-6 text-purple-500" />
                            Birthday Calendar
                        </h1>
                        <p className="text-muted-foreground">Celebrate our team members' special days</p>
                    </div>
                    {role === 'admin' && (
                        <Link to="/admin/employees">
                            <Button className="gradient-primary flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Manage Employees
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or department..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Today's Celebrations */}
                        {todayBirthdays.length > 0 && (
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-purple-600">
                                    <PartyPopper className="h-5 w-5" /> Today's Birthdays
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {todayBirthdays.map((emp) => (
                                        <Card key={emp._id} className="border-purple-200 bg-purple-50/50 shadow-md animate-bounce-subtle">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                                        {getInitials(emp.name)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">{emp.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                                                        <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700">Birthday Today! 🎂</Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Upcoming this Month */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-500" /> Upcoming this Month
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {monthBirthdays.map((emp) => (
                                    <Card key={emp._id} className="hover:border-indigo-300 transition-colors">
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                                                    {getInitials(emp.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate">{emp.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Gift className="h-3 w-3" /> {format(new Date(emp.dob), 'MMMM do')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {monthBirthdays.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No other birthdays this month.</p>
                                )}
                            </div>
                        </section>

                        {/* Rest of the Team */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold">All Birthdays</h3>
                            <div className="rounded-xl border border-border/50 overflow-hidden">
                                <div className="grid grid-cols-1 divide-y divide-border/50">
                                    {filteredEmployees.map((emp) => (
                                        <div key={emp._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold ring-1 ring-border">
                                                    {getInitials(emp.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{emp.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs">
                                                <p className="font-semibold">{format(new Date(emp.dob), 'MMM do')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BirthdayList;
