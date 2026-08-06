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
const contractVersion = 'retail-kyc-sdui/1.0'

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
  { type: 'profile_overview', label: 'Other information on file', purpose: 'Lets the customer inspect data that is not part of the current request.', dataModelTargets: ['PARTY', 'PERSON', 'CUSTOMER', 'BUSINESS_RELATIONSHIP'] },
]

const nationalityByCustomer: Record<string, string> = {
  'emma-berger': 'Austrian', 'lukas-weber': 'German', 'sofia-marin': 'Spanish', 'amira-haddad': 'Austrian',
  'daniel-novak': 'Austrian, Czech', 'helena-vogt': 'German', 'victor-santos': 'Spanish', 'noah-klein': 'Austrian',
  'anna-max': 'Austrian', 'elias-petrov': 'German', 'mia-fischer': 'Austrian', 'oliver-dubois': 'French',
  'clara-rossi': 'Italian', 'jakob-stein': 'German', 'lea-horvat': 'Croatian', 'karim-aziz': 'Dutch',
}

function customerVisibleProfile(customer: (typeof customers)[number]) {
  const market = customer.bookingEntity.slice(-2)
  const emailName = customer.id.replace('-', '.')
  return {
    id: `${customer.id}-profile-overview`,
    type: 'profile_overview' as const,
    title: 'Other information we have about you',
    description: 'These details are not part of the current request. You can still inspect them and contact us if something is incorrect.',
    collapsedByDefault: true,
    sections: [
      {
        title: 'Personal information',
        fields: [
          { label: 'Legal name', value: customer.name, verified: true, source: 'Group Party Master' },
          { label: 'Age', value: `${customer.age}`, source: 'Verified date of birth' },
          { label: 'Nationality', value: nationalityByCustomer[customer.id] ?? 'On file', verified: true, source: 'Identity evidence' },
        ],
      },
      {
        title: 'Contact and tax',
        fields: [
          { label: 'Email', value: `${emailName}@example.demo`, source: 'Confirmed by customer' },
          { label: 'Mobile number', value: `+${market === 'AT' ? '43' : market === 'DE' ? '49' : '31'} ••• ••• 42`, source: 'Confirmed by customer' },
          { label: 'Tax residency', value: market === 'AT' ? 'Austria' : market === 'DE' ? 'Germany' : 'Netherlands', source: 'Customer declaration' },
        ],
      },
      {
        title: 'Banking relationship',
        fields: [
          { label: 'Booking entity', value: customer.bookingEntity },
          { label: 'Product', value: customer.product },
          { label: 'Customer since', value: customer.relationshipSince },
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

  const missingFields = missingRequiredFields(customer.screens[screenIndex], values as Record<string, string | boolean | null>)
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
