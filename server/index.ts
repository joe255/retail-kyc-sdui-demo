import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { customers } from './data/customers'
import { missingRequiredFields } from '../src/lib/conditions'
import type {
  ComponentCatalogEntry,
  CustomerListPayload,
  CustomerStatus,
  JourneyPayload,
  SubmissionReceipt,
} from '../src/types/sdui'

const app = express()
const port = Number(process.env.PORT ?? 8787)
const contractVersion = 'retail-kyc-sdui/1.1'

type StoredSubmission = {
  receipt: SubmissionReceipt
  values: Record<string, unknown>
}

const submissions = new Map<string, StoredSubmission[]>()

const componentCatalog: ComponentCatalogEntry[] = [
  { type: 'notice', label: 'Context notice', purpose: 'Explains a trigger, outcome or restriction.', dataModelTargets: ['CDD_REQUIREMENT', 'CDD_CASE'] },
  { type: 'field_review', label: 'Verified field review', purpose: 'Displays a canonical fact with provenance and optional correction.', dataModelTargets: ['DATA_ASSERTION', 'ATTRIBUTE_RESOLUTION'] },
  { type: 'input', label: 'Structured input', purpose: 'Collects a missing or changed scalar value.', dataModelTargets: ['DATA_REQUEST', 'DATA_ASSERTION'] },
  { type: 'select', label: 'Controlled selection', purpose: 'Collects a value from a server-owned code list.', dataModelTargets: ['DATA_REQUEST', 'DATA_ASSERTION'] },
  { type: 'choice', label: 'Choice cards', purpose: 'Collects a decision or categorised explanation.', dataModelTargets: ['DATA_SUBMISSION', 'CDD_REQUIREMENT'] },
  { type: 'comparison', label: 'Source conflict', purpose: 'Lets the customer resolve competing group assertions without silent overwrite.', dataModelTargets: ['DATA_ASSERTION', 'ATTRIBUTE_RESOLUTION'] },
  { type: 'upload', label: 'Evidence upload', purpose: 'Collects documentary evidence for a requested fact.', dataModelTargets: ['EVIDENCE_OBJECT', 'ASSERTION_EVIDENCE'] },
  { type: 'declaration', label: 'Customer declaration', purpose: 'Captures an explicit, timestamped confirmation or acceptance.', dataModelTargets: ['DATA_SUBMISSION', 'AUDIT_EVENT'] },
  { type: 'relationship', label: 'Party relationship', purpose: 'Explains roles around a retail customer or joint relationship.', dataModelTargets: ['RELATED_PARTY', 'BUSINESS_RELATIONSHIP'] },
  { type: 'transaction_profile', label: 'Expected activity', purpose: 'Compares observed activity with the relationship expectation.', dataModelTargets: ['BUSINESS_RELATIONSHIP', 'RISK_RATING'] },
  { type: 'verification', label: 'Verification fallback', purpose: 'Shows failed attempts and offers policy-approved alternatives.', dataModelTargets: ['IDENTITY_CHECK', 'CDD_REQUIREMENT'] },
  { type: 'summary', label: 'Review summary', purpose: 'Summarises accepted changes before submission.', dataModelTargets: ['DATA_SUBMISSION', 'CDD_CASE'] },
  { type: 'structured_address', label: 'Structured address', purpose: 'Collects all required address parts as one validated value.', dataModelTargets: ['ADDRESS', 'DATA_ASSERTION'] },
  { type: 'profile_overview', label: 'Editable information on file', purpose: 'Lets the customer inspect and correct facts outside the active request using nested SDUI editors.', dataModelTargets: ['PARTY', 'PERSON', 'CUSTOMER', 'BUSINESS_RELATIONSHIP'] },
]

const nationalityByCustomer: Record<string, string> = {
  'emma-berger': 'Austrian', 'lukas-weber': 'German', 'sofia-marin': 'Spanish', 'amira-haddad': 'Austrian',
  'daniel-novak': 'Austrian, Czech', 'helena-vogt': 'German', 'victor-santos': 'Spanish', 'noah-klein': 'Austrian',
  'anna-max': 'Austrian', 'elias-petrov': 'German', 'mia-fischer': 'Austrian', 'oliver-dubois': 'French',
  'clara-rossi': 'Italian', 'jakob-stein': 'German', 'lea-horvat': 'Croatian', 'karim-aziz': 'Dutch',
}

function customerVisibleProfile(customer: (typeof customers)[number]) {
  const market = customer.bookingEntity.slice(-2)
  const countryCode = market === 'AT' ? 'AT' : market === 'DE' ? 'DE' : 'NL'
  const countryName = market === 'AT' ? 'Austria' : market === 'DE' ? 'Germany' : 'Netherlands'
  const emailName = customer.id.replace('-', '.')
  const birthYear = 2026 - customer.age
  const countryOptions = [
    { label: 'Austria', value: 'AT' }, { label: 'Germany', value: 'DE' }, { label: 'Netherlands', value: 'NL' },
    { label: 'Croatia', value: 'HR' }, { label: 'Italy', value: 'IT' }, { label: 'Spain', value: 'ES' },
  ]
  const address = market === 'AT'
    ? { country: 'AT', street: 'Währinger Straße', houseNumber: '42/7', postcode: '1090', city: 'Vienna', region: 'Vienna' }
    : market === 'DE'
      ? { country: 'DE', street: 'Alsterufer', houseNumber: '17', postcode: '20354', city: 'Hamburg', region: 'Hamburg' }
      : { country: 'NL', street: 'Prinsengracht', houseNumber: '248', postcode: '1016 HG', city: 'Amsterdam', region: 'North Holland' }
  return {
    id: `${customer.id}-profile-overview`,
    type: 'profile_overview' as const,
    title: 'Other information we have about you',
    description: 'These details are not part of the current request. Select Edit next to any fact to open its appropriate SDUI editor.',
    collapsedByDefault: true,
    sections: [
      {
        title: 'Personal information',
        fields: [
          { label: 'Legal name', value: customer.name, verified: true, source: 'Group Party Master', editComponent: { id: `${customer.id}-edit-name`, type: 'input' as const, fieldId: 'profile_legal_name', label: 'Legal name', value: customer.name, placeholder: 'Name exactly as shown on your identity document', helper: 'A name change may trigger a request for supporting evidence.', required: true } },
          { label: 'Date of birth', value: `14 March ${birthYear}`, source: 'Verified identity document', editComponent: { id: `${customer.id}-edit-birth`, type: 'input' as const, fieldId: 'profile_birth_date', label: 'Date of birth', value: `${birthYear}-03-14`, inputType: 'date' as const, helper: 'Changing a verified birth date creates an identity-review case.', required: true } },
          { label: 'Nationality', value: nationalityByCustomer[customer.id] ?? 'On file', verified: true, source: 'Identity evidence', editComponent: { id: `${customer.id}-edit-nationality`, type: 'input' as const, fieldId: 'profile_nationality', label: 'Nationality or nationalities', value: nationalityByCustomer[customer.id] ?? '', placeholder: 'List every nationality you hold', helper: 'Separate multiple nationalities with commas.', required: true } },
        ],
      },
      {
        title: 'Contact and residence',
        fields: [
          { label: 'Email', value: `${emailName}@example.demo`, source: 'Confirmed by customer', editComponent: { id: `${customer.id}-edit-email`, type: 'input' as const, fieldId: 'profile_email', label: 'Email address', value: `${emailName}@example.demo`, inputType: 'email' as const, placeholder: 'name@example.com', required: true } },
          { label: 'Mobile number', value: `+${market === 'AT' ? '43' : market === 'DE' ? '49' : '31'} 660 123 42`, source: 'Confirmed by customer', editComponent: { id: `${customer.id}-edit-mobile`, type: 'input' as const, fieldId: 'profile_mobile', label: 'Mobile number', value: `+${market === 'AT' ? '43' : market === 'DE' ? '49' : '31'} 660 123 42`, inputType: 'tel' as const, placeholder: 'Include the country calling code', required: true } },
          { label: 'Residential address', value: `${address.street} ${address.houseNumber}, ${address.postcode} ${address.city}`, source: 'Confirmed by customer', editComponent: { id: `${customer.id}-edit-address`, type: 'structured_address' as const, fieldId: 'profile_residential_address', title: 'Residential address', description: 'Use the address where you usually live.', value: address, countryOptions, required: true } },
        ],
      },
      {
        title: 'Tax and financial profile',
        fields: [
          { label: 'Tax residency', value: countryName, source: 'Customer declaration', editComponent: { id: `${customer.id}-edit-tax-country`, type: 'select' as const, fieldId: 'profile_tax_residency', label: 'Primary tax residency', value: countryCode, placeholder: 'Choose a country', options: countryOptions, helper: 'Additional tax residencies are collected in the full tax journey.', required: true } },
          { label: 'Occupation', value: customer.id === 'mia-fischer' ? 'Data analyst' : 'Employed professional', source: 'Last customer review', editComponent: { id: `${customer.id}-edit-occupation`, type: 'input' as const, fieldId: 'profile_occupation', label: 'Occupation', value: customer.id === 'mia-fischer' ? 'Data analyst' : 'Employed professional', placeholder: 'Your current job or profession', required: true } },
          { label: 'Primary source of income', value: 'Employment income', source: 'Relationship profile', editComponent: { id: `${customer.id}-edit-income`, type: 'choice' as const, fieldId: 'profile_income_source', label: 'Primary source of income', value: 'employment', layout: 'grid' as const, options: [
            { value: 'employment', label: 'Employment income', description: 'Salary, bonus or pension' },
            { value: 'business', label: 'Business income', description: 'Self-employment, dividends or company proceeds' },
            { value: 'investment', label: 'Investment income', description: 'Rent, interest or investment returns' },
            { value: 'family', label: 'Family support or inheritance', description: 'Support, gift or inherited assets' },
          ], required: true } },
        ],
      },
    ],
  }
}

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

app.use((request, response, next) => {
  response.setHeader('X-SDUI-Contract', contractVersion)
  response.setHeader('Cache-Control', 'no-store')
  if (request.path.startsWith('/api/')) {
    console.log(`${new Date().toISOString()} ${request.method} ${request.path}`)
  }
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', contractVersion, scenarios: customers.length })
})

app.get('/api/v1/components', (_request, response) => {
  response.json({ contractVersion, components: componentCatalog })
})

app.get('/api/v1/customers', (_request, response) => {
  const statusCounts: Record<CustomerStatus, number> = {
    action_required: 0,
    under_review: 0,
    complete: 0,
    restricted: 0,
  }

  const summaries = customers.map(({ screens, ...customer }) => {
    statusCounts[customer.status] += 1
    return { ...customer, screenCount: screens.length }
  })

  const payload: CustomerListPayload = {
    contractVersion,
    generatedAt: new Date().toISOString(),
    syntheticData: true,
    customers: summaries,
    statusCounts,
  }
  response.json(payload)
})

app.get('/api/v1/customers/:customerId/journey', (request, response) => {
  const customer = customers.find((candidate) => candidate.id === request.params.customerId)
  if (!customer) {
    response.status(404).json({ error: 'customer_not_found', message: 'No synthetic scenario exists for that id.' })
    return
  }

  const customerJourney = {
    ...customer,
    screens: customer.screens.map((screen, index) => index === 0
      ? { ...screen, components: [...screen.components, customerVisibleProfile(customer)] }
      : screen),
  }

  const payload: JourneyPayload = {
    contractVersion,
    generatedAt: new Date().toISOString(),
    syntheticData: true,
    customer: customerJourney,
    presentation: {
      title: customer.scenario,
      description: `${customer.screens.length} server-defined screen${customer.screens.length === 1 ? '' : 's'} for ${customer.bookingEntity}.`,
      dataBoundary: 'Group identity facts are reusable; CDD status and decisions remain booking-entity specific.',
    },
  }
  response.json(payload)
})

app.post('/api/v1/customers/:customerId/submissions', (request, response) => {
  const customer = customers.find((candidate) => candidate.id === request.params.customerId)
  const screenId = typeof request.body?.screenId === 'string' ? request.body.screenId : ''
  const values = request.body?.values
  const screenIndex = customer?.screens.findIndex((screen) => screen.id === screenId) ?? -1

  if (!customer) {
    response.status(404).json({ error: 'customer_not_found' })
    return
  }
  if (screenIndex < 0 || !values || typeof values !== 'object' || Array.isArray(values)) {
    response.status(400).json({ error: 'invalid_submission', message: 'A valid screenId and values object are required.' })
    return
  }

  const submissionScreen = screenIndex === 0
    ? { ...customer.screens[screenIndex], components: [...customer.screens[screenIndex].components, customerVisibleProfile(customer)] }
    : customer.screens[screenIndex]
  const missingFields = missingRequiredFields(submissionScreen, values as Record<string, string | boolean | null>)
  if (missingFields.length) {
    response.status(422).json({
      error: 'missing_required_fields',
      message: 'Complete all visible required fields before continuing.',
      fields: missingFields,
    })
    return
  }

  const receipt: SubmissionReceipt = {
    submissionId: randomUUID(),
    customerId: customer.id,
    screenId,
    status: 'accepted_for_review',
    receivedAt: new Date().toISOString(),
    nextScreenId: customer.screens[screenIndex + 1]?.id ?? null,
  }
  const previous = submissions.get(customer.id) ?? []
  submissions.set(customer.id, [...previous, { receipt, values }])
  response.status(202).json(receipt)
})

app.post('/api/v1/demo/reset', (_request, response) => {
  submissions.clear()
  response.json({ reset: true, resetAt: new Date().toISOString() })
})

const distPath = path.resolve(process.cwd(), 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*path', (_request, response) => response.sendFile(path.join(distPath, 'index.html')))
}

app.listen(port, () => {
  console.log(`Retail KYC SDUI API listening on http://localhost:${port}`)
})
