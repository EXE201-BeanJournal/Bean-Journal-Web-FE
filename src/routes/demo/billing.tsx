import { createFileRoute } from '@tanstack/react-router';
import { BillingDemo } from '@/pages/demo/billing';

export const Route = createFileRoute('/demo/billing')({
  component: BillingDemo,
});
