import { HelpCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is the difference between 'Converted' and 'Success' status?",
    answer: "'Converted' means the lead has shown interest and registration/payment process has started. A lead is marked as 'Success' automatically when 'Full Payment Done' is selected in the payment stage. This indicates the complete conversion of the lead."
  },
  {
    question: "How does the Follow-up system work?",
    answer: "When you set a lead status to 'Follow Up', you can schedule a specific date and time to contact them. You'll receive reminders when the follow-up is due. Each lead allows a maximum of 6 follow-up date changes. After 6 attempts, the lead must be rejected or closed to proceed."
  },
  {
    question: "What are the different Lead Statuses?",
    answer: "NC1, NC2, NC3 are 'Not Connected' attempts. 'Follow Up' is for scheduled callbacks. 'Converted' is when payment process starts. 'Success' is full payment done. 'Rejected', 'Not Interested', 'Not Interested (Paid)' are closure statuses."
  },
  {
    question: "How do I upload documents for a lead?",
    answer: "When editing a lead, you can upload resumes (PDF, DOC, DOCX) and payment slips (PDF, PNG, JPG, JPEG). Payment slip upload is mandatory when selecting 'Initial Payment Done' or 'Full Payment Done' stages."
  },
  {
    question: "What is the 6 Follow-up Limit?",
    answer: "To ensure lead quality and focus, each lead allows a maximum of 6 follow-up date changes. A visual indicator shows remaining attempts. Once exhausted, you must either convert or reject the lead to proceed with other tasks."
  },
  {
    question: "How do I mark attendance?",
    answer: "Go to your dashboard and find the Attendance Card. You can mark yourself as 'Present' or 'Leave' before 11:00 AM daily. If marking leave, you must provide a reason. Once marked, attendance cannot be changed for that day."
  },
  {
    question: "What are the Payment Stages?",
    answer: "'Registration Done' - Initial signup complete. 'Initial Payment Done' - Partial payment received (requires payment slip). 'Full Payment Done' - Complete payment received (auto-upgrades to Success status)."
  },
  {
    question: "How do I contact support?",
    answer: "For any queries or assistance, go to Settings > Help & Support and send an email to info@forgeindiaconnect.com. Our team will respond within 24-48 hours."
  }
];

const FAQSection = () => {
  return (
    <Card className="border-border/50 overflow-hidden animate-fade-in">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-700 dark:text-blue-300">Frequently Asked Questions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
              <AccordionTrigger className="text-sm font-medium text-left hover:text-primary transition-colors py-3">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-3 pt-1 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FAQSection;
