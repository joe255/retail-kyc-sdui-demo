import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Eye,
  Filter,
  LayoutPanelLeft,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { getCustomers, getJourney, resetDemo, submitScreen } from './lib/api'
import { customerProgress, statusLabel } from './lib/status'
import { missingRequiredFields } from './lib/conditions'
import { SduiRenderer } from './sdui/renderer'
import type {
  CustomerListPayload,
  CustomerStatus,
  CustomerSummary,
  JourneyPayload,
  ResponseState,
  ResponseValue,
} from './types/sdui'

type FilterValue = CustomerStatus | 'all'

const statusStyles: Record<CustomerStatus, string> = {
  action_required: 'bg-amber-100 text-amber-800 ring-amber-200',
  under_review: 'bg-blue-100 text-blue-800 ring-blue-200',
  complete: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  restricted: 'bg-rose-100 text-rose-800 ring-rose-200',
}

const statusDot: Record<CustomerStatus, string> = {
  action_required: 'bg-amber-500',
  under_review: 'bg-blue-500',
  complete: 'bg-emerald-500',
  restricted: 'bg-rose-500',
}

function StatusPill({ status }: { status: CustomerStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}><span className={`size-1.5 rounded-full ${statusDot[status]}`} />{statusLabel[status]}</span>
}

function CustomerCard({ customer, selected, onClick }: { customer: CustomerSummary; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full rounded-2xl border p-3.5 text-left transition ${selected ? 'border-emerald-400 bg-emerald-50 shadow-[0_12px_30px_-24px_rgba(5,150,105,.8)] ring-2 ring-emerald-100' : 'border-transparent hover:border-slate-200 hover:bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${selected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{customer.initials}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2"><span className="truncate text-sm font-bold text-slate-950">{customer.name}</span><ChevronRight className={`shrink-0 ${selected ? 'text-emerald-600' : 'text-slate-300'}`} size={16} /></span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">{customer.scenario}</span>
          <span className="mt-2 flex items-center justify-between gap-2"><StatusPill status={customer.status} /><span className="truncate text-[10px] font-semibold text-slate-400">{customer.dueLabel}</span></span>
        </span>
      </div>
    </button>
  )
}

function Sidebar({ payload, selectedId, filter, query, onFilter, onQuery, onSelect, open, onClose }: {
  payload: CustomerListPayload
  selectedId: string
  filter: FilterValue
  query: string
  onFilter: (filter: FilterValue) => void
  onQuery: (query: string) => void
  onSelect: (id: string) => void
  open: boolean
  onClose: () => void
}) {
  const filtered = payload.customers.filter((customer) => {
    const matchesFilter = filter === 'all' || customer.status === filter
    const search = query.trim().toLowerCase()
    return matchesFilter && (!search || `${customer.name} ${customer.scenario} ${customer.tags.join(' ')}`.toLowerCase().includes(search))
  })
  const filters: Array<{ value: FilterValue; label: string; count: number }> = [
    { value: 'all', label: 'All', count: payload.customers.length },
    { value: 'action_required', label: 'Action', count: payload.statusCounts.action_required },
    { value: 'under_review', label: 'Review', count: payload.statusCounts.under_review },
    { value: 'complete', label: 'Done', count: payload.statusCounts.complete },
    { value: 'restricted', label: 'Paused', count: payload.statusCounts.restricted },
  ]
  return (
    <>
      {open && <button type="button" aria-label="Close scenarios" className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[340px] max-w-[90vw] flex-col border-r border-slate-200 bg-slate-50 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-emerald-300 shadow-lg shadow-slate-950/15"><Sparkles size={19} /></div><div><p className="text-sm font-black tracking-tight text-slate-950">Northstar</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Retail KYC studio</p></div></div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-white lg:hidden"><X size={18} /></button>
        </div>
        <div className="border-b border-slate-200 p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Find a scenario…" className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" /></div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">{filters.map((item) => <button key={item.value} type="button" onClick={() => onFilter(item.value)} className={`shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition ${filter === item.value ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900'}`}>{item.label} · {item.count}</button>)}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-2 flex items-center justify-between px-2"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Synthetic portfolio</p><span className="text-[10px] font-semibold text-slate-400">{filtered.length} shown</span></div><div className="space-y-1">{filtered.map((customer) => <CustomerCard key={customer.id} customer={customer} selected={customer.id === selectedId} onClick={() => onSelect(customer.id)} />)}</div></div>
        <div className="border-t border-slate-200 p-4"><div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"><div className="flex items-center gap-2 text-xs font-bold text-slate-800"><Code2 className="text-emerald-600" size={15} /> Backend-driven demo</div><p className="mt-1.5 text-[11px] leading-4 text-slate-500">Every screen and component is delivered by the demo API. All people and values are fictional.</p></div></div>
      </aside>
    </>
  )
}

function PayloadDrawer({ journey, open, onClose }: { journey: JourneyPayload; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/45 backdrop-blur-sm" onMouseDown={onClose}>
      <aside className="flex h-full w-full max-w-2xl flex-col bg-[#07110f] text-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><Braces size={18} /></div><div><h2 className="text-sm font-bold">Live SDUI payload</h2><p className="text-[11px] text-slate-400">{journey.contractVersion} · delivered by GET /journey</p></div></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"><X size={18} /></button></header>
        <div className="border-b border-white/10 bg-emerald-400/5 px-5 py-3 text-xs leading-5 text-emerald-100 sm:px-6">The frontend knows how to render registered component types. It does not contain scenario-specific pages.</div>
        <pre className="min-h-0 flex-1 overflow-auto p-5 font-mono text-[11px] leading-5 text-slate-300 sm:p-6"><code>{JSON.stringify(journey, null, 2)}</code></pre>
      </aside>
    </div>
  )
}

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-slate-100"><div className="flex flex-col items-center"><div className="grid size-14 place-items-center rounded-3xl bg-slate-950 text-emerald-300 shadow-xl"><RefreshCw className="animate-spin" size={22} /></div><p className="mt-4 text-sm font-bold text-slate-900">Loading SDUI contract…</p><p className="mt-1 text-xs text-slate-500">Fetching scenarios from the demo backend</p></div></div>
}

function App() {
  const [list, setList] = useState<CustomerListPayload | null>(null)
  const [journey, setJourney] = useState<JourneyPayload | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [currentScreen, setCurrentScreen] = useState(0)
  const [responses, setResponses] = useState<ResponseState>({})
  const [filter, setFilter] = useState<FilterValue>('all')
  const [query, setQuery] = useState('')
  const [payloadOpen, setPayloadOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [presenterMode, setPresenterMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [validationFields, setValidationFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCustomers().then((payload) => {
      setList(payload)
      const first = payload.customers.find((customer) => customer.status === 'action_required') ?? payload.customers[0]
      if (first) setSelectedId(first.id)
    }).catch((reason: Error) => setError(reason.message))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setJourney(null)
    setCurrentScreen(0)
    setResponses({})
    setValidationFields([])
    getJourney(selectedId).then(setJourney).catch((reason: Error) => setError(reason.message))
  }, [selectedId])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3400)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const screen = journey?.customer.screens[currentScreen]
  const progress = journey ? customerProgress(journey.customer, currentScreen) : 0
  const selectedSummary = useMemo(() => list?.customers.find((customer) => customer.id === selectedId), [list, selectedId])

  const selectCustomer = (id: string) => {
    setSelectedId(id)
    setSidebarOpen(false)
  }

  const changeResponse = (fieldId: string, value: ResponseValue) => {
    setResponses((current) => ({ ...current, [fieldId]: value }))
    setValidationFields((current) => current.filter((candidate) => candidate !== fieldId))
  }

  const advance = async () => {
    if (!journey || !screen) return
    const missing = missingRequiredFields(screen, responses)
    if (missing.length) {
      setValidationFields(missing)
      setToast(`Complete ${missing.length} required field${missing.length === 1 ? '' : 's'} to continue`)
      return
    }
    setSubmitting(true)
    try {
      const receipt = await submitScreen(journey.customer.id, screen.id, responses)
      if (receipt.nextScreenId) {
        setCurrentScreen((current) => current + 1)
        setValidationFields([])
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setToast(`Submitted · ${receipt.submissionId.slice(0, 8)}`)
      }
    } catch (reason) {
      setToast(reason instanceof Error ? 'Submission failed' : 'Please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = async () => {
    await resetDemo()
    setResponses({})
    setValidationFields([])
    setCurrentScreen(0)
    setToast('Demo state reset')
  }

  if (!list || !journey || !screen) {
    if (error) return <div className="grid min-h-screen place-items-center bg-slate-100 p-8"><div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><CircleAlert className="mx-auto text-rose-600" size={32} /><h1 className="mt-4 text-xl font-black">The demo API is unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-500">Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code> to start both the backend and Vite.</p></div></div>
    return <LoadingScreen />
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f5] text-slate-950">
      {!presenterMode && <Sidebar payload={list} selectedId={selectedId} filter={filter} query={query} onFilter={setFilter} onQuery={setQuery} onSelect={selectCustomer} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f4f6f5]/90 px-4 backdrop-blur-xl sm:px-6 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            {!presenterMode && <button type="button" onClick={() => setSidebarOpen(true)} className="grid size-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 lg:hidden"><Menu size={19} /></button>}
            {presenterMode && <div className="hidden items-center gap-3 sm:flex"><div className="grid size-9 place-items-center rounded-xl bg-slate-950 text-emerald-300"><Sparkles size={17} /></div><span className="text-sm font-black">Northstar KYC</span></div>}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[.12em] text-slate-400">{journey.customer.bookingEntity}</p><p className="truncate text-sm font-bold text-slate-800">Customer data review</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-violet-700 md:inline-flex"><Sparkles size={12} /> Synthetic data</span>
            <button type="button" onClick={() => setPayloadOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"><Braces size={16} /><span className="hidden sm:inline">View payload</span></button>
            <button type="button" onClick={() => setPresenterMode((current) => !current)} className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold shadow-sm transition ${presenterMode ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}><Eye size={16} /><span className="hidden md:inline">{presenterMode ? 'Exit presenter' : 'Presenter'}</span></button>
            <button type="button" onClick={reset} title="Reset demo state" className="grid size-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-emerald-700"><RefreshCw size={16} /></button>
          </div>
        </header>

        <div className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 xl:px-10 ${presenterMode ? 'max-w-6xl' : 'max-w-7xl'}`}>
          {presenterMode && <div className="mb-5 flex gap-2 overflow-x-auto pb-2">{list.customers.map((customer) => <button key={customer.id} type="button" onClick={() => selectCustomer(customer.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${selectedId === customer.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{customer.name}</button>)}</div>}
          <section className="relative overflow-hidden rounded-[2rem] bg-[#07110f] p-5 text-white shadow-[0_32px_80px_-48px_rgba(2,20,15,.9)] sm:p-7 lg:p-8">
            <div className="absolute -right-16 -top-24 size-64 rounded-full bg-emerald-400/15 blur-3xl" /><div className="absolute bottom-0 right-1/3 size-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div><div className="flex flex-wrap items-center gap-2"><StatusPill status={journey.customer.status} /><span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-slate-300 ring-1 ring-white/10">{journey.customer.risk} risk</span>{journey.customer.tags.map((tag) => <span key={tag} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10">{tag}</span>)}</div>
                <div className="mt-5 flex items-center gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-300 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30">{journey.customer.initials}</div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-300">{journey.customer.scenario}</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{journey.customer.name}</h1><p className="mt-1 text-sm text-slate-400">{journey.customer.age} years · {journey.customer.product} · since {journey.customer.relationshipSince}</p></div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:w-[360px]"><div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">Next action</p><p className="mt-1.5 text-sm font-bold text-white">{journey.customer.nextAction}</p></div><div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">Timing</p><p className="mt-1.5 text-sm font-bold text-white">{journey.customer.dueLabel}</p></div></div>
            </div>
          </section>

          <div className={`mt-6 grid gap-6 ${presenterMode ? '' : 'xl:grid-cols-[minmax(0,1fr)_300px]'}`}>
            <section className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_80px_-60px_rgba(15,23,42,.65)]">
              <div className="border-b border-slate-100 p-5 sm:p-7 lg:p-8">
                <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">{screen.eyebrow}</p><h2 className="mt-2 max-w-2xl text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{screen.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{screen.description}</p></div>{screen.estimatedMinutes && <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-flex"><Clock3 size={14} /> {screen.estimatedMinutes} min</span>}</div>
                <div className="mt-6"><div className="flex items-center justify-between text-[11px] font-bold text-slate-500"><span>Journey progress</span><span>Screen {currentScreen + 1} of {journey.customer.screens.length} · {progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} /></div></div>
              </div>
              <div className="space-y-4 bg-slate-50/45 p-4 sm:p-7 lg:p-8">
                {validationFields.length > 0 && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900"><CircleAlert className="mt-0.5 shrink-0 text-rose-600" size={18} /><div><p className="text-sm font-bold">Complete the required information</p><p className="mt-1 text-xs leading-5 text-rose-700">The fields revealed by your answers must be completed before this screen can be submitted.</p></div></div>}
                {screen.components.map((component) => <SduiRenderer key={component.id} component={component} responses={responses} onChange={changeResponse} />)}
              </div>
              <footer className="flex items-center justify-between gap-4 border-t border-slate-100 bg-white p-5 sm:px-8 sm:py-6"><button type="button" disabled={currentScreen === 0} onClick={() => setCurrentScreen((current) => Math.max(0, current - 1))} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"><ArrowLeft size={17} /> Back</button><button type="button" onClick={advance} disabled={submitting} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:opacity-60">{submitting ? <RefreshCw className="animate-spin" size={17} /> : currentScreen === journey.customer.screens.length - 1 ? <Check size={17} strokeWidth={3} /> : <ArrowRight size={17} />}{submitting ? 'Sending…' : screen.primaryAction}</button></footer>
            </section>

            {!presenterMode && <aside className="space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck size={17} /></div><div><p className="text-xs font-bold text-slate-950">Why this is shown</p><p className="text-[10px] text-slate-400">Server decision context</p></div></div><p className="mt-4 text-xs leading-5 text-slate-600">{screen.reason}</p></section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><LayoutPanelLeft size={17} /></div><div><p className="text-xs font-bold text-slate-950">SDUI trace</p><p className="text-[10px] text-slate-400">Backend → component registry</p></div></div><div className="mt-4 space-y-2">{screen.components.map((component, index) => <button key={component.id} type="button" onClick={() => setPayloadOpen(true)} className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left"><span className="grid size-5 place-items-center rounded-md bg-slate-200 text-[9px] font-black text-slate-600">{index + 1}</span><code className="min-w-0 flex-1 truncate text-[10px] font-bold text-violet-700">{component.type}</code><Code2 className="text-slate-300" size={12} /></button>)}</div><button type="button" onClick={() => setPayloadOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:border-violet-300 hover:text-violet-700"><Braces size={14} /> Inspect JSON</button></section>
              <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white shadow-lg shadow-indigo-600/15"><UsersRound size={20} className="text-violet-200" /><p className="mt-3 text-sm font-bold">Group fact, local decision</p><p className="mt-1.5 text-xs leading-5 text-violet-100">Identity evidence can be reused with provenance. Risk and customer acceptance stay with {journey.customer.bookingEntity}.</p></section>
            </aside>}
          </div>
        </div>
      </main>

      <PayloadDrawer journey={journey} open={payloadOpen} onClose={() => setPayloadOpen(false)} />
      {toast && <div className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl"><CheckCircle2 className="text-emerald-400" size={18} />{toast}</div>}
      {selectedSummary && <span className="sr-only">Selected scenario: {selectedSummary.scenario}</span>}
    </div>
  )
}

export default App
