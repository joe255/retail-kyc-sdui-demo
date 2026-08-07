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
  inputType?: 'text' | 'date' | 'number' | 'email' | 'tel'
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
  instructions?: string[]
  documentDateRule?: string
  maxSizeMb?: number
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
  fieldId: string
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

export interface StructuredAddressValue {
  country: string
  street: string
  houseNumber: string
  postcode: string
  city: string
  region?: string
}

export interface StructuredAddressComponent extends BaseComponent {
  type: 'structured_address'
  fieldId: string
  title: string
  description?: string
  value?: StructuredAddressValue
  countryOptions: Array<{ label: string; value: string }>
  requireRegion?: boolean
  proofHint?: string
}

export type ProfileEditComponent = InputComponent | SelectComponent | ChoiceComponent | StructuredAddressComponent

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
      evidence?: string
      lastUpdatedAt?: string
      nextReviewDueAt?: string
      editComponent: ProfileEditComponent
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
  | StructuredAddressComponent
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

export type ResponseValue = string | boolean | File | StructuredAddressValue | null
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
  dataModel: CustomerDataModel
}

export type DataModelLayer = 'identity' | 'party' | 'relationship' | 'assurance'
export type DataModelFieldState = 'verified' | 'current' | 'pending' | 'missing' | 'changed'

export interface DataModelField {
  name: string
  value: string
  key?: 'PK' | 'FK' | 'PK/FK'
  state?: DataModelFieldState
}

export interface DataModelNode {
  id: string
  entity: string
  recordLabel: string
  layer: DataModelLayer
  state: DataModelFieldState
  emphasis: 'primary' | 'supporting' | 'connected'
  fields: DataModelField[]
}

export interface DataModelEdge {
  id: string
  source: string
  target: string
  label: string
  cardinality: string
}

export interface CustomerDataModel {
  partyId: string
  customerId: string
  generatedAt: string
  timeline: {
    lastCustomerUpdateAt: string
    lastEvidenceVerifiedAt: string
    lastReviewCompletedAt: string
    lastMaterialEventAt: string
    nextActionDueAt: string | null
    nextPeriodicReviewDueAt: string
    nextAction: string
  }
  evidenceSummary: {
    current: number
    expiring: number
    pending: number
    missing: number
  }
  nodes: DataModelNode[]
  edges: DataModelEdge[]
}

export interface SubmissionReceipt {
  submissionId: string
  customerId: string
  screenId: string
  status: 'accepted_for_review'
  receivedAt: string
  nextScreenId: string | null
}

export type MetaModelDomainId = 'party' | 'identity' | 'relationship' | 'assurance'

export interface MetaModelDomain {
  id: MetaModelDomainId
  label: string
  description: string
  order: number
}

export interface MetaModelEntity {
  id: string
  name: string
  purpose: string
  primaryDomain: MetaModelDomainId
  domains: MetaModelDomainId[]
  keyFields: string[]
  temporalFields: string[]
}

export interface MetaModelRelationship {
  id: string
  source: string
  target: string
  label: string
  cardinality: string
}

export interface MetaModelPayload {
  contractVersion: string
  generatedAt: string
  domains: MetaModelDomain[]
  entities: MetaModelEntity[]
  relationships: MetaModelRelationship[]
}
