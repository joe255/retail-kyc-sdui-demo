export type CustomerStatus = 'action_required' | 'under_review' | 'complete' | 'restricted'
export type RiskLevel = 'Low' | 'Standard' | 'High'
export type Tone = 'info' | 'warning' | 'success' | 'critical' | 'neutral'

export interface VisibilityCondition {
  fieldId: string
  operator: 'equals' | 'not_equals'
  value: string | boolean
}

export interface BaseComponent {
  id: string
  type: string
  required?: boolean
  visibleWhen?: VisibilityCondition[]
}

export interface NoticeComponent extends BaseComponent {
  type: 'notice'
  tone: Tone
  eyebrow?: string
  title: string
  body: string
}

export interface FieldReviewComponent extends BaseComponent {
  type: 'field_review'
  fieldId: string
  label: string
  value: string
  source: string
  lastConfirmed?: string
  verified?: boolean
  editable?: boolean
  inputType?: 'text' | 'date' | 'email' | 'tel'
  helper?: string
}

export interface SelectComponent extends BaseComponent {
  type: 'select'
  fieldId: string
  label: string
  value?: string
  placeholder: string
  options: Array<{ label: string; value: string }>
  helper?: string
  required?: boolean
}

export interface InputComponent extends BaseComponent {
  type: 'input'
  fieldId: string
  label: string
  value?: string
  placeholder?: string
  inputType?: 'text' | 'date' | 'number'
  prefix?: string
  suffix?: string
  helper?: string
  required?: boolean
}

export interface ChoiceComponent extends BaseComponent {
  type: 'choice'
  fieldId: string
  label: string
  value?: string
  layout?: 'row' | 'grid'
  options: Array<{ value: string; label: string; description?: string; icon?: string }>
}

export interface ComparisonComponent extends BaseComponent {
  type: 'comparison'
  fieldId: string
  title: string
  description: string
  options: Array<{
    value: string
    label: string
    lines: string[]
    source: string
    verified?: boolean
  }>
}

export interface UploadComponent extends BaseComponent {
  type: 'upload'
  fieldId: string
  title: string
  description: string
  accepted: string
  examples?: string[]
}

export interface DeclarationComponent extends BaseComponent {
  type: 'declaration'
  fieldId: string
  title: string
  body: string
  checkboxLabel: string
  legalNote?: string
}

export interface RelationshipComponent extends BaseComponent {
  type: 'relationship'
  title: string
  people: Array<{
    name: string
    initials: string
    role: string
    status: 'verified' | 'pending'
  }>
  product: string
  ownership?: string
}

export interface TransactionProfileComponent extends BaseComponent {
  type: 'transaction_profile'
  title: string
  observed: Array<{ label: string; value: string; highlight?: boolean }>
  expected: Array<{ fieldId: string; label: string; value: string; options: string[] }>
}

export interface VerificationComponent extends BaseComponent {
  type: 'verification'
  title: string
  status: 'failed' | 'pending' | 'ready'
  attempts: Array<{ label: string; timestamp: string; result: string }>
  alternatives: Array<{ value: string; label: string; description: string }>
}

export interface SummaryComponent extends BaseComponent {
  type: 'summary'
  title: string
  items: Array<{ label: string; value: string; state?: 'ok' | 'changed' | 'pending' }>
}

export interface ProfileOverviewComponent extends BaseComponent {
  type: 'profile_overview'
  title: string
  description: string
  collapsedByDefault: boolean
  sections: Array<{
    title: string
    fields: Array<{
      label: string
      value: string
      verified?: boolean
      source?: string
    }>
  }>
}

export type SduiComponent =
  | NoticeComponent
  | FieldReviewComponent
  | SelectComponent
  | InputComponent
  | ChoiceComponent
  | ComparisonComponent
  | UploadComponent
  | DeclarationComponent
  | RelationshipComponent
  | TransactionProfileComponent
  | VerificationComponent
  | SummaryComponent
  | ProfileOverviewComponent

export interface SduiScreen {
  id: string
  eyebrow: string
  title: string
  description: string
  reason: string
  estimatedMinutes?: number
  primaryAction: string
  components: SduiComponent[]
}

export interface CustomerScenario {
  id: string
  initials: string
  name: string
  age: number
  bookingEntity: string
  product: string
  segment: string
  risk: RiskLevel
  status: CustomerStatus
  scenario: string
  nextAction: string
  dueLabel: string
  lastReview: string
  relationshipSince: string
  tags: string[]
  screens: SduiScreen[]
}

export type ResponseValue = string | boolean | File | null
export type ResponseState = Record<string, ResponseValue>

export type CustomerSummary = Omit<CustomerScenario, 'screens'> & {
  screenCount: number
}

export interface ComponentCatalogEntry {
  type: SduiComponent['type']
  label: string
  purpose: string
  dataModelTargets: string[]
}

export interface CustomerListPayload {
  contractVersion: string
  generatedAt: string
  syntheticData: true
  customers: CustomerSummary[]
  statusCounts: Record<CustomerStatus, number>
}

export interface JourneyPayload {
  contractVersion: string
  generatedAt: string
  syntheticData: true
  customer: CustomerScenario
  presentation: {
    title: string
    description: string
    dataBoundary: string
  }
}

export interface SubmissionReceipt {
  submissionId: string
  customerId: string
  screenId: string
  status: 'accepted_for_review'
  receivedAt: string
  nextScreenId: string | null
}
