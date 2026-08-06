import { describe, expect, it } from 'vitest'
import { customers } from './customers'

const supportedTypes = new Set([
  'notice',
  'field_review',
  'input',
  'select',
  'choice',
  'comparison',
  'upload',
  'declaration',
  'relationship',
  'transaction_profile',
  'verification',
  'summary',
])

describe('synthetic SDUI portfolio', () => {
  it('contains a broad retail presentation set', () => {
    expect(customers.length).toBeGreaterThanOrEqual(15)
    expect(new Set(customers.map((customer) => customer.status))).toEqual(
      new Set(['action_required', 'under_review', 'complete', 'restricted']),
    )
    expect(new Set(customers.map((customer) => customer.risk))).toEqual(
      new Set(['Low', 'Standard', 'High']),
    )
  })

  it('uses unique ids and only registered component types', () => {
    const customerIds = customers.map((customer) => customer.id)
    expect(new Set(customerIds).size).toBe(customerIds.length)

    for (const customer of customers) {
      expect(customer.screens.length).toBeGreaterThan(0)
      const screenIds = customer.screens.map((screen) => screen.id)
      expect(new Set(screenIds).size).toBe(screenIds.length)

      for (const screen of customer.screens) {
        const componentIds = screen.components.map((component) => component.id)
        expect(new Set(componentIds).size).toBe(componentIds.length)
        for (const component of screen.components) {
          expect(supportedTypes.has(component.type)).toBe(true)
        }
      }
    }
  })
})
