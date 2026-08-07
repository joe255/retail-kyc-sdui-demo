import { useEffect, useId, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileCheck2,
  FileUp,
  Fingerprint,
  Info,
  Landmark,
  LockKeyhole,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import type {
  ChoiceComponent,
  ComparisonComponent,
  DeclarationComponent,
  FieldReviewComponent,
  InputComponent,
  NoticeComponent,
  ProfileOverviewComponent,
  RelationshipComponent,
  ResponseState,
  ResponseValue,
  SelectComponent,
  SduiComponent,
  SummaryComponent,
  StructuredAddressComponent,
  StructuredAddressValue,
  Tone,
  TransactionProfileComponent,
  UploadComponent,
  VerificationComponent,
} from '../types/sdui'
import { isComponentVisible, isRequiredComponentComplete } from '../lib/conditions'

type RendererProps = {
  component: SduiComponent
  responses: ResponseState
  onChange: (fieldId: string, value: ResponseValue) => void
  invalidFields?: string[]
}

function ValidationMessage({ invalid, message = 'Complete this required field before continuing.' }: { invalid?: boolean; message?: string }) {
  if (!invalid) return null
  return <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-700"><CircleAlert size={14} />{message}</p>
}

function InfoTooltip({ text, label = 'More information' }: { text: string; label?: string }) {
  return <span tabIndex={0} role="img" aria-label={`${label}: ${text}`} title={text} className="inline-grid size-5 shrink-0 cursor-help place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus:bg-slate-100 focus:text-slate-700"><Info size={13} /></span>
}

function InfoDisclosure({ children, label = 'More information' }: { children: React.ReactNode; label?: string }) {
  return <details className="group mt-3 rounded-xl bg-slate-50 open:ring-1 open:ring-slate-200"><summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:text-slate-800 [&::-webkit-details-marker]:hidden"><Info size={13} />{label}<ChevronDown className="ml-auto transition group-open:rotate-180" size={13} /></summary><div className="border-t border-slate-200 px-3 py-3 text-xs leading-5 text-slate-600">{children}</div></details>
}

const toneStyles: Record<Tone, { shell: string; icon: string }> = {
  info: { shell: 'border-sky-200/70 bg-sky-50/80', icon: 'bg-sky-500 text-white' },
  warning: { shell: 'border-amber-200/80 bg-amber-50/80', icon: 'bg-amber-500 text-white' },
  success: { shell: 'border-emerald-200/70 bg-emerald-50/80', icon: 'bg-emerald-600 text-white' },
  critical: { shell: 'border-rose-200/70 bg-rose-50/80', icon: 'bg-rose-600 text-white' },
  neutral: { shell: 'border-slate-200 bg-slate-50/90', icon: 'bg-slate-700 text-white' },
}

function Notice({ component }: { component: NoticeComponent }) {
  const styles = toneStyles[component.tone]
  const Icon = component.tone === 'success' ? CheckCircle2 : component.tone === 'warning' ? AlertTriangle : component.tone === 'critical' ? ShieldAlert : Info
  return (
    <section className={`rounded-2xl border p-4 ${styles.shell}`}>
      <div className="flex items-start gap-3">
        <div className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm ${styles.icon}`}><Icon size={17} /></div>
        <div className="min-w-0 flex-1">
          {component.eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{component.eyebrow}</p>}
          <div className="flex items-center gap-1.5"><h3 className="text-sm font-bold text-slate-950">{component.title}</h3><InfoTooltip text={component.body} label="Why this matters" /></div>
        </div>
      </div>
    </section>
  )
}

function FieldReview({ component, value, onChange }: { component: FieldReviewComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const [editing, setEditing] = useState(false)
  const shownValue = typeof value === 'string' ? value : component.value
  return (
    <section className="group rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Fingerprint size={18} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{component.label}</p>
              {component.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><BadgeCheck size={12} /> Verified</span>}
            </div>
            {editing ? (
              <input autoFocus value={shownValue} onChange={(event) => onChange(component.fieldId, event.target.value)} className="mt-3 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-base font-semibold text-slate-950 outline-none ring-4 ring-emerald-100" type={component.inputType ?? 'text'} />
            ) : (
              <p className="mt-2 text-base font-semibold leading-6 text-slate-950">{shownValue}</p>
            )}
            <InfoDisclosure label="Source and details"><p>Source: {component.source}</p>{component.lastConfirmed && <p>Confirmed {component.lastConfirmed}</p>}{component.helper && <p>{component.helper}</p>}</InfoDisclosure>
          </div>
        </div>
        {component.editable && <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">{editing ? 'Done' : 'Change'}</button>}
      </div>
    </section>
  )
}

const inputClass = 'mt-2.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100'

function InputField({ component, value, onChange, invalid }: { component: InputComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const current = typeof value === 'string' ? value : component.required ? '' : component.value ?? ''
  return (
    <label className={`block rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <span className="flex items-center justify-between gap-4 text-sm font-bold text-slate-900"><span className="flex items-center gap-1">{component.label}{component.helper && <InfoTooltip text={component.helper} />}</span>{component.required && <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</span>
      <span className="relative block">
        {component.prefix && <span className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-bold text-slate-500">{component.prefix}</span>}
        <input className={`${inputClass} ${component.prefix ? 'pl-9' : ''} ${component.suffix ? 'pr-12' : ''}`} type={component.inputType ?? 'text'} value={current} placeholder={component.placeholder} onChange={(event) => onChange(component.fieldId, event.target.value)} />
        {component.suffix && <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-bold text-slate-500">{component.suffix}</span>}
      </span>
      <ValidationMessage invalid={invalid} />
    </label>
  )
}

function SelectField({ component, value, onChange, invalid }: { component: SelectComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const current = typeof value === 'string' ? value : component.required ? '' : component.value ?? ''
  return (
    <label className={`block rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <span className="flex items-center justify-between gap-4 text-sm font-bold text-slate-900"><span className="flex items-center gap-1">{component.label}{component.helper && <InfoTooltip text={component.helper} />}</span>{component.required && <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</span>
      <span className="relative block">
        <select className={`${inputClass} appearance-none pr-11`} value={current} onChange={(event) => onChange(component.fieldId, event.target.value)}>
          <option value="">{component.placeholder}</option>
          {component.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400" size={18} />
      </span>
      <ValidationMessage invalid={invalid} />
    </label>
  )
}

const choiceIcons = { property: Building2, inheritance: Landmark, savings: Sparkles, business: Building2, household: UsersRound, other: CircleAlert }

function ChoiceCards({ component, value, onChange, invalid }: { component: ChoiceComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const current = typeof value === 'string' ? value : component.required ? undefined : component.value
  return (
    <fieldset className={`rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <legend className="sr-only">{component.label}</legend>
      <div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-950">{component.label}</p>{component.required && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">Required</span>}</div>
      <div className={`mt-4 grid gap-3 ${component.layout === 'row' ? 'sm:grid-cols-2' : component.options.length > 2 ? 'sm:grid-cols-2' : ''}`}>
        {component.options.map((option) => {
          const selected = current === option.value
          const Icon = choiceIcons[option.value as keyof typeof choiceIcons] ?? ArrowRight
          return (
            <button key={option.value} type="button" onClick={() => onChange(component.fieldId, option.value)} className={`relative flex min-h-16 items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'}`}>
              <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selected ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}</span>
              <span className="flex min-w-0 items-center gap-1"><span className="block text-sm font-bold text-slate-950">{option.label}</span>{option.description && <InfoTooltip text={option.description} />}</span>
            </button>
          )
        })}
      </div>
      <ValidationMessage invalid={invalid} />
    </fieldset>
  )
}

function Comparison({ component, value, onChange, invalid }: { component: ComparisonComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const current = typeof value === 'string' ? value : undefined
  return (
    <section className={`rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><RefreshCw size={17} /></div><div className="flex min-w-0 flex-1 items-center gap-1.5"><h3 className="font-bold text-slate-950">{component.title}</h3><InfoTooltip text={component.description} />{component.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {component.options.map((option) => {
          const selected = current === option.value
          return <button key={option.value} type="button" onClick={() => onChange(component.fieldId, option.value)} className={`relative rounded-2xl border p-5 text-left transition ${selected ? 'border-violet-500 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-300'}`}>
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{option.label}</span>{option.verified && <BadgeCheck className="text-emerald-600" size={17} />}</div>
            <div className="mt-3 space-y-0.5">{option.lines.map((line) => <p key={line} className="text-sm font-semibold text-slate-900">{line}</p>)}</div>
            <p className="mt-4 border-t border-slate-200/80 pt-3 text-[11px] leading-4 text-slate-500">{option.source}</p>
            {selected && <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-violet-600 text-white"><Check size={14} strokeWidth={3} /></span>}
          </button>
        })}
      </div>
      <ValidationMessage invalid={invalid} message="Select the current value before continuing." />
    </section>
  )
}

function Upload({ component, value, onChange, invalid }: { component: UploadComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const inputId = useId()
  const file = value instanceof File ? value : null
  const [fileError, setFileError] = useState<string | null>(null)
  const selectFile = (selected: File | null) => {
    if (selected && component.maxSizeMb && selected.size > component.maxSizeMb * 1024 * 1024) {
      setFileError(`The file exceeds the ${component.maxSizeMb} MB limit.`)
      onChange(component.fieldId, null)
      return
    }
    setFileError(null)
    onChange(component.fieldId, selected)
  }
  return (
    <section className={`rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <div className="flex items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><FileUp size={17} /></div><div className="flex min-w-0 flex-1 items-center gap-1.5"><h3 className="font-bold text-slate-950">{component.title}</h3><InfoTooltip text={component.description} />{component.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</div></div>
      <label htmlFor={inputId} className={`mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition ${file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'}`}>
        {file ? <><FileCheck2 className="text-emerald-600" size={28} /><span className="mt-2 text-sm font-bold text-emerald-900">{file.name}</span><span className="mt-1 text-xs text-emerald-700">Ready to submit · click to replace</span></> : <><FileUp className="text-slate-400" size={28} /><span className="mt-2 text-sm font-bold text-slate-800">Choose a file or take a photo</span><span className="mt-1 text-xs text-slate-500">{component.accepted}</span></>}
        <input id={inputId} className="sr-only" type="file" accept="image/*,.pdf" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
      </label>
      {(component.instructions || component.documentDateRule || component.examples) && <InfoDisclosure label="Document guidance">{component.documentDateRule && <p className="mb-2 flex items-start gap-2 font-semibold text-amber-700"><CalendarClock className="mt-0.5 shrink-0" size={14} />{component.documentDateRule}</p>}{component.instructions && <ul className="space-y-1.5">{component.instructions.map((instruction) => <li key={instruction} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={14} />{instruction}</li>)}</ul>}{component.examples && <p className="mt-2">Accepted examples: {component.examples.join(', ')}.</p>}</InfoDisclosure>}
      <ValidationMessage invalid={invalid} message="Upload the requested evidence before continuing." />
      {fileError && <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-700"><CircleAlert size={14} />{fileError}</p>}
    </section>
  )
}

function Declaration({ component, value, onChange, invalid }: { component: DeclarationComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const checked = value === true
  return (
    <section className={`rounded-2xl border p-4 transition ${checked ? 'border-emerald-300 bg-emerald-50/70' : invalid ? 'border-rose-400 bg-white ring-4 ring-rose-100' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3"><div className={`grid size-9 shrink-0 place-items-center rounded-xl ${checked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}><LockKeyhole size={17} /></div><div className="flex min-w-0 flex-1 items-center gap-1.5"><h3 className="font-bold text-slate-950">{component.title}</h3><InfoTooltip text={component.body} label="What you are confirming" />{component.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</div></div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(component.fieldId, event.target.checked)} className="mt-0.5 size-5 rounded border-slate-300 accent-emerald-600" />
        <span className="text-sm font-bold leading-5 text-slate-900">{component.checkboxLabel}</span>
      </label>
      {component.legalNote && <InfoDisclosure label="Legal and evidence details">{component.legalNote}</InfoDisclosure>}
      <ValidationMessage invalid={invalid} message="Accept this declaration before continuing." />
    </section>
  )
}

function Relationship({ component }: { component: RelationshipComponent }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><UsersRound size={19} /></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-500">{component.product}</p><h3 className="font-bold text-slate-950">{component.title}</h3></div></div>
      <div className="mt-5 space-y-3">{component.people.map((person) => <div key={person.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid size-10 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{person.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{person.name}</span><span className="block text-xs text-slate-500">{person.role}</span></span><span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><BadgeCheck size={15} /> {person.status === 'verified' ? 'Verified' : 'Pending'}</span></div>)}</div>
      {component.ownership && <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-xs leading-5 text-cyan-900">{component.ownership}</p>}
    </section>
  )
}

function TransactionProfile({ component, responses, onChange }: { component: TransactionProfileComponent; responses: ResponseState; onChange: RendererProps['onChange'] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
      <div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-orange-100 text-orange-700"><CalendarClock size={19} /></div><h3 className="font-bold text-slate-950">{component.title}</h3></div></div>
      <div className="grid lg:grid-cols-2">
        <div className="bg-slate-950 p-5 text-white sm:p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-slate-400">Observed · last 90 days</p><div className="mt-5 space-y-4">{component.observed.map((item) => <div key={item.label} className="flex items-end justify-between gap-4 border-b border-white/10 pb-3"><span className="text-xs text-slate-400">{item.label}</span><span className={`text-right text-sm font-bold ${item.highlight ? 'text-amber-300' : 'text-white'}`}>{item.value}</span></div>)}</div></div>
        <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">Tell us what to expect</p><div className="mt-4 space-y-4">{component.expected.map((item) => <label key={item.fieldId} className="block"><span className="text-xs font-semibold text-slate-600">{item.label}</span><select className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={typeof responses[item.fieldId] === 'string' ? String(responses[item.fieldId]) : item.value} onChange={(event) => onChange(item.fieldId, event.target.value)}>{item.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></div>
      </div>
    </section>
  )
}

function Verification({ component, value, onChange, invalid }: { component: VerificationComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const selected = typeof value === 'string' ? value : undefined
  return (
    <section className={`rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-700"><ShieldAlert size={17} /></div><h3 className="font-bold text-slate-950">{component.title}</h3>{component.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</div>
      <div className="mt-5 space-y-2">{component.attempts.map((attempt) => <div key={attempt.timestamp} className="flex items-center gap-3 rounded-2xl bg-rose-50 p-3"><CircleAlert className="shrink-0 text-rose-600" size={17} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{attempt.label}</p><p className="text-xs text-slate-500">{attempt.timestamp}</p></div><span className="text-xs font-bold text-rose-700">{attempt.result}</span></div>)}</div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-slate-500">Choose another method</p>
      <div className="mt-3 grid gap-3">{component.alternatives.map((alternative) => <button key={alternative.value} type="button" onClick={() => onChange(component.fieldId, alternative.value)} className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${selected === alternative.value ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'}`}><span className={`grid size-9 place-items-center rounded-xl ${selected === alternative.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}><UserRound size={17} /></span><span className="flex min-w-0 flex-1 items-center gap-1"><span className="block text-sm font-bold text-slate-950">{alternative.label}</span><InfoTooltip text={alternative.description} /></span><ArrowRight className="text-slate-400" size={17} /></button>)}</div>
      <ValidationMessage invalid={invalid} message="Choose a verification method before continuing." />
    </section>
  )
}

function Summary({ component }: { component: SummaryComponent }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><FileCheck2 size={19} /></div><h3 className="font-bold text-slate-950">{component.title}</h3></div>
      <div className="mt-5 divide-y divide-slate-100">{component.items.map((item) => <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="text-sm text-slate-500">{item.label}</span><span className={`text-right text-sm font-bold ${item.state === 'changed' ? 'text-violet-700' : item.state === 'pending' ? 'text-amber-700' : 'text-slate-900'}`}>{item.value}</span></div>)}</div>
    </section>
  )
}

function StructuredAddress({ component, value, onChange, invalid }: { component: StructuredAddressComponent; value?: ResponseValue; onChange: RendererProps['onChange']; invalid?: boolean }) {
  const address = value && typeof value === 'object' && !(value instanceof File)
    ? value as StructuredAddressValue
    : component.value ?? { country: '', street: '', houseNumber: '', postcode: '', city: '', region: '' }
  const update = (field: keyof StructuredAddressValue, nextValue: string) => onChange(component.fieldId, { ...address, [field]: nextValue })
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100'
  return (
    <section className={`rounded-2xl border bg-white p-4 ${invalid ? 'border-rose-400 ring-4 ring-rose-100' : 'border-slate-200/80'}`}>
      <div className="flex items-center gap-2"><MapPin className="shrink-0 text-emerald-600" size={18} /><h3 className="font-bold text-slate-950">{component.title}</h3>{component.description && <InfoTooltip text={component.description} />}{component.required && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-rose-600">Required</span>}</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Country</span><select className={fieldClass} value={address.country} onChange={(event) => update('country', event.target.value)}><option value="">Choose a country</option>{component.countryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Street</span><input className={fieldClass} value={address.street} onChange={(event) => update('street', event.target.value)} placeholder="Street name" /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">House number and apartment</span><input className={fieldClass} value={address.houseNumber} onChange={(event) => update('houseNumber', event.target.value)} placeholder="Number, apartment or PO box" /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Postcode</span><input className={fieldClass} value={address.postcode} onChange={(event) => update('postcode', event.target.value)} placeholder="Postcode" /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">City or locality</span><input className={fieldClass} value={address.city} onChange={(event) => update('city', event.target.value)} placeholder="City" /></label>
        <label className="block sm:col-span-2"><span className="text-xs font-bold text-slate-600">Region {component.requireRegion ? '' : '(optional)'}</span><input className={fieldClass} value={address.region ?? ''} onChange={(event) => update('region', event.target.value)} placeholder="State, province or region" /></label>
      </div>
      {component.proofHint && <InfoDisclosure label="Address evidence guidance">{component.proofHint}</InfoDisclosure>}
      <ValidationMessage invalid={invalid} message="Complete every required part of the address." />
    </section>
  )
}

function profileValue(field: ProfileOverviewComponent['sections'][number]['fields'][number], responses: ResponseState) {
  const editor = field.editComponent
  const response = responses[editor.fieldId]
  if (response === undefined || response === null) return field.value
  if (editor.type === 'structured_address' && typeof response === 'object' && !(response instanceof File)) {
    const address = response as StructuredAddressValue
    const country = editor.countryOptions.find((option) => option.value === address.country)?.label ?? address.country
    return [address.street, address.houseNumber, `${address.postcode} ${address.city}`.trim(), country].filter(Boolean).join(', ')
  }
  if (typeof response === 'string' && (editor.type === 'select' || editor.type === 'choice')) {
    return editor.options.find((option) => option.value === response)?.label ?? response
  }
  return typeof response === 'string' ? response : field.value
}

function ProfileOverview({ component, responses, onChange }: { component: ProfileOverviewComponent; responses: ResponseState; onChange: RendererProps['onChange'] }) {
  const [open, setOpen] = useState(!component.collapsedByDefault)
  const [editing, setEditing] = useState<string | null>(null)
  const [editingOriginal, setEditingOriginal] = useState<ResponseValue>(null)
  const [editInvalid, setEditInvalid] = useState(false)
  const [savedFields, setSavedFields] = useState<Set<string>>(() => new Set())
  const fields = component.sections.flatMap((section) => section.fields)
  const editingField = fields.find((field) => field.editComponent.fieldId === editing)

  const startEdit = (field: ProfileOverviewComponent['sections'][number]['fields'][number]) => {
    const original = responses[field.editComponent.fieldId] ?? ('value' in field.editComponent ? field.editComponent.value ?? null : null)
    setEditing(field.editComponent.fieldId)
    setEditingOriginal(original)
    onChange(field.editComponent.fieldId, original)
    setEditInvalid(false)
  }

  const cancelEdit = (field: ProfileOverviewComponent['sections'][number]['fields'][number]) => {
    onChange(field.editComponent.fieldId, editingOriginal)
    setEditing(null)
    setEditInvalid(false)
  }

  const saveEdit = (field: ProfileOverviewComponent['sections'][number]['fields'][number]) => {
    if (!isRequiredComponentComplete(field.editComponent, responses)) {
      setEditInvalid(true)
      return
    }
    setSavedFields((current) => new Set(current).add(field.editComponent.fieldId))
    setEditing(null)
    setEditInvalid(false)
  }

  useEffect(() => {
    if (!editingField) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelEdit(editingField)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingField, editingOriginal])

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50 sm:p-6">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-700"><UserRound size={20} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">{component.title}</h3><span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700"><Pencil size={10} /> Editable</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{component.description}</p></div>
          <ChevronDown className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={20} />
        </button>
        {open && <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">{component.sections.map((section) => <div key={section.title} className="self-start rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{section.title}</p><div className="mt-3 divide-y divide-slate-100">{section.fields.map((field) => {
            const fieldId = field.editComponent.fieldId
            const changed = savedFields.has(fieldId)
            const isEditing = editing === fieldId
            return <div key={fieldId} className={`-mx-2 rounded-xl px-2 py-3 first:pt-0 last:pb-0 ${isEditing ? 'bg-emerald-50/70 ring-1 ring-emerald-100' : ''}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><p className="text-[11px] font-semibold text-slate-500">{field.label}</p>{field.verified && <BadgeCheck className="text-emerald-600" size={13} />}{changed && <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700">Changed</span>}</div><p className="mt-0.5 break-words text-sm font-bold text-slate-900">{profileValue(field, responses)}</p>{field.source && <p className="mt-1 text-[10px] text-slate-400">{field.source}</p>}</div><button type="button" onClick={() => startEdit(field)} aria-label={`Edit ${field.label}`} className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition ${isEditing ? 'border-emerald-300 bg-white text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}><Pencil size={11} />{isEditing ? 'Editing' : 'Edit'}</button></div></div>
          })}</div></div>)}</div>
        </div>}
      </section>

      {editingField && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={() => cancelEdit(editingField)}>
        <section role="dialog" aria-modal="true" aria-labelledby={`edit-${editingField.editComponent.fieldId}-title`} className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_32px_100px_-24px_rgba(15,23,42,.65)] sm:max-h-[88vh] sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
          <header className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Pencil size={19} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Update your information</p>
              <h3 id={`edit-${editingField.editComponent.fieldId}-title`} className="mt-1 text-xl font-bold text-slate-950">Edit {editingField.label}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>Currently on file: <strong className="font-semibold text-slate-700">{editingField.value}</strong></span>
                {editingField.source && <span>Source: {editingField.source}</span>}
                {editingField.verified && <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><BadgeCheck size={13} /> Verified</span>}
              </div>
            </div>
            <button type="button" onClick={() => cancelEdit(editingField)} aria-label="Close editor without saving" className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={20} /></button>
          </header>

          {editingField.verified && <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3.5 text-xs leading-5 text-amber-900 sm:px-7"><LockKeyhole className="mt-0.5 shrink-0 text-amber-700" size={16} /><p><strong>Verified detail.</strong> Saving a change may create a review task so we can keep your identity record accurate.</p></div>}

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
            <SduiRenderer component={editingField.editComponent} responses={responses} onChange={(id, value) => { setEditInvalid(false); onChange(id, value) }} invalidFields={editInvalid ? [editingField.editComponent.fieldId] : []} />
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="hidden max-w-sm text-xs leading-5 text-slate-500 sm:block">Only this detail will be updated. Your other information remains unchanged.</p>
            <div className="flex gap-3 sm:ml-auto">
              <button type="button" onClick={() => cancelEdit(editingField)} className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none">Cancel</button>
              <button type="button" onClick={() => saveEdit(editingField)} className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:flex-none">Save change</button>
            </div>
          </footer>
        </section>
      </div>}
    </>
  )
}

export function SduiRenderer({ component, responses, onChange, invalidFields = [] }: RendererProps) {
  if (!isComponentVisible(component, responses)) return null
  const valueFor = (fieldId: string) => responses[fieldId]
  const invalid = (fieldId: string) => invalidFields.includes(fieldId)
  switch (component.type) {
    case 'notice': return <Notice component={component} />
    case 'field_review': return <FieldReview component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'input': return <InputField component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'select': return <SelectField component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'choice': return <ChoiceCards component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'comparison': return <Comparison component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'upload': return <Upload component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'declaration': return <Declaration component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'relationship': return <Relationship component={component} />
    case 'transaction_profile': return <TransactionProfile component={component} responses={responses} onChange={onChange} />
    case 'verification': return <Verification component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'summary': return <Summary component={component} />
    case 'structured_address': return <StructuredAddress component={component} value={valueFor(component.fieldId)} onChange={onChange} invalid={invalid(component.fieldId)} />
    case 'profile_overview': return <ProfileOverview component={component} responses={responses} onChange={onChange} />
  }
}
