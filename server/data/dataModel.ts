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

const node = (
  id: string,
  entity: string,
  recordLabel: string,
  layer: DataModelNode['layer'],
  state: DataModelFieldState,
  fields: DataModelField[],
): DataModelNode => ({ id, entity, recordLabel, layer, state, fields })

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
      add(node('related-party', 'RELATED_PARTY', 'Eva Klein · mother', 'relationship', 'verified', [
        id('related_party_id', 'RP-NK-01', 'PK'), id('customer_id', customerId, 'FK'), value('relationship', 'legal representative'),
        value('authority_granted_by', 'parental guardianship'), value('what_they_may_do', 'approve and operate youth account'), value('authority_evidence_ref', 'CR-1842'),
      ]), 'customer', 'has around it')
      break
    case 'anna-max':
      add(node('related-party', 'RELATED_PARTY', 'Max Gruber · joint holder', 'relationship', 'verified', [
        id('related_party_id', 'RP-AG-02', 'PK'), id('customer_id', customerId, 'FK'), value('relationship', 'joint account holder'),
        value('what_they_may_do', 'transact independently'), value('valid_from', '2022-04-12'), value('authority_evidence_ref', 'joint mandate JM-2204'),
      ]), 'customer', 'has around it')
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
      ]))
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
  const [givenName, ...familyParts] = customer.name.split(' ')
  const partyId = `PTY-${customer.id.toUpperCase()}`
  const customerId = `CUS-${customer.id.toUpperCase()}`
  const relationshipId = `REL-${customer.id.toUpperCase()}`
  const cddState: DataModelFieldState = customer.status === 'complete' ? 'verified' : customer.status === 'action_required' ? 'missing' : 'pending'
  const dueDiligence = customer.risk === 'High' ? 'enhanced' : customer.risk === 'Low' ? 'simplified' : 'standard'

  const nodes: DataModelNode[] = [
    node('party', 'PARTY', 'Canonical group party', 'party', 'verified', [
      id('party_id', partyId, 'PK'), value('party_type', 'person'),
      value('pep_status', customer.id === 'helena-vogt' ? 'potential PEP' : 'not a PEP', customer.id === 'helena-vogt' ? 'pending' : 'verified'),
      value('first_known_on', `${customer.relationshipSince}-01-01`), value('merged_into_party_id', customer.id === 'lea-horvat' ? '— canonical record —' : 'null'),
    ]),
    node('person', 'PERSON', customer.name, 'identity', 'verified', [
      id('party_id', partyId, 'PK/FK'), value('given_name', givenName), value('family_name', familyParts.join(' ')),
      value('birth_date', `${2026 - customer.age}-03-14`), value('birth_country', country), value('has_fixed_residence', 'true'), value('is_minor', customer.age < 18 ? 'true' : 'false'),
    ]),
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
      value('booking_entity_country', market), value('status', customer.status), value('due_diligence_level', dueDiligence), value('onboarded_on', `${customer.relationshipSince}-01-01`),
    ]),
    node('business-relationship', 'BUSINESS_RELATIONSHIP', customer.product, 'relationship', 'current', [
      id('relationship_id', relationshipId, 'PK'), id('customer_id', customerId, 'FK'), value('product_or_service', customer.product),
      value('engagement_type', 'ongoing relationship'), value('why_customer_wants_it', customer.scenario), value('occupation_or_sector', customer.id === 'mia-fischer' ? 'Data analyst · pending refresh' : 'Employed professional'), value('opened_on', `${customer.relationshipSince}-01-01`),
    ]),
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
  ]

  const edges: DataModelEdge[] = [
    edge('party', 'person', 'if an individual', '1 : 0..1'), edge('party', 'address', 'lives at', '1 : 0..*'),
    edge('party', 'nationality', 'holds', '1 : 0..*'), edge('party', 'customer', 'becomes', '1 : 0..*'),
    edge('customer', 'business-relationship', 'holds', '1 : 0..*'), edge('customer', 'cdd-checklist', 'measured by', '1 : 1'),
    edge('customer', 'risk-rating', 'rated', '1 : 0..*'), edge('business-relationship', 'risk-rating', 'rated', '1 : 0..*'),
  ]

  const scenario = scenarioRecords(customer, partyId, customerId)
  return { partyId, customerId, generatedAt: '2026-08-07T00:00:00.000Z', nodes: [...nodes, ...scenario.nodes], edges: [...edges, ...scenario.edges] }
}
