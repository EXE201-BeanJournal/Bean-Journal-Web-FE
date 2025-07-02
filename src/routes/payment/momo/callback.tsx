import { createFileRoute } from '@tanstack/react-router'
import MoMoCallback from '../../../pages/payment/momo/callback'

export const Route = createFileRoute('/payment/momo/callback')({
  component: MoMoCallback,
})
