import { describe, expect, it } from 'vitest'
import { countByStatus, customerProgress } from './status'
import type { CustomerScenario } from '../types/sdui'

const makeCustomer = (status: CustomerScenario['status']): CustomerScenario => ({
  id: status,
  initials: 'TS',
  name: 'Test Scenario',
  age: 30,
  bookingEntity: 'Northstar Bank NL',
  product: 'Everyday account',
  segment: 'Retail',
  risk: 'Low',
  status,
  scenario: 'Test',
  nextAction: 'Review',
  dueLabel: 'Today',
  lastReview: '1 Jan 2026',
  relationshipSince: '2024',
  tags: [],
  screens: [
    { id: 'one', eyebrow: 'One', title: 'One', description: '', reason: '', primaryAction: 'Next', components: [] },
    { id: 'two', eyebrow: 'Two', title: 'Two', description: '', reason: '', primaryAction: 'Done', components: [] },
  ],
})

describe('presentation helpers', () => {
  it('counts customer states', () => {
    const result = countByStatus([
      makeCustomer('action_required'),
      makeCustomer('action_required'),
      makeCustomer('complete'),
    ])
    expect(result.action_required).toBe(2)
    expect(result.complete).toBe(1)
    expect(result.under_review).toBe(0)
  })

  it('reports journey progress', () => {
    const customer = makeCustomer('action_required')
    expect(customerProgress(customer, 0)).toBe(50)
    expect(customerProgress(customer, 1)).toBe(100)
  })
})
