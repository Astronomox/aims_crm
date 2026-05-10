import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContacts, createContact, updateContact } from '../../api/services'
import { format } from 'date-fns'
import { Plus, Search, X, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  new_lead: 'blue', in_progress: 'amber', application_submitted: 'purple',
  visa_processing: 'gold', enrolled: 'green', not_qualified: 'gray', lost: 'red',
}
const STATUS_LABELS: Record<string, string> = {
  new_lead: 'New Lead', in_progress: 'In Progress', application_submitted: 'App Submitted',
  visa_processing: 'Visa Processing', enrolled: 'Enrolled', not_qualified: 'Not Qualified', lost: 'Lost',
}
const COUNTRIES = ['United Kingdom', 'Canada', 'USA', 'Australia', 'Malaysia', 'Germany', 'Denmark', 'UAE', 'Multiple', 'Undecided']
const STATUSES = Object.keys(STATUS_LABELS)

const empty = {
  full_name: '', email: '', phone: '', whatsapp: '',
  status: 'new_lead', destination_country: 'Undecided',
  program_interest: '', university_interest: '', source: '', notes: '',
}

export default function Contacts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<number | null>(null)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', search, statusFilter],
    queryFn: () => getContacts({ q: search || undefined, status: statusFilter || undefined }),
  })

  const createMut = useMutation({
    mutationFn: createContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); close(); toast.success('Contact created') },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => updateContact(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); close(); toast.success('Contact updated') },
  })

  const close = () => { setShowModal(false); setForm(empty); setEditId(null) }
  const submit = () => {
    if (!form.full_name.trim()) return toast.error('Name required')
    editId ? updateMut.mutate({ id: editId, data: form }) : createMut.mutate(form)
  }
  const edit = (c: any) => { setForm({ ...empty, ...c }); setEditId(c.id); setShowModal(true) }
  const f = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-heading">Contacts</div>
          <div className="page-subheading">Student and prospect records</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> New Contact
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="search-input" style={{ paddingLeft: 34, width: '100%' }} placeholder="Search name, email, phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 170 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner" /></div>
          ) : !contacts.length ? (
            <div className="empty">
              <div className="empty-icon"><Users size={32} strokeWidth={1.2} /></div>
              {search || statusFilter ? 'No contacts match your search.' : 'No contacts yet. Add your first student.'}
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Contact</th><th>Status</th><th>Destination</th><th>Program</th><th>Added</th><th></th></tr></thead>
              <tbody>
                {contacts.map((c: any) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => edit(c)}>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                      <div>{c.email || '—'}</div>
                      {c.phone && <div style={{ color: 'var(--text-3)', marginTop: 1 }}>{c.phone}</div>}
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[c.status] || 'gray'}`}>{STATUS_LABELS[c.status] || c.status}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{c.destination_country || '—'}</td>
                    <td style={{ color: 'var(--text-2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.program_interest || '—'}</td>
                    <td style={{ color: 'var(--text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>{format(new Date(c.created_at), 'd MMM yyyy')}</td>
                    <td onClick={e => e.stopPropagation()}><button className="btn btn-ghost btn-sm" onClick={() => edit(c)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Contact' : 'New Contact'}</div>
              <button onClick={close} style={{ color: 'var(--text-3)' }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={f('full_name')} placeholder="Full name" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={f('email')} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={f('phone')} placeholder="+234..." /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={f('whatsapp')} /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Destination</label>
                  <select className="form-select" value={form.destination_country} onChange={f('destination_country')}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Program</label><input className="form-input" value={form.program_interest} onChange={f('program_interest')} placeholder="e.g. MSc Nursing" /></div>
                <div className="form-group"><label className="form-label">University</label><input className="form-input" value={form.university_interest} onChange={f('university_interest')} /></div>
                <div className="form-group"><label className="form-label">Lead Source</label><input className="form-input" value={form.source} onChange={f('source')} placeholder="e.g. Instagram" /></div>
                <div className="form-group form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={f('notes')} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn btn-ghost" onClick={close}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) ? <span className="spinner" /> : editId ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
