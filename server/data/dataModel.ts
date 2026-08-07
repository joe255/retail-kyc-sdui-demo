import type {
  CustomerDataModel,
  CustomerScenario,
  DataModelEdge,
  DataModelField,
  DataModelFieldState,
  DataModelNode,
} from '../../src/types/sdui'

const nationalityByCustomer: Record<string, string> = {
  'emma-berger': 'Austrian', 'lukas-weber': 'German', 'sofia-marin': 'Spanish', 'amira-haddad': 'Austrian',
  'daniel-novak': 'Austrian, Czech', 'helena-vogt': 'German', 'victor-santos': 'Spanish', 'noah-klein': 'Austrian',
  'anna-max': 'Austrian', 'elias-petrov': 'German', 'mia-fischer': 'Austrian', 'oliver-dubois': 'French',
  'clara-rossi': 'Italian', 'jakob-stein': 'German', 'lea-horvat': 'Croatian', 'karim-aziz': 'Dutch',
}

const DEMO_TODAY = '2026-08-07'
const monthNumber: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

const materialEventByCustomer: Record<string, string> = {
  'emma-berger': '2026-07-28', 'lukas-weber': '2026-08-06', 'sofia-marin': '2026-07-21', 'amira-haddad': '2026-06-18',
  'daniel-novak': '2026-08-06', 'helena-vogt': '2026-08-07', 'victor-santos': '2026-08-06', 'noah-klein': '2026-08-06',
  'anna-max': '2026-08-06', 'elias-petrov': '2026-08-05', 'mia-fischer': '2026-08-06', 'oliver-dubois': '2026-08-06',
  'clara-rossi': '2026-08-06', 'jakob-stein': '2026-07-31', 'lea-horvat': '2026-08-05', 'karim-aziz': '2026-08-02',
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function addYears(isoDate: string, years: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function completedReviewDate(customer: CustomerScenario) {
  if (customer.lastReview === 'Initial onboarding') return /^\d{4}$/.test(customer.relationshipSince) ? `${customer.relationshipSince}-01-01` : DEMO_TODAY
  const [day, month, year] = customer.lastReview.split(' ')
  return `${year}-${monthNumber[month]}-${day.padStart(2, '0')}`
}

function actionDueDate(customer: CustomerScenario) {
  if (customer.status === 'complete') return null
  const dueIn = customer.dueLabel.match(/Due in (\d+) days/)
  const overdueBy = customer.dueLabel.match(/Overdue by (\d+) days/)
  if (dueIn) return addDays(DEMO_TODAY, Number(dueIn[1]))
  if (overdueBy) return addDays(DEMO_TODAY, -Number(overdueBy[1]))
  if (customer.dueLabel === 'Due today' || customer.dueLabel === 'Onboarding paused') return DEMO_TODAY
  if (customer.dueLabel === 'Usually within 24 hours') return addDays(DEMO_TODAY, 1)
  if (customer.dueLabel === 'Operations review') return addDays(DEMO_TODAY, 2)
  if (customer.dueLabel === 'One holder remaining') return addDays(DEMO_TODAY, 3)
  return DEMO_TODAY
}

function buildTimeline(customer: CustomerScenario): CustomerDataModel['timeline'] {
  const lastReviewCompletedAt = completedReviewDate(customer)
  const reviewIntervalYears = customer.risk === 'High' ? 1 : 5
  return {
    lastCustomerUpdateAt: lastReviewCompletedAt,
    lastEvidenceVerifiedAt: lastReviewCompletedAt,
    lastReviewCompletedAt,
    lastMaterialEventAt: materialEventByCustomer[customer.id] ?? lastReviewCompletedAt,
    nextActionDueAt: actionDueDate(customer),
    nextPeriodicReviewDueAt: addYears(lastReviewCompletedAt, reviewIntervalYears),
    nextAction: customer.nextAction,
  }
}

const node = (
  id: string,
  entity: string,
  recordLabel: string,
  layer: DataModelNode['layer'],
  state: DataModelFieldState,
  fields: DataModelField[],
  emphasis: DataModelNode['emphasis'] = 'supporting',
): DataModelNode => ({ id, entity, recordLabel, layer, state, fields, emphasis })

const edge = (source: string, target: string, label: string, cardinality: string): DataModelEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  label,
  cardinality,
})

const id = (name: string, value: string, key: DataModelField['key'], state: DataModelFieldState = 'verified'): DataModelField => ({ name, value, key, state })
const value = (name: string, fieldValue: string, state: DataModelFieldState = 'current'): DataModelField => ({ name, value: fieldValue, state })

function scenarioRecords(customer: CustomerScenario, partyId: string, customerId: string) {
  const records: { nodes: DataModelNode[]; edges: DataModelEdge[] } = { nodes: [], edges: [] }
  const add = (scenarioNode: DataModelNode, from: string, label: string, cardinality = '1 : 0..*') => {
    records.nodes.push(scenarioNode)
    records.edges.push(edge(from, scenarioNode.id, label, cardinality))
  }

  switch (customer.id) {
    case 'lukas-weber':
      add(node('identity-document', 'IDENTITY_DOCUMENT', 'Passport P•••••482', 'assurance', 'pending', [
        id('document_id', 'DOC-482', 'PK'), id('party_id', partyId, 'FK'), value('document_type', 'passport'),
        value('issued_by_country', 'Germany'), value('expires_on', '2026-08-18', 'pending'), value('checked_for_tampering', 'true'),
      ]), 'party', 'showed us')
      add(node('missing-document', 'MISSING_DATA_ITEM', 'Replacement identity document', 'assurance', 'missing', [
        id('missing_id', 'GAP-ID-01', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('missing_field', 'valid identity document', 'missing'), value('being_fixed_by', 'awaiting customer', 'pending'), value('raised_on', '2026-08-06'),
      ]), 'party', 'has a gap in')
      break
    case 'sofia-marin':
      add(node('missing-address', 'MISSING_DATA_ITEM', 'Residential address confirmation', 'assurance', 'pending', [
        id('missing_id', 'GAP-ADDR-01', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('missing_field', 'residence address'), value('why_missing', 'returned customer mail', 'pending'), value('being_fixed_by', 'customer confirmation'),
      ]), 'party', 'has a gap in')
      break
    case 'amira-haddad':
      add(node('address-conflict', 'ADDRESS', 'Insurance-source assertion', 'identity', 'changed', [
        id('address_id', 'ADDR-ALT-44', 'PK'), id('party_id', partyId, 'FK'), value('address_type', 'residence'),
        value('country', 'Austria'), value('city', 'Vienna'), value('street', 'Mariahilfer Straße 88', 'changed'), value('valid_from', '2025-09-03'),
      ]), 'party', 'also reported at')
      break
    case 'daniel-novak':
      add(node('missing-tax-id', 'MISSING_DATA_ITEM', 'Tax identifier gap', 'assurance', 'missing', [
        id('missing_id', 'GAP-TAX-01', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('missing_field', 'tax ID', 'missing'), value('why_missing', 'customer has not provided'), value('action_note', 'collect TIN and US tax status', 'pending'),
      ]), 'party', 'has a gap in')
      break
    case 'helena-vogt':
      add(node('edd-finding', 'EDD_FINDING', 'Public-function assessment', 'assurance', 'pending', [
        id('finding_id', 'EDD-PEP-17', 'PK'), id('customer_id', customerId, 'FK'), value('covers', 'reputation and intended nature'),
        value('finding', 'Potential prominent public function requires confirmation', 'pending'), value('concern_resolved', 'false', 'pending'), value('recorded_by', 'PEP screening service'),
      ]), 'customer', 'escalated by')
      add(node('wealth-evidence', 'WEALTH_EVIDENCE', 'Source-of-wealth request', 'assurance', 'missing', [
        id('evidence_id', 'WE-PEP-17', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('covers', 'source of wealth'), value('evidence_type', 'awaiting customer', 'missing'), value('satisfied_lawful_origin', 'not assessed', 'pending'),
      ]), 'party', 'explained by')
      break
    case 'victor-santos':
      add(node('screening-hit', 'SCREENING_HIT', 'Potential sanctions match', 'assurance', 'pending', [
        id('hit_id', 'HIT-2026-884', 'PK'), id('party_id', partyId, 'FK'), value('party_role', 'customer'),
        value('listed_entry_ref', 'WL-ES-884'), value('status', 'open', 'pending'), value('raised_at', '2026-08-06T08:14Z'),
      ]), 'party', 'flagged in')
      break
    case 'noah-klein':
      records.nodes.push(node('related-party', 'RELATED_PARTY', 'Eva Klein · mother', 'relationship', 'verified', [
        id('related_party_id', 'RP-NK-01', 'PK'), id('customer_id', customerId, 'FK'), id('party_id', 'PTY-EVA-KLEIN', 'FK'), value('relationship', 'legal representative'),
        value('authority_granted_by', 'parental guardianship'), value('what_they_may_do', 'approve and operate youth account'), value('authority_evidence_ref', 'CR-1842'),
      ], 'connected'))
      records.nodes.push(node('connected-party', 'PARTY', 'Eva Klein · representative', 'party', 'verified', [
        id('party_id', 'PTY-EVA-KLEIN', 'PK'), value('party_type', 'person'), value('pep_status', 'not a PEP'), value('first_known_on', '2021-09-14'), value('merged_into_party_id', 'null'),
      ], 'connected'))
      records.nodes.push(node('connected-person', 'PERSON', 'Eva Klein', 'identity', 'verified', [
        id('party_id', 'PTY-EVA-KLEIN', 'PK/FK'), value('given_name', 'Eva'), value('family_name', 'Klein'), value('birth_date', '1988-06-09'), value('birth_country', 'Austria'), value('is_minor', 'false'),
      ], 'connected'))
      records.edges.push(edge('customer', 'related-party', 'has around it', '1 : 0..*'))
      records.edges.push(edge('related-party', 'connected-party', 'references', '1 : 1'))
      records.edges.push(edge('connected-party', 'connected-person', 'if an individual', '1 : 0..1'))
      break
    case 'anna-max':
      records.nodes.push(node('related-party', 'RELATED_PARTY', 'Max Gruber · joint holder', 'relationship', 'verified', [
        id('related_party_id', 'RP-AG-02', 'PK'), id('customer_id', customerId, 'FK'), id('party_id', 'PTY-MAX-GRUBER', 'FK'), value('relationship', 'joint account holder'),
        value('what_they_may_do', 'transact independently'), value('valid_from', '2022-04-12'), value('authority_evidence_ref', 'joint mandate JM-2204'),
      ], 'connected'))
      records.nodes.push(node('connected-party', 'PARTY', 'Max Gruber · joint holder', 'party', 'verified', [
        id('party_id', 'PTY-MAX-GRUBER', 'PK'), value('party_type', 'person'), value('pep_status', 'not a PEP'), value('first_known_on', '2022-04-12'), value('merged_into_party_id', 'null'),
      ], 'connected'))
      records.nodes.push(node('connected-person', 'PERSON', 'Max Gruber', 'identity', 'verified', [
        id('party_id', 'PTY-MAX-GRUBER', 'PK/FK'), value('given_name', 'Max'), value('family_name', 'Gruber'), value('birth_date', '1984-01-28'), value('birth_country', 'Austria'), value('is_minor', 'false'),
      ], 'connected'))
      records.edges.push(edge('customer', 'related-party', 'has around it', '1 : 0..*'))
      records.edges.push(edge('related-party', 'connected-party', 'references', '1 : 1'))
      records.edges.push(edge('connected-party', 'connected-person', 'if an individual', '1 : 0..1'))
      break
    case 'elias-petrov':
      add(node('wealth-evidence', 'WEALTH_EVIDENCE', 'Expected €185,000 transfer', 'assurance', 'missing', [
        id('evidence_id', 'WE-EP-185', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('covers', 'source of funds'), value('amount_explained', '€185,000'), value('evidence_type', 'awaiting supporting document', 'missing'), value('satisfied_lawful_origin', 'not assessed', 'pending'),
      ]), 'party', 'explained by')
      break
    case 'mia-fischer':
      add(node('missing-occupation', 'MISSING_DATA_ITEM', 'Employment profile refresh', 'assurance', 'missing', [
        id('missing_id', 'GAP-OCC-04', 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
        value('missing_field', 'employer and occupation sector', 'missing'), value('why_missing', 'salary origin changed'), value('being_fixed_by', 'customer update', 'pending'),
      ]), 'party', 'has a gap in')
      break
    case 'oliver-dubois':
      add(node('cdd-review', 'CDD_REVIEW', 'Expected activity review', 'assurance', 'pending', [
        id('review_id', 'REV-OD-26', 'PK'), id('customer_id', customerId, 'FK'), value('triggered_by', 'unusual activity'),
        value('nothing_relevant_changed', 'false'), value('outcome', 'awaiting customer update', 'pending'), value('next_due', '2027-08-06'),
      ]), 'customer', 'reviewed')
      break
    case 'clara-rossi':
      add(node('identity-check', 'IDENTITY_CHECK', 'Remote identity capture', 'assurance', 'pending', [
        id('check_id', 'IDC-CR-09', 'PK'), id('party_id', partyId, 'FK'), value('what_was_verified', 'identity'),
        value('method', 'remote capture'), value('was_remote', 'true'), value('result', 'inconclusive', 'pending'), value('performed_at', '2026-08-06T07:42Z'),
      ]), 'party', 'was checked by')
      break
    case 'jakob-stein':
      add(node('cdd-review', 'CDD_REVIEW', 'Periodic five-year review', 'assurance', 'pending', [
        id('review_id', 'REV-JS-05', 'PK'), id('customer_id', customerId, 'FK'), value('triggered_by', 'schedule'),
        value('no_triggering_event', 'true'), value('outcome', 'customer confirmation required', 'pending'), value('next_due', '2031-08-06'),
      ]), 'customer', 'reviewed')
      break
    case 'lea-horvat':
      records.nodes.push(node('duplicate-party', 'PARTY', 'Duplicate record', 'party', 'changed', [
        id('party_id', 'PTY-LEA-DUP-02', 'PK'), value('party_type', 'person'), value('first_known_on', '2025-11-18'),
        value('merged_into_party_id', partyId, 'changed'),
      ], 'connected'))
      records.edges.push(edge('duplicate-party', 'party', 'merged into', '1 : 1'))
      break
    case 'karim-aziz':
      add(node('alternate-name', 'ALTERNATE_NAME', 'Arabic-script name', 'identity', 'verified', [
        id('name_id', 'NAME-KA-AR', 'PK'), id('party_id', partyId, 'FK'), value('name_type', 'original script'),
        value('full_name', 'كريم عزيز'), value('script', 'Arabic'), value('include_in_screening', 'true'),
      ]), 'party', 'also known as')
      break
    default:
      add(node('cdd-decision', 'CDD_DECISION', 'Latest customer decision', 'assurance', 'verified', [
        id('decision_id', 'DEC-EB-26', 'PK'), id('customer_id', customerId, 'FK'), value('decision', 'accepted'),
        value('reason', 'CDD complete'), value('considered_reporting', 'true'), value('decided_by', 'Retail CDD policy engine'),
      ]), 'customer', 'decided')
  }
  return records
}

export function buildCustomerDataModel(customer: CustomerScenario): CustomerDataModel {
  const market = customer.bookingEntity.slice(-2)
  const country = market === 'AT' ? 'Austria' : market === 'DE' ? 'Germany' : 'Netherlands'
  const address = market === 'AT'
    ? { street: 'Währinger Straße 42/7', postcode: '1090', city: 'Vienna' }
    : market === 'DE'
      ? { street: 'Alsterufer 17', postcode: '20354', city: 'Hamburg' }
      : { street: 'Prinsengracht 248', postcode: '1016 HG', city: 'Amsterdam' }
  const primaryPersonName = customer.id === 'anna-max' ? 'Anna Gruber' : customer.name
  const [givenName, ...familyParts] = primaryPersonName.split(' ')
  const partyId = `PTY-${customer.id.toUpperCase()}`
  const customerId = `CUS-${customer.id.toUpperCase()}`
  const relationshipId = `REL-${customer.id.toUpperCase()}`
  const onboardedOn = /^\d{4}$/.test(customer.relationshipSince) ? `${customer.relationshipSince}-01-01` : DEMO_TODAY
  const cddState: DataModelFieldState = customer.status === 'complete' ? 'verified' : customer.status === 'action_required' ? 'missing' : 'pending'
  const dueDiligence = customer.risk === 'High' ? 'enhanced' : customer.risk === 'Low' ? 'simplified' : 'standard'
  const timeline = buildTimeline(customer)
  const evidenceStatus = customer.id === 'lukas-weber' ? 'expiring' : customer.id === 'clara-rossi' ? 'verification failed' : 'current'
  const evidenceState: DataModelFieldState = evidenceStatus === 'current' ? 'verified' : 'pending'
  const evidenceValidUntil = customer.id === 'lukas-weber'
    ? '2026-08-18'
    : customer.id === 'clara-rossi'
      ? 'not accepted'
      : addYears(timeline.lastEvidenceVerifiedAt, 5)
  const evidenceType = customer.age < 18 ? 'birth certificate' : market === 'DE' ? 'German identity card' : market === 'AT' ? 'Austrian identity card' : 'EU passport'
  const sourceName = customer.age < 18 ? 'Civil register extract' : `${country} public authority document`
  const caseState: DataModelFieldState = customer.status === 'complete' ? 'verified' : customer.status === 'action_required' ? 'missing' : 'pending'
  const caseStatus = customer.status === 'complete' ? 'closed · completed' : customer.status === 'under_review' ? 'customer response under review' : customer.status === 'restricted' ? 'open · restricted' : 'open · awaiting customer'
  const requirementStatus = customer.status === 'complete' ? 'completed' : customer.status === 'under_review' ? 'submitted' : customer.status === 'restricted' ? 'blocked' : 'open'
  const reviewInterval = customer.risk === 'High' ? '1 year · high risk' : '5 years · low or standard risk'

  const nodes: DataModelNode[] = [
    node('data-source', 'DATA_SOURCE', sourceName, 'assurance', evidenceState, [
      id('source_id', `SRC-${customer.id.toUpperCase()}`, 'PK'), value('source_name', sourceName), value('source_type', 'state-issued identity evidence'),
      value('is_public_authority', 'true'), value('reputation_note', 'authoritative issuer'), value('assessed_on', timeline.lastEvidenceVerifiedAt),
      value('reassessment_due', timeline.nextPeriodicReviewDueAt), value('assessed_by', 'Group KYC evidence policy'),
    ]),
    node('evidence-object', 'EVIDENCE_OBJECT', `Primary evidence · ${evidenceType}`, 'assurance', evidenceState, [
      id('evidence_id', `EVD-${customer.id.toUpperCase()}`, 'PK'), id('party_id', partyId, 'FK'), id('source_id', `SRC-${customer.id.toUpperCase()}`, 'FK'),
      value('evidence_type', evidenceType), value('status', evidenceStatus, evidenceState), value('issued_at', addYears(timeline.lastEvidenceVerifiedAt, -5)),
      value('received_at', timeline.lastEvidenceVerifiedAt), value('verified_at', timeline.lastEvidenceVerifiedAt, evidenceState), value('valid_until', evidenceValidUntil, evidenceState),
      value('retention_until', addYears(timeline.nextPeriodicReviewDueAt, 5)), value('storage_ref', `vault://${customer.id}/primary-identity`),
      value('integrity_hash', `sha256:${customer.id.slice(0, 8)}…synthetic`),
    ]),
    node('data-assertion', 'DATA_ASSERTION', 'Canonical birth-date assertion', 'identity', 'verified', [
      id('assertion_id', `AST-${customer.id.toUpperCase()}-DOB`, 'PK'), id('party_id', partyId, 'FK'), value('attribute_path', 'PERSON.birth_date'),
      value('normalised_value', `${2026 - customer.age}-03-14`), value('assertion_status', 'current'), value('effective_from', onboardedOn),
      value('recorded_at', onboardedOn), value('last_confirmed_at', timeline.lastCustomerUpdateAt), value('next_review_due', timeline.nextPeriodicReviewDueAt),
      value('supersedes_assertion_id', 'null'),
    ]),
    node('assertion-evidence', 'ASSERTION_EVIDENCE', 'Birth date supported by primary evidence', 'assurance', evidenceState, [
      id('link_id', `AE-${customer.id.toUpperCase()}-DOB`, 'PK'), id('assertion_id', `AST-${customer.id.toUpperCase()}-DOB`, 'FK'),
      id('evidence_id', `EVD-${customer.id.toUpperCase()}`, 'FK'), value('support_type', 'direct documentary support'),
      value('sufficiency_decision', evidenceStatus === 'current' ? 'sufficient' : 'refresh required', evidenceState),
      value('assessed_at', timeline.lastEvidenceVerifiedAt), value('assessed_by', 'Retail identity verification service'),
    ]),
    node('party', 'PARTY', 'Canonical group party', 'party', 'verified', [
      id('party_id', partyId, 'PK'), value('party_type', 'person'),
      value('pep_status', customer.id === 'helena-vogt' ? 'potential PEP' : 'not a PEP', customer.id === 'helena-vogt' ? 'pending' : 'verified'),
      value('first_known_on', onboardedOn), value('merged_into_party_id', customer.id === 'lea-horvat' ? '— canonical record —' : 'null'),
    ], 'primary'),
    node('person', 'PERSON', primaryPersonName, 'identity', 'verified', [
      id('party_id', partyId, 'PK/FK'), value('given_name', givenName), value('family_name', familyParts.join(' ')),
      value('birth_date', `${2026 - customer.age}-03-14`), value('birth_country', country), value('has_fixed_residence', 'true'), value('is_minor', customer.age < 18 ? 'true' : 'false'),
    ], 'primary'),
    node('address', 'ADDRESS', 'Current residential address', 'identity', customer.id === 'sofia-marin' || customer.id === 'amira-haddad' ? 'pending' : 'verified', [
      id('address_id', `ADDR-${customer.id.toUpperCase()}`, 'PK'), id('party_id', partyId, 'FK'), value('address_type', 'residence'),
      value('country', country), value('city', address.city), value('postcode', address.postcode), value('street', address.street),
    ]),
    node('nationality', 'NATIONALITY', nationalityByCustomer[customer.id] ?? country, 'identity', 'verified', [
      id('nationality_id', `NAT-${customer.id.toUpperCase()}`, 'PK'), id('party_id', partyId, 'FK'),
      value('country', nationalityByCustomer[customer.id] ?? country), value('special_status', 'none'), value('is_verified', 'true'),
    ]),
    node('customer', 'CUSTOMER', customer.bookingEntity, 'relationship', customer.status === 'complete' ? 'verified' : 'current', [
      id('customer_id', customerId, 'PK'), id('party_id', partyId, 'FK'), value('booking_entity', customer.bookingEntity),
      value('booking_entity_country', market), value('status', customer.status), value('due_diligence_level', dueDiligence), value('onboarded_on', onboardedOn),
    ], 'primary'),
    node('business-relationship', 'BUSINESS_RELATIONSHIP', customer.product, 'relationship', 'current', [
      id('relationship_id', relationshipId, 'PK'), id('customer_id', customerId, 'FK'), value('product_or_service', customer.product),
      value('engagement_type', 'ongoing relationship'), value('why_customer_wants_it', customer.scenario), value('occupation_or_sector', customer.id === 'mia-fischer' ? 'Data analyst · pending refresh' : 'Employed professional'), value('opened_on', onboardedOn),
    ], 'primary'),
    node('cdd-checklist', 'CDD_CHECKLIST', 'Current completion state', 'assurance', cddState, [
      id('customer_id', customerId, 'PK/FK'), value('identity_of_customer', 'verified'),
      value('purpose_and_nature', customer.status === 'action_required' ? 'review required' : 'understood', cddState),
      value('sanctions_screening', customer.id === 'victor-santos' ? 'hit open' : 'clear', customer.id === 'victor-santos' ? 'pending' : 'verified'),
      value('source_of_funds', customer.id === 'elias-petrov' ? 'missing' : 'understood', customer.id === 'elias-petrov' ? 'missing' : 'current'),
      value('open_gaps', customer.status === 'action_required' ? '1' : '0', cddState), value('is_complete', customer.status === 'complete' ? 'true' : 'false', cddState),
    ]),
    node('risk-rating', 'RISK_RATING', `${customer.risk} retail risk`, 'assurance', 'current', [
      id('rating_id', `RISK-${customer.id.toUpperCase()}`, 'PK'), id('customer_id', customerId, 'FK'), id('relationship_id', relationshipId, 'FK'),
      value('risk', customer.risk.toLowerCase()), value('due_diligence_level', dueDiligence), value('model_version', 'retail-amlr-2026.2'), value('factors', customer.tags.join(', ')),
    ]),
    node('customer-attestation', 'CUSTOMER_ATTESTATION', 'Latest customer confirmation', 'assurance', 'verified', [
      id('attestation_id', `ATT-${customer.id.toUpperCase()}`, 'PK'), id('customer_id', customerId, 'FK'), id('party_id', partyId, 'FK'),
      value('statement_version', 'retail-profile-confirmation/2.1'), value('asserted_scope', 'identity, contact, tax and relationship profile'),
      value('response', 'confirmed or corrected'), value('signed_at', timeline.lastCustomerUpdateAt), value('authenticated_by', 'strong customer authentication'),
      value('channel', 'secure web review'), value('next_confirmation_due', timeline.nextPeriodicReviewDueAt),
    ]),
    node('review-cycle', 'CDD_REVIEW', 'Current periodic review cycle', 'assurance', customer.status === 'complete' ? 'verified' : 'current', [
      id('review_id', `REV-${customer.id.toUpperCase()}-CYCLE`, 'PK'), id('customer_id', customerId, 'FK'), value('triggered_by', 'risk-based schedule'),
      value('last_completed_at', timeline.lastReviewCompletedAt), value('next_due', timeline.nextPeriodicReviewDueAt), value('interval_basis', reviewInterval),
      value('last_outcome', 'CDD retained or refreshed'), value('performed_by', 'Responsible booking entity'),
    ]),
    node('cdd-case', 'CDD_CASE', customer.scenario, 'assurance', caseState, [
      id('case_id', `CASE-${customer.id.toUpperCase()}-2026`, 'PK'), id('customer_id', customerId, 'FK'), value('case_type', 'retail KYC review'),
      value('trigger', customer.scenario), value('status', caseStatus, caseState), value('opened_at', timeline.lastMaterialEventAt),
      value('due_at', timeline.nextActionDueAt ?? 'completed', caseState), value('closed_at', customer.status === 'complete' ? timeline.lastReviewCompletedAt : 'null'),
      value('responsible_entity', customer.bookingEntity),
    ]),
    node('cdd-requirement', 'CDD_REQUIREMENT', customer.nextAction, 'assurance', caseState, [
      id('requirement_id', `REQ-${customer.id.toUpperCase()}-01`, 'PK'), id('case_id', `CASE-${customer.id.toUpperCase()}-2026`, 'FK'),
      value('requirement_type', customer.scenario), value('target_ref', customer.status === 'complete' ? 'profile confirmation' : 'current SDUI journey'),
      value('reason', customer.tags.join(', ')), value('status', requirementStatus, caseState), value('raised_at', timeline.lastMaterialEventAt),
      value('due_at', timeline.nextActionDueAt ?? 'completed', caseState), value('completed_at', customer.status === 'complete' ? timeline.lastCustomerUpdateAt : 'null'),
      value('blocking', customer.status === 'restricted' ? 'true' : 'false', caseState),
    ]),
    node('data-request', 'DATA_REQUEST', 'Customer-facing data request', 'assurance', caseState, [
      id('request_id', `DRQ-${customer.id.toUpperCase()}-01`, 'PK'), id('case_id', `CASE-${customer.id.toUpperCase()}-2026`, 'FK'),
      id('requirement_id', `REQ-${customer.id.toUpperCase()}-01`, 'FK'), value('request_scope', customer.nextAction),
      value('requested_at', timeline.lastMaterialEventAt), value('due_at', timeline.nextActionDueAt ?? 'completed'), value('channel', 'SDUI secure review'),
      value('status', customer.status === 'complete' ? 'completed' : customer.status === 'under_review' ? 'answered' : 'awaiting response', caseState),
    ]),
    node('data-submission', 'DATA_SUBMISSION', 'Latest authenticated response', 'assurance', customer.status === 'action_required' ? 'current' : caseState, [
      id('submission_id', `SUB-${customer.id.toUpperCase()}-LATEST`, 'PK'), id('request_id', `DRQ-${customer.id.toUpperCase()}-01`, 'FK'),
      id('customer_id', customerId, 'FK'), value('submitted_by_party_id', partyId), value('submission_type', 'customer confirmation and evidence'),
      value('submitted_at', customer.status === 'action_required' ? timeline.lastCustomerUpdateAt : timeline.lastMaterialEventAt),
      value('channel', 'secure web review'), value('authentication_context', 'SCA session'),
      value('status', customer.status === 'under_review' ? 'accepted for review' : customer.status === 'complete' ? 'accepted' : 'previous accepted submission'),
    ]),
    node('audit-event', 'AUDIT_EVENT', 'Latest material KYC event', 'assurance', 'current', [
      id('event_id', `AUD-${customer.id.toUpperCase()}-LATEST`, 'PK'), id('party_id', partyId, 'FK'), id('customer_id', customerId, 'FK'),
      value('event_type', customer.scenario), value('occurred_at', timeline.lastMaterialEventAt), value('actor_type', customer.status === 'under_review' ? 'customer' : 'system or customer'),
      value('channel', 'retail KYC service'), value('case_ref', `CASE-${customer.id.toUpperCase()}-2026`), value('correlation_id', `corr-${customer.id}-2026`),
      value('previous_value_ref', 'prior immutable assertion'), value('new_value_ref', customer.status === 'complete' ? 'accepted current assertion' : 'pending review result'),
    ]),
  ]

  const edges: DataModelEdge[] = [
    edge('data-source', 'evidence-object', 'issued or supplied', '1 : 0..*'),
    edge('evidence-object', 'assertion-evidence', 'supports through', '1 : 0..*'),
    edge('data-assertion', 'assertion-evidence', 'is evidenced by', '1 : 0..*'),
    edge('party', 'person', 'if an individual', '1 : 0..1'), edge('party', 'address', 'lives at', '1 : 0..*'),
    edge('party', 'nationality', 'holds', '1 : 0..*'), edge('party', 'data-assertion', 'has asserted fact', '1 : 0..*'), edge('party', 'customer', 'becomes', '1 : 0..*'),
    edge('customer', 'business-relationship', 'holds', '1 : 0..*'), edge('customer', 'cdd-checklist', 'measured by', '1 : 1'),
    edge('customer', 'customer-attestation', 'confirmed through', '1 : 0..*'), edge('customer', 'review-cycle', 'reviewed on', '1 : 0..*'),
    edge('customer', 'cdd-case', 'has review case', '1 : 0..*'), edge('cdd-case', 'cdd-requirement', 'contains', '1 : 1..*'),
    edge('cdd-requirement', 'data-request', 'served as', '1 : 0..*'), edge('data-request', 'data-submission', 'answered by', '1 : 0..*'),
    edge('data-submission', 'audit-event', 'recorded as', '1 : 1'),
    edge('business-relationship', 'risk-rating', 'rated', '1 : 0..*'),
  ]

  const scenario = scenarioRecords(customer, partyId, customerId)
  const allNodes = [...nodes, ...scenario.nodes]
  const evidenceNodes = allNodes.filter((record) => ['EVIDENCE_OBJECT', 'IDENTITY_DOCUMENT', 'IDENTITY_CHECK', 'WEALTH_EVIDENCE', 'CUSTOMER_ATTESTATION'].includes(record.entity))
  const evidenceSummary = evidenceNodes.reduce<CustomerDataModel['evidenceSummary']>((summary, record) => {
    const status = record.fields.find((field) => field.name === 'status')?.value
    if (status === 'expiring') summary.expiring += 1
    else if (record.state === 'missing') summary.missing += 1
    else if (record.state === 'pending') summary.pending += 1
    else summary.current += 1
    return summary
  }, { current: 0, expiring: 0, pending: 0, missing: 0 })
  return {
    partyId,
    customerId,
    generatedAt: '2026-08-07T00:00:00.000Z',
    timeline,
    evidenceSummary,
    nodes: allNodes,
    edges: [...edges, ...scenario.edges],
  }
}
