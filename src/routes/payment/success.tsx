import { createFileRoute } from '@tanstack/react-router'
import PaymentSuccess from '../../pages/payment/success'

export const Route = createFileRoute('/payment/success')({
  component: PaymentSuccess,
})