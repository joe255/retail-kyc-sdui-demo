import { describe, expect, it } from 'vitest'
import { buildMetaModel } from './metaModel'

describe('retail KYC metamodel', () => {
  const model = buildMetaModel('test/1.0')

  it('splits every entity into one of the four required domains', () => {
    expect(model.domains.map((domain) => domain.id)).toEqual(['party', 'identity', 'relationship', 'assurance'])
    expect(model.entities.length).toBeGreaterThanOrEqual(25)
    expect(model.entities.every((entity) => model.domains.some((domain) => domain.id === entity.primaryDomain))).toBe(true)
  })

  it('marks handover and cross-cutting records with multiple domains', () => {
    const crossCutting = model.entities.filter((entity) => entity.domains.length > 1)
    expect(crossCutting.map((entity) => entity.name)).toEqual(expect.arrayContaining([
      'DATA_ASSERTION', 'EVIDENCE_OBJECT', 'RELATED_PARTY', 'CUSTOMER_ATTESTATION', 'RISK_RATING', 'AUDIT_EVENT',
    ]))
    expect(model.entities.find((entity) => entity.name === 'AUDIT_EVENT')?.domains).toHaveLength(4)
  })

  it('contains only resolvable relationships and documents temporal responsibilities', () => {
    const ids = new Set(model.entities.map((entity) => entity.id))
    expect(model.relationships.every((relationship) => ids.has(relationship.source) && ids.has(relationship.target))).toBe(true)
    expect(model.entities.filter((entity) => entity.temporalFields.length > 0).length).toBeGreaterThan(20)
  })
})
