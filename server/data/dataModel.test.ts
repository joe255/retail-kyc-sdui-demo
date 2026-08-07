import { describe, expect, it } from 'vitest'
import { buildCustomerDataModel } from './dataModel'
import { customers } from './customers'

describe('populated customer data models', () => {
  it('builds a connected, field-populated model for every synthetic customer', () => {
    for (const customer of customers) {
      const model = buildCustomerDataModel(customer)
      const nodeIds = new Set(model.nodes.map((node) => node.id))
      expect(model.nodes.length, customer.id).toBeGreaterThanOrEqual(9)
      expect(model.edges.length, customer.id).toBeGreaterThanOrEqual(9)
      expect(model.nodes.every((node) => node.fields.length > 0), customer.id).toBe(true)
      expect(model.nodes.every((node) => node.fields.every((field) => field.name && field.value)), customer.id).toBe(true)
      expect(model.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)), customer.id).toBe(true)
    }
  })

  it('preserves the canonical Party → Customer → Relationship backbone', () => {
    const model = buildCustomerDataModel(customers[0])
    expect(model.nodes.map((node) => node.entity)).toEqual(expect.arrayContaining([
      'PARTY', 'PERSON', 'ADDRESS', 'NATIONALITY', 'CUSTOMER', 'BUSINESS_RELATIONSHIP', 'CDD_CHECKLIST', 'RISK_RATING',
    ]))
    expect(model.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'party', target: 'customer' }),
      expect.objectContaining({ source: 'customer', target: 'business-relationship' }),
    ]))
  })

  it('adds scenario-specific compliance records', () => {
    const entitiesFor = (customerId: string) => buildCustomerDataModel(customers.find((customer) => customer.id === customerId)!).nodes.map((node) => node.entity)
    expect(entitiesFor('lukas-weber')).toContain('IDENTITY_DOCUMENT')
    expect(entitiesFor('victor-santos')).toContain('SCREENING_HIT')
    expect(entitiesFor('elias-petrov')).toContain('WEALTH_EVIDENCE')
    expect(entitiesFor('karim-aziz')).toContain('ALTERNATE_NAME')
  })
})
