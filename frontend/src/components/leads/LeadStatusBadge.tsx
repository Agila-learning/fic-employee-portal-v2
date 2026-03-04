import { Badge } from '@/components/ui/badge';
import { LeadStatus, PaymentStage, STATUS_OPTIONS, PAYMENT_STAGE_OPTIONS } from '@/types';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  paymentStage?: PaymentStage | null;
}

const statusVariantMap: Record<LeadStatus, 'nc1' | 'nc2' | 'nc3' | 'followUp' | 'success' | 'converted' | 'rejected' | 'notInterested' | 'notInterestedPaid' | 'differentDomain'> = {
  nc1: 'nc1',
  nc2: 'nc2',
  nc3: 'nc3',
  follow_up: 'followUp',
  success: 'success',
  converted: 'converted',
  rejected: 'rejected',
  not_interested: 'notInterested',
  not_interested_paid: 'notInterestedPaid',
  different_domain: 'differentDomain',
};

const LeadStatusBadge = ({ status, paymentStage }: LeadStatusBadgeProps) => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status);
  const variant = statusVariantMap[status];
  const paymentStageLabel = paymentStage ? PAYMENT_STAGE_OPTIONS.find(p => p.value === paymentStage)?.label : null;

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={variant}>
        {statusOption?.label || status}
      </Badge>
      {paymentStage && status === 'converted' && (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          {paymentStageLabel}
        </span>
      )}
    </div>
  );
};

export default LeadStatusBadge;
