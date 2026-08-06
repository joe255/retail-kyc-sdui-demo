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
  'structured_address',
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

  it('never allows a requested upload or acceptance to be silently skipped', () => {
    const components = customers.flatMap((customer) => customer.screens.flatMap((screen) => screen.components))
    const uploads = components.filter((component) => component.type === 'upload')
    const declarations = components.filter((component) => component.type === 'declaration')
    expect(uploads.length).toBeGreaterThan(0)
    expect(uploads.every((component) => component.required)).toBe(true)
    expect(declarations.every((component) => component.required)).toBe(true)
  })

  it('gives every actionable screen an explicit required decision or input', () => {
    const actionable = customers.filter((customer) => customer.status === 'action_required')
    for (const customer of actionable) {
      for (const screen of customer.screens) {
        expect(
          screen.components.some((component) => component.required),
          `${customer.id}/${screen.id} has no required component`,
        ).toBe(true)
      }
    }
  })
})
