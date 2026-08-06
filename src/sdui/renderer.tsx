import { useId, useState } from 'react'
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
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type {
  ChoiceComponent,
  ComparisonComponent,
  DeclarationComponent,
  FieldReviewComponent,
  InputComponent,
  NoticeComponent,
  RelationshipComponent,
  ResponseState,
  ResponseValue,
  SelectComponent,
  SduiComponent,
  SummaryComponent,
  Tone,
  TransactionProfileComponent,
  UploadComponent,
  VerificationComponent,
} from '../types/sdui'

type RendererProps = {
  component: SduiComponent
  responses: ResponseState
  onChange: (fieldId: string, value: ResponseValue) => void
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
    <section className={`rounded-3xl border p-5 sm:p-6 ${styles.shell}`}>
      <div className="flex items-start gap-4">
        <div className={`grid size-10 shrink-0 place-items-center rounded-2xl shadow-sm ${styles.icon}`}><Icon size={19} /></div>
        <div>
          {component.eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{component.eyebrow}</p>}
          <h3 className="text-base font-bold text-slate-950">{component.title}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{component.body}</p>
        </div>
      </div>
    </section>
  )
}

function FieldReview({ component, value, onChange }: { component: FieldReviewComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const [editing, setEditing] = useState(false)
  const shownValue = typeof value === 'string' ? value : component.value
  return (
    <section className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_-30px_rgba(15,23,42,.45)] transition hover:border-emerald-200 hover:shadow-[0_18px_50px_-30px_rgba(5,150,105,.35)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Fingerprint size={20} /></div>
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
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Source: {component.source}</span>
              {component.lastConfirmed && <span>Confirmed {component.lastConfirmed}</span>}
            </div>
            {component.helper && <p className="mt-2 text-xs leading-5 text-slate-500">{component.helper}</p>}
          </div>
        </div>
        {component.editable && <button type="button" onClick={() => setEditing((current) => !current)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700">{editing ? 'Done' : 'Change'}</button>}
      </div>
    </section>
  )
}

const inputClass = 'mt-2.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100'

function InputField({ component, value, onChange }: { component: InputComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const current = typeof value === 'string' ? value : component.value ?? ''
  return (
    <label className="block rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <span className="flex items-center justify-between gap-4 text-sm font-bold text-slate-900">{component.label}{component.required && <span className="text-xs font-semibold text-rose-500">Required</span>}</span>
      <span className="relative block">
        {component.prefix && <span className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-bold text-slate-500">{component.prefix}</span>}
        <input className={`${inputClass} ${component.prefix ? 'pl-9' : ''} ${component.suffix ? 'pr-12' : ''}`} type={component.inputType ?? 'text'} value={current} placeholder={component.placeholder} onChange={(event) => onChange(component.fieldId, event.target.value)} />
        {component.suffix && <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-bold text-slate-500">{component.suffix}</span>}
      </span>
      {component.helper && <span className="mt-2 block text-xs leading-5 text-slate-500">{component.helper}</span>}
    </label>
  )
}

function SelectField({ component, value, onChange }: { component: SelectComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const current = typeof value === 'string' ? value : component.value ?? ''
  return (
    <label className="block rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <span className="flex items-center justify-between gap-4 text-sm font-bold text-slate-900">{component.label}{component.required && <span className="text-xs font-semibold text-rose-500">Required</span>}</span>
      <span className="relative block">
        <select className={`${inputClass} appearance-none pr-11`} value={current} onChange={(event) => onChange(component.fieldId, event.target.value)}>
          <option value="">{component.placeholder}</option>
          {component.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400" size={18} />
      </span>
      {component.helper && <span className="mt-2 block text-xs leading-5 text-slate-500">{component.helper}</span>}
    </label>
  )
}

const choiceIcons = { property: Building2, inheritance: Landmark, savings: Sparkles, business: Building2, household: UsersRound, other: CircleAlert }

function ChoiceCards({ component, value, onChange }: { component: ChoiceComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const current = typeof value === 'string' ? value : component.value
  return (
    <fieldset className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <legend className="sr-only">{component.label}</legend>
      <p className="text-sm font-bold text-slate-950">{component.label}</p>
      <div className={`mt-4 grid gap-3 ${component.layout === 'row' ? 'sm:grid-cols-2' : component.options.length > 2 ? 'sm:grid-cols-2' : ''}`}>
        {component.options.map((option) => {
          const selected = current === option.value
          const Icon = choiceIcons[option.value as keyof typeof choiceIcons] ?? ArrowRight
          return (
            <button key={option.value} type="button" onClick={() => onChange(component.fieldId, option.value)} className={`relative flex min-h-16 items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'}`}>
              <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selected ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}</span>
              <span><span className="block text-sm font-bold text-slate-950">{option.label}</span>{option.description && <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Comparison({ component, value, onChange }: { component: ComparisonComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const current = typeof value === 'string' ? value : undefined
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><RefreshCw size={18} /></div><div><h3 className="font-bold text-slate-950">{component.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{component.description}</p></div></div>
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
    </section>
  )
}

function Upload({ component, value, onChange }: { component: UploadComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const inputId = useId()
  const file = value instanceof File ? value : null
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><FileUp size={20} /></div><div><h3 className="font-bold text-slate-950">{component.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{component.description}</p></div></div>
      <label htmlFor={inputId} className={`mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'}`}>
        {file ? <><FileCheck2 className="text-emerald-600" size={28} /><span className="mt-2 text-sm font-bold text-emerald-900">{file.name}</span><span className="mt-1 text-xs text-emerald-700">Ready to submit · click to replace</span></> : <><FileUp className="text-slate-400" size={28} /><span className="mt-2 text-sm font-bold text-slate-800">Choose a file or take a photo</span><span className="mt-1 text-xs text-slate-500">{component.accepted}</span></>}
        <input id={inputId} className="sr-only" type="file" accept="image/*,.pdf" onChange={(event) => onChange(component.fieldId, event.target.files?.[0] ?? null)} />
      </label>
      {component.examples && <div className="mt-3 flex flex-wrap gap-2">{component.examples.map((example) => <span key={example} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{example}</span>)}</div>}
    </section>
  )
}

function Declaration({ component, value, onChange }: { component: DeclarationComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const checked = value === true
  return (
    <section className={`rounded-3xl border p-5 transition sm:p-6 ${checked ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-4"><div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${checked ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}><LockKeyhole size={19} /></div><div><h3 className="font-bold text-slate-950">{component.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{component.body}</p></div></div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(component.fieldId, event.target.checked)} className="mt-0.5 size-5 rounded border-slate-300 accent-emerald-600" />
        <span className="text-sm font-bold leading-5 text-slate-900">{component.checkboxLabel}</span>
      </label>
      {component.legalNote && <p className="mt-3 text-[11px] leading-5 text-slate-500">{component.legalNote}</p>}
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

function Verification({ component, value, onChange }: { component: VerificationComponent; value?: ResponseValue; onChange: RendererProps['onChange'] }) {
  const selected = typeof value === 'string' ? value : undefined
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldAlert size={19} /></div><h3 className="font-bold text-slate-950">{component.title}</h3></div>
      <div className="mt-5 space-y-2">{component.attempts.map((attempt) => <div key={attempt.timestamp} className="flex items-center gap-3 rounded-2xl bg-rose-50 p-3"><CircleAlert className="shrink-0 text-rose-600" size={17} /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{attempt.label}</p><p className="text-xs text-slate-500">{attempt.timestamp}</p></div><span className="text-xs font-bold text-rose-700">{attempt.result}</span></div>)}</div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-slate-500">Choose another method</p>
      <div className="mt-3 grid gap-3">{component.alternatives.map((alternative) => <button key={alternative.value} type="button" onClick={() => onChange('verification_method', alternative.value)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected === alternative.value ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'}`}><span className={`grid size-9 place-items-center rounded-xl ${selected === alternative.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}><UserRound size={17} /></span><span className="flex-1"><span className="block text-sm font-bold text-slate-950">{alternative.label}</span><span className="block text-xs text-slate-500">{alternative.description}</span></span><ArrowRight className="text-slate-400" size={17} /></button>)}</div>
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

export function SduiRenderer({ component, responses, onChange }: RendererProps) {
  const valueFor = (fieldId: string) => responses[fieldId]
  switch (component.type) {
    case 'notice': return <Notice component={component} />
    case 'field_review': return <FieldReview component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'input': return <InputField component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'select': return <SelectField component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'choice': return <ChoiceCards component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'comparison': return <Comparison component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'upload': return <Upload component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'declaration': return <Declaration component={component} value={valueFor(component.fieldId)} onChange={onChange} />
    case 'relationship': return <Relationship component={component} />
    case 'transaction_profile': return <TransactionProfile component={component} responses={responses} onChange={onChange} />
    case 'verification': return <Verification component={component} value={valueFor('verification_method')} onChange={onChange} />
    case 'summary': return <Summary component={component} />
  }
}
