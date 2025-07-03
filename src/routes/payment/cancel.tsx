import { createFileRoute } from '@tanstack/react-router'
import PaymentCancel from '../../pages/payment/cancel'

export const Route = createFileRoute('/payment/cancel')({
  component: PaymentCancel,
})
