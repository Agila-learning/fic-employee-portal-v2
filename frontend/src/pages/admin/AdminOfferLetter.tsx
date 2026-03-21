import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeOfferLetterForm from '@/components/admin/EmployeeOfferLetterForm';

const AdminOfferLetter = () => {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Offer Letter Generator</h1>
            <p className="text-muted-foreground mt-1">Generate and manage professional offer letters</p>
          </div>
        </div>

        <Tabs defaultValue="employee" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="candidate" className="px-6">Candidate Offer Letter</TabsTrigger>
            <TabsTrigger value="employee" className="px-6">Employee Offer Letter</TabsTrigger>
          </TabsList>
          
          <TabsContent value="candidate" className="mt-0">
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm" style={{ height: 'calc(100vh - 250px)' }}>
              <iframe
                src="https://offer-letter-generator-xi.vercel.app/"
                className="w-full h-full border-0"
                title="Candidate Offer Letter Generator"
                allow="clipboard-write"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="employee" className="mt-0">
            <EmployeeOfferLetterForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminOfferLetter;
