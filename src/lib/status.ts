import type { CustomerScenario, CustomerStatus } from '../types/sdui'

export const statusLabel: Record<CustomerStatus, string> = {
  action_required: 'Action required',
  under_review: 'Under review',
  complete: 'Complete',
  restricted: 'Restricted',
}

export const statusOrder: CustomerStatus[] = [
  'action_required',
  'under_review',
  'complete',
  'restricted',
]

export function countByStatus(customers: CustomerScenario[]) {
  return statusOrder.reduce<Record<CustomerStatus, number>>(
    (result, status) => {
      result[status] = customers.filter((customer) => customer.status === status).length
      return result
    },
    { action_required: 0, under_review: 0, complete: 0, restricted: 0 },
  )
}

export function customerProgress(customer: CustomerScenario, currentScreen: number) {
  if (!customer.screens.length) return 100
  return Math.round(((currentScreen + 1) / customer.screens.length) * 100)
}
