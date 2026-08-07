import type { MetaModelDomain, MetaModelDomainId, MetaModelEntity, MetaModelPayload, MetaModelRelationship } from '../../src/types/sdui'

export const metaModelDomains: MetaModelDomain[] = [
  { id: 'party', label: 'Party master', description: 'Canonical people, aliases and relationships shared across the group.', order: 0 },
  { id: 'identity', label: 'Identity facts', description: 'Person attributes, addresses, assertions and reusable identity evidence.', order: 1 },
  { id: 'relationship', label: 'Customer relationship', description: 'Booking-entity customers, products, attestations and submissions.', order: 2 },
  { id: 'assurance', label: 'CDD and evidence', description: 'Cases, requirements, verification, risk, decisions and immutable controls.', order: 3 },
]

const entity = (
  name: string,
  purpose: string,
  primaryDomain: MetaModelDomainId,
  domains: MetaModelDomainId[],
  keyFields: string[],
  temporalFields: string[] = [],
): MetaModelEntity => ({ id: name.toLowerCase().replaceAll('_', '-'), name, purpose, primaryDomain, domains, keyFields, temporalFields })

export const metaModelEntities: MetaModelEntity[] = [
  entity('PARTY', 'Canonical group identity for any person with legal capacity.', 'party', ['party'], ['party_id', 'party_type', 'pep_status'], ['first_known_on', 'merged_at']),
  entity('ALTERNATE_NAME', 'Aliases, former names, scripts and transliterations used for identification and screening.', 'party', ['party', 'identity'], ['name_id', 'party_id', 'name_type', 'full_name'], ['used_from', 'used_until']),
  entity('RELATED_PARTY', 'A person acting for, represented by or otherwise connected to a retail customer.', 'relationship', ['party', 'relationship'], ['related_party_id', 'customer_id', 'party_id', 'relationship'], ['valid_from', 'valid_until']),

  entity('PERSON', 'Natural-person attributes attached one-to-one to the canonical Party.', 'identity', ['party', 'identity'], ['party_id', 'given_name', 'family_name', 'birth_date']),
  entity('ADDRESS', 'Versioned residential, postal and contactable addresses.', 'identity', ['identity'], ['address_id', 'party_id', 'address_type', 'country'], ['valid_from', 'valid_until', 'last_confirmed_at']),
  entity('CONTACT_POINT', 'Versioned email and telephone contact points with confirmation state.', 'identity', ['party', 'identity'], ['contact_id', 'party_id', 'contact_type', 'normalised_value'], ['valid_from', 'valid_until', 'confirmed_at', 'next_review_due']),
  entity('NATIONALITY', 'All nationalities and protected status declarations held by a person.', 'identity', ['identity'], ['nationality_id', 'party_id', 'country', 'is_verified'], ['verified_at']),
  entity('TAX_RESIDENCY', 'Country-specific tax residence, TIN and declaration status kept separately from nationality.', 'identity', ['identity', 'assurance'], ['tax_residency_id', 'party_id', 'country', 'tax_id_number'], ['declared_at', 'verified_at', 'valid_until', 'next_review_due']),
  entity('DATA_ASSERTION', 'Immutable, source-aware assertion for one canonical attribute value.', 'identity', ['party', 'identity'], ['assertion_id', 'party_id', 'attribute_path', 'normalised_value'], ['effective_from', 'effective_until', 'recorded_at', 'last_confirmed_at', 'next_review_due']),
  entity('DATA_SOURCE', 'Reusable assessment of the authority, quality and reliability of a source.', 'identity', ['identity', 'assurance'], ['source_id', 'source_type', 'is_public_authority'], ['assessed_on', 'reassessment_due']),
  entity('EVIDENCE_OBJECT', 'Immutable document, registry response, electronic identity result or declaration.', 'identity', ['identity', 'assurance'], ['evidence_id', 'party_id', 'source_id', 'evidence_type'], ['issued_at', 'received_at', 'verified_at', 'valid_until', 'retention_until']),
  entity('ASSERTION_EVIDENCE', 'Many-to-many assessment connecting an assertion to the evidence supporting it.', 'identity', ['identity', 'assurance'], ['link_id', 'assertion_id', 'evidence_id', 'sufficiency_decision'], ['assessed_at']),
  entity('IDENTITY_DOCUMENT', 'Document-specific attributes required for identity-document controls.', 'identity', ['identity', 'assurance'], ['document_id', 'party_id', 'document_type', 'document_number'], ['expires_on', 'keep_until']),
  entity('IDENTITY_CHECK', 'A performed identity or authority verification and its reproducible result.', 'identity', ['identity', 'assurance'], ['check_id', 'party_id', 'document_id', 'source_id', 'result'], ['source_data_dated', 'performed_at', 'keep_until']),

  entity('CUSTOMER', 'Booking-entity view of a Party and its local CDD status.', 'relationship', ['party', 'relationship'], ['customer_id', 'party_id', 'booking_entity', 'status'], ['onboarded_on', 'verification_deadline', 'next_review_due', 'exited_on']),
  entity('BUSINESS_RELATIONSHIP', 'Product, purpose, expected use and expected transaction profile.', 'relationship', ['relationship'], ['relationship_id', 'customer_id', 'product_or_service', 'engagement_type'], ['opened_on', 'purpose_confirmed_on', 'closed_on']),
  entity('VIRTUAL_IBAN', 'Virtual account identifier and the underlying account it resolves to.', 'relationship', ['relationship'], ['viban_id', 'relationship_id', 'user_party_id', 'virtual_iban'], ['underlying_opened_on', 'underlying_closed_on']),
  entity('CUSTOMER_ATTESTATION', 'Versioned authenticated confirmation or correction made by the customer.', 'relationship', ['relationship', 'assurance'], ['attestation_id', 'customer_id', 'party_id', 'statement_version'], ['signed_at', 'next_confirmation_due']),
  entity('DATA_SUBMISSION', 'Authenticated response package submitted against a data request.', 'relationship', ['relationship', 'assurance'], ['submission_id', 'request_id', 'customer_id', 'status'], ['submitted_at', 'accepted_at']),

  entity('CDD_CASE', 'Booking-entity review container created by a schedule, event or control trigger.', 'assurance', ['relationship', 'assurance'], ['case_id', 'customer_id', 'case_type', 'status'], ['opened_at', 'due_at', 'closed_at']),
  entity('CDD_REQUIREMENT', 'Atomic information, evidence, verification or approval obligation inside a case.', 'assurance', ['relationship', 'assurance'], ['requirement_id', 'case_id', 'requirement_type', 'status'], ['raised_at', 'due_at', 'completed_at']),
  entity('DATA_REQUEST', 'Customer-facing request generated from one or more requirements.', 'assurance', ['relationship', 'assurance'], ['request_id', 'case_id', 'requirement_id', 'request_scope'], ['requested_at', 'due_at', 'expired_at']),
  entity('CDD_CHECKLIST', 'Derived current completeness state across the required CDD domains.', 'assurance', ['relationship', 'assurance'], ['customer_id', 'identity_of_customer', 'open_gaps', 'is_complete'], ['completed_on', 'recalculated_at']),
  entity('CDD_REVIEW', 'Completed or pending periodic and event-driven reassessment.', 'assurance', ['relationship', 'assurance'], ['review_id', 'customer_id', 'triggered_by', 'outcome'], ['performed_at', 'next_due']),
  entity('CDD_DECISION', 'Responsible-entity accept, restrict, refuse or terminate decision.', 'assurance', ['relationship', 'assurance'], ['decision_id', 'customer_id', 'decision', 'rationale'], ['decided_at']),
  entity('RISK_RATING', 'Reproducible customer or relationship risk result and model version.', 'assurance', ['relationship', 'assurance'], ['rating_id', 'customer_id', 'relationship_id', 'risk'], ['rated_at', 'next_rating_due']),
  entity('RELIANCE', 'Controlled reliance on a group entity or supervised third party without transferring responsibility.', 'assurance', ['relationship', 'assurance'], ['reliance_id', 'customer_id', 'counterparty_party_id', 'status'], ['last_confirmed_on', 'next_confirmation_due']),
  entity('WATCHLIST_VERSION', 'Immutable sanctions, PEP or internal-list version used for reproducible screening.', 'assurance', ['assurance'], ['watchlist_id', 'list_type', 'list_name', 'version_label'], ['published_at', 'loaded_at']),
  entity('SCREENING_BATCH', 'Screening run, population coverage and list version used.', 'assurance', ['party', 'assurance'], ['batch_id', 'watchlist_id', 'screening_for', 'covered_roles'], ['started_at', 'finished_at']),
  entity('MISSING_DATA_ITEM', 'Explicit unresolved gap with remediation ownership and resolution state.', 'assurance', ['identity', 'assurance'], ['missing_id', 'party_id', 'customer_id', 'missing_field'], ['raised_on', 'due_at', 'resolved_on']),
  entity('SCREENING_HIT', 'Potential sanctions, PEP or adverse-media match and its resolution.', 'assurance', ['party', 'assurance'], ['hit_id', 'party_id', 'batch_id', 'status'], ['raised_at', 'resolved_at']),
  entity('EDD_FINDING', 'Narrative enhanced-due-diligence assessment and resolution.', 'assurance', ['relationship', 'assurance'], ['finding_id', 'customer_id', 'covers', 'concern_resolved'], ['recorded_at', 'resolved_at']),
  entity('WEALTH_EVIDENCE', 'Source-of-funds or source-of-wealth explanation and lawful-origin judgement.', 'assurance', ['relationship', 'assurance'], ['evidence_id', 'party_id', 'customer_id', 'covers'], ['obtained_at', 'assessed_at']),
  entity('AUDIT_EVENT', 'Immutable actor, channel and correlation history for every material change.', 'assurance', ['party', 'identity', 'relationship', 'assurance'], ['event_id', 'party_id', 'customer_id', 'event_type'], ['occurred_at', 'recorded_at']),
]

const relationship = (source: string, target: string, label: string, cardinality: string): MetaModelRelationship => ({
  id: `${source}-${target}`,
  source: source.toLowerCase().replaceAll('_', '-'),
  target: target.toLowerCase().replaceAll('_', '-'),
  label,
  cardinality,
})

export const metaModelRelationships: MetaModelRelationship[] = [
  relationship('PARTY', 'PERSON', 'specialises as', '1 : 0..1'),
  relationship('PARTY', 'ALTERNATE_NAME', 'is known by', '1 : 0..*'),
  relationship('PARTY', 'CONTACT_POINT', 'is contacted through', '1 : 0..*'),
  relationship('PARTY', 'TAX_RESIDENCY', 'declares', '1 : 0..*'),
  relationship('PARTY', 'DATA_ASSERTION', 'owns fact', '1 : 0..*'),
  relationship('PARTY', 'RELATED_PARTY', 'participates as', '1 : 0..*'),
  relationship('DATA_SOURCE', 'EVIDENCE_OBJECT', 'produces', '1 : 0..*'),
  relationship('EVIDENCE_OBJECT', 'ASSERTION_EVIDENCE', 'supports through', '1 : 0..*'),
  relationship('DATA_ASSERTION', 'ASSERTION_EVIDENCE', 'is supported by', '1 : 0..*'),
  relationship('IDENTITY_DOCUMENT', 'IDENTITY_CHECK', 'is used in', '1 : 0..*'),
  relationship('DATA_ASSERTION', 'CUSTOMER', 'is reused by', '0..* : 0..*'),
  relationship('CUSTOMER', 'RELATED_PARTY', 'has around it', '1 : 0..*'),
  relationship('CUSTOMER', 'BUSINESS_RELATIONSHIP', 'holds', '1 : 0..*'),
  relationship('BUSINESS_RELATIONSHIP', 'VIRTUAL_IBAN', 'may issue', '1 : 0..*'),
  relationship('CUSTOMER', 'CUSTOMER_ATTESTATION', 'confirms through', '1 : 0..*'),
  relationship('CUSTOMER', 'CDD_CASE', 'is reviewed in', '1 : 0..*'),
  relationship('BUSINESS_RELATIONSHIP', 'RISK_RATING', 'is rated by', '1 : 0..*'),
  relationship('CUSTOMER', 'RELIANCE', 'may rely through', '1 : 0..*'),
  relationship('CUSTOMER_ATTESTATION', 'CDD_REQUIREMENT', 'satisfies', '0..* : 0..*'),
  relationship('CDD_CASE', 'CDD_REQUIREMENT', 'contains', '1 : 1..*'),
  relationship('CDD_REQUIREMENT', 'DATA_REQUEST', 'is served as', '1..* : 0..*'),
  relationship('DATA_REQUEST', 'DATA_SUBMISSION', 'is answered by', '1 : 0..*'),
  relationship('DATA_SUBMISSION', 'AUDIT_EVENT', 'is recorded as', '1 : 1..*'),
  relationship('CUSTOMER', 'CDD_CHECKLIST', 'is measured by', '1 : 1'),
  relationship('CDD_CHECKLIST', 'CDD_REVIEW', 'is reassessed in', '1 : 0..*'),
  relationship('CDD_REVIEW', 'CDD_DECISION', 'results in', '1 : 0..1'),
  relationship('CDD_CASE', 'MISSING_DATA_ITEM', 'tracks', '1 : 0..*'),
  relationship('CDD_CASE', 'EDD_FINDING', 'records', '1 : 0..*'),
  relationship('CDD_CASE', 'WEALTH_EVIDENCE', 'collects', '1 : 0..*'),
  relationship('WATCHLIST_VERSION', 'SCREENING_BATCH', 'is used by', '1 : 0..*'),
  relationship('SCREENING_BATCH', 'SCREENING_HIT', 'raises', '1 : 0..*'),
  relationship('PARTY', 'SCREENING_HIT', 'may match', '1 : 0..*'),
]

export function buildMetaModel(contractVersion: string): MetaModelPayload {
  return {
    contractVersion,
    generatedAt: '2026-08-07T00:00:00.000Z',
    domains: metaModelDomains,
    entities: metaModelEntities,
    relationships: metaModelRelationships,
  }
}
