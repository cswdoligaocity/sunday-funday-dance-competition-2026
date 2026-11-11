import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Search, LogOut, RefreshCw, Download, ExternalLink, Users, ClipboardList, Clock3, CheckCircle2, ShieldCheck, X } from 'lucide-react'
import './admin.css'

const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null
const STATUSES = ['Pending', 'Under Review', 'Qualified', 'Disqualified', 'Confirmed']
const fmt = value => value ? new Date(value).toLocaleString() : '—'
const esc = value => `"${String(value ?? '').replaceAll('"', '""')}"`

export default function Admin() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [apps, setApps] = useState([])
  const [participants, setParticipants] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [locality, setLocality] = useState('All')
  const [statusDraft, setStatusDraft] = useState('')

  useEffect(() => {
    if (!supabase) { setError('Supabase environment variables are not configured.'); setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data, error: e }) => { if (e) setError(e.message); setSession(data.session); setAuthLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadApplications = useCallback(async () => {
    if (!supabase || !session) return
    setBusy(true); setError(''); setNotice('')
    const { data, error: e } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    if (e) { setError(e.message); setBusy(false); return }
    const rows = data || []
    setApps(rows)
    if (rows.length) {
      const ids = rows.map(row => row.id)
      const { data: people, error: pe } = await supabase.from('participants').select('*').in('application_id', ids).order('created_at')
      if (pe) setError(pe.message)
      else setParticipants(people || [])
    } else setParticipants([])
    setSelectedId(current => rows.some(row => row.id === current) ? current : (rows[0]?.id || ''))
    setBusy(false)
  }, [session])

  useEffect(() => { loadApplications() }, [loadApplications])

  const localities = useMemo(() => ['All', ...new Set(apps.map(a => a.city_municipality).filter(Boolean).sort())], [apps])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return apps.filter(a => (category === 'All' || a.category === category)
      && (status === 'All' || a.status === status)
      && (locality === 'All' || a.city_municipality === locality)
      && (!term || [a.reference_number, a.team_name, a.representative_name, a.email, a.barangay, a.city_municipality].some(v => String(v || '').toLowerCase().includes(term))))
  }, [apps, search, category, status, locality])
  const selected = apps.find(a => a.id === selectedId)
  const selectedPeople = participants.filter(p => p.application_id === selectedId)
  const counts = useMemo(() => ({ total: apps.length, pending: apps.filter(a => a.status === 'Pending').length, review: apps.filter(a => a.status === 'Under Review').length, qualified: apps.filter(a => a.status === 'Qualified' || a.status === 'Confirmed').length }), [apps])

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError('')
    const { error: e2 } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (e2) setError(e2.message)
    setBusy(false)
  }
  async function signOut() { await supabase.auth.signOut(); setApps([]); setParticipants([]); setSelectedId('') }
  async function updateStatus() {
    if (!selected || !STATUSES.includes(statusDraft)) return
    setBusy(true); setError(''); setNotice('')
    const { error: e } = await supabase.from('applications').update({ status: statusDraft }).eq('id', selected.id)
    if (e) setError(e.message)
    else { setNotice(`Application ${selected.reference_number} updated to ${statusDraft}.`); await loadApplications() }
    setBusy(false)
  }
  function exportCsv() {
    const headers = ['Reference Number','Team Name','Category','Status','Group Leader','Contact Number','Email','City/Municipality','Barangay','Audition Video','Participant Count','Created At']
    const lines = filtered.map(a => [a.reference_number,a.team_name,a.category,a.status,a.representative_name,a.contact_number,a.email,a.city_municipality,a.barangay,a.audition_video_link,participants.filter(p=>p.application_id===a.id).length,a.created_at].map(esc).join(','))
    const blob = new Blob([[headers.map(esc).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'sunday-funday-applications.csv'; link.click(); URL.revokeObjectURL(url)
  }

  if (authLoading) return <div className="admin-shell"><div className="admin-loading">Checking admin session…</div></div>
  if (!session) return <div className="admin-shell"><div className="admin-login-wrap"><a className="admin-back" href="#"><ArrowLeft size={16}/> Back to registration</a><form className="admin-login" onSubmit={signIn}><div className="admin-mark"><ShieldCheck size={25}/></div><small> SUNDAY FUNDAY 2026 </small><h1>Admin Portal</h1><p>Sign in using your authorized Supabase admin account.</p><label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="admin-error">{error}</div>}<button className="admin-primary" disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button><small className="admin-security">Only accounts listed in the competition admin access table can view applications.</small></form></div></div>

  return <div className="admin-shell"><header className="admin-header"><a href="#" className="admin-brand"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="City Government of Ligao"/><span><b>CITY GOVERNMENT OF LIGAO</b><small>SUNDAY FUNDAY 2026 · ADMIN</small></span></a><div className="admin-header-actions"><button onClick={loadApplications} disabled={busy}><RefreshCw size={15}/> Refresh</button><button onClick={signOut}><LogOut size={15}/> Sign out</button></div></header>
    <main className="admin-main"><div className="admin-heading"><div><small>REGISTRATION MANAGEMENT</small><h1>Competition Dashboard</h1><p>Review registrations, participant details, and audition submissions.</p></div><button className="admin-export" onClick={exportCsv}><Download size={16}/> Export filtered CSV</button></div>
      <div className="admin-stats"><div><span><ClipboardList/></span><small>Total applications</small><strong>{counts.total}</strong></div><div><span><Clock3/></span><small>Pending</small><strong>{counts.pending}</strong></div><div><span><Users/></span><small>Under review</small><strong>{counts.review}</strong></div><div><span><CheckCircle2/></span><small>Qualified / Confirmed</small><strong>{counts.qualified}</strong></div></div>
      {error&&<div className="admin-error admin-alert">{error}</div>}{notice&&<div className="admin-notice">{notice}</div>}
      <section className="admin-workspace"><div className="admin-list-panel"><div className="admin-list-title"><div><h2>Applications</h2><small>{filtered.length} matching records</small></div><button className="admin-icon-button" onClick={()=>{setSearch('');setCategory('All');setStatus('All');setLocality('All')}} title="Clear filters"><X size={16}/></button></div>
        <div className="admin-search"><Search size={16}/><input placeholder="Search reference, team, leader, email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="admin-filters"><select value={category} onChange={e=>setCategory(e.target.value)}><option>All</option>{['Hip-Hop Competition','Dancesport Competition','TikTok Mashup Dance Competition'].map(x=><option key={x}>{x}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option>{STATUSES.map(x=><option key={x}>{x}</option>)}</select><select value={locality} onChange={e=>setLocality(e.target.value)}>{localities.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="admin-records">{busy&&!apps.length?<p className="admin-empty">Loading applications…</p>:filtered.length===0?<p className="admin-empty">No applications match your filters.</p>:filtered.map(a=><button key={a.id} className={`admin-record ${selectedId===a.id?'selected':''}`} onClick={()=>{setSelectedId(a.id);setStatusDraft(a.status)}}><div><b>{a.team_name}</b><span className={`status-pill status-${a.status.toLowerCase().replaceAll(' ','-')}`}>{a.status}</span></div><small>{a.reference_number} · {a.category}</small><small>{a.city_municipality || 'Locality not specified'} · {fmt(a.created_at)}</small></button>)}</div>
      </div>
      <div className="admin-detail-panel">{selected?<><div className="admin-detail-head"><div><small>APPLICATION DETAILS</small><h2>{selected.team_name}</h2><p>{selected.reference_number}</p></div><span className={`status-pill status-${selected.status.toLowerCase().replaceAll(' ','-')}`}>{selected.status}</span></div><div className="admin-detail-grid"><div><small>Category</small><b>{selected.category}</b></div><div><small>Submitted</small><b>{fmt(selected.created_at)}</b></div><div><small>Group Leader</small><b>{selected.representative_name}</b></div><div><small>Contact</small><b>{selected.contact_number}</b></div><div><small>Email</small><b>{selected.email}</b></div><div><small>Location</small><b>{[selected.barangay,selected.city_municipality,selected.province].filter(Boolean).join(', ') || '—'}</b></div></div>
        <div className="admin-video"><div><b>Audition video</b><small>Open the submitted Google Drive link in a new tab.</small></div><a href={selected.audition_video_link} target="_blank" rel="noreferrer">Open video <ExternalLink size={14}/></a></div>
        <div className="admin-consents"><b>Declarations</b><span>Eligibility confirmed: {selected.eligibility_confirmed?'Yes':'No'}</span><span>Previous champion: {selected.previous_champion?'Yes':'No'}</span><span>Guardian consent: {selected.guardian_consent?'Yes':'No'}</span><span>Privacy acknowledged: {selected.privacy_acknowledged?'Yes':'No'}</span><span>Photo/video consent: {selected.photo_video_consent?'Yes':'No'}</span></div>
        <div className="admin-participants"><div className="admin-section-title"><b>Participants</b><small>{selectedPeople.length} listed</small></div><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Birth date</th><th>City / Municipality</th><th>Barangay</th></tr></thead><tbody>{selectedPeople.map(p=><tr key={p.id}><td>{p.full_name}</td><td>{p.birth_date}</td><td>{p.city_municipality}</td><td>{p.barangay}</td></tr>)}</tbody></table></div></div>
        <div className="admin-status-control"><label>Update application status<select value={statusDraft || selected.status} onChange={e=>setStatusDraft(e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></label><button className="admin-primary" disabled={busy||!statusDraft||statusDraft===selected.status} onClick={updateStatus}>{busy?'Saving…':'Save status'}</button></div>
      </>:<div className="admin-empty">Select an application to view its details.</div>}</div></section>
      <p className="admin-footnote">Access is controlled by Supabase authentication and the competition admin authorization function. Status changes are saved directly to the database.</p>
    </main></div>
}
