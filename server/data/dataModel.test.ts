import { describe, expect, it } from 'vitest'
import { buildCustomerDataModel } from './dataModel'
import { customers } from './customers'

describe('populated customer data models', () => {
  it('builds a connected, field-populated model for every synthetic customer', () => {
    for (const customer of customers) {
      const model = buildCustomerDataModel(customer)
      const nodeIds = new Set(model.nodes.map((node) => node.id))
      expect(model.nodes.length, customer.id).toBeGreaterThanOrEqual(9)
      expect(model.edges.length, customer.id).toBeGreaterThanOrEqual(8)
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

  it('materialises connected people as Party and Person records', () => {
    const noahModel = buildCustomerDataModel(customers.find((customer) => customer.id === 'noah-klein')!)
    expect(noahModel.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ entity: 'RELATED_PARTY', recordLabel: expect.stringContaining('Eva Klein') }),
      expect.objectContaining({ entity: 'PARTY', recordLabel: expect.stringContaining('Eva Klein') }),
      expect.objectContaining({ entity: 'PERSON', recordLabel: 'Eva Klein' }),
    ]))
    expect(noahModel.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'related-party', target: 'connected-party' }),
      expect.objectContaining({ source: 'connected-party', target: 'connected-person' }),
    ]))
  })

  it('separates and marks the primary customer records from connected people', () => {
    const jointModel = buildCustomerDataModel(customers.find((customer) => customer.id === 'anna-max')!)
    expect(jointModel.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'person', recordLabel: 'Anna Gruber', emphasis: 'primary' }),
      expect.objectContaining({ id: 'party', emphasis: 'primary' }),
      expect.objectContaining({ id: 'customer', emphasis: 'primary' }),
      expect.objectContaining({ id: 'business-relationship', emphasis: 'primary' }),
      expect.objectContaining({ id: 'connected-person', recordLabel: 'Max Gruber', emphasis: 'connected' }),
    ]))
  })

  it('materialises evidence provenance and the complete retail review lifecycle', () => {
    const requiredEntities = [
      'DATA_SOURCE', 'EVIDENCE_OBJECT', 'DATA_ASSERTION', 'ASSERTION_EVIDENCE', 'CUSTOMER_ATTESTATION',
      'CDD_REVIEW', 'CDD_CASE', 'CDD_REQUIREMENT', 'DATA_REQUEST', 'DATA_SUBMISSION', 'AUDIT_EVENT',
    ]
    for (const customer of customers) {
      const model = buildCustomerDataModel(customer)
      const entities = model.nodes.map((record) => record.entity)
      expect(entities, customer.id).toEqual(expect.arrayContaining(requiredEntities))
      expect(model.edges, customer.id).toEqual(expect.arrayContaining([
        expect.objectContaining({ source: 'data-source', target: 'evidence-object' }),
        expect.objectContaining({ source: 'evidence-object', target: 'assertion-evidence' }),
        expect.objectContaining({ source: 'customer', target: 'cdd-case' }),
        expect.objectContaining({ source: 'cdd-case', target: 'cdd-requirement' }),
        expect.objectContaining({ source: 'data-request', target: 'data-submission' }),
      ]))
    }
  })

  it('exposes structured past and future dates plus evidence health', () => {
    const isoDate = /^\d{4}-\d{2}-\d{2}$/
    for (const customer of customers) {
      const model = buildCustomerDataModel(customer)
      expect(model.timeline.lastCustomerUpdateAt, customer.id).toMatch(isoDate)
      expect(model.timeline.lastEvidenceVerifiedAt, customer.id).toMatch(isoDate)
      expect(model.timeline.lastReviewCompletedAt, customer.id).toMatch(isoDate)
      expect(model.timeline.lastMaterialEventAt, customer.id).toMatch(isoDate)
      expect(model.timeline.nextPeriodicReviewDueAt, customer.id).toMatch(isoDate)
      if (customer.status === 'complete') expect(model.timeline.nextActionDueAt, customer.id).toBeNull()
      else expect(model.timeline.nextActionDueAt, customer.id).toMatch(isoDate)
      expect(Object.values(model.evidenceSummary).reduce((sum, count) => sum + count, 0), customer.id).toBeGreaterThan(0)
    }
  })
})
