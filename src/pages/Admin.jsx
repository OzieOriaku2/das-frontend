import { useState } from 'react'
import { FiPlus, FiEdit, FiPower } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useGetOfficesQuery, useUpdateOfficeMutation } from '../slices/adminApiSlice'

const ROLES = ['ADMINISTRATOR', 'SCANNER_OPERATOR', 'DATA_ENTRY', 'QA_REVIEWER', 'EDITOR', 'VIEWER']

const Admin = () => {
  const { data: userData, isLoading: ul } = useGetUsersQuery()
  const { data: officeData } = useGetOfficesQuery()
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [updateOffice] = useUpdateOfficeMutation()
  const [tab, setTab] = useState('users')
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editOffice, setEditOffice] = useState(null)
  const [nu, setNu] = useState({ username: '', password: '', name: '', role: '', officeId: '', phone: '' })
  const [eu, setEu] = useState({})
  const [eo, setEo] = useState({ name: '', hardcopyInventoryCount: '' })

  const offices = officeData?.offices || []
  const users = userData?.users || []

  const handleCreate = async () => {
    if (!nu.username || !nu.password || !nu.name || !nu.role || !nu.officeId) { toast.error('All fields required'); return }
    try { await createUser(nu).unwrap(); toast.success('User created'); setShowCreate(false); setNu({ username: '', password: '', name: '', role: '', officeId: '', phone: '' }) }
    catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  const handleUpdate = async () => {
    const updates = { ...eu }; if (!updates.password) delete updates.password
    try { await updateUser({ userId: editUser.id, ...updates }).unwrap(); toast.success('User updated'); setEditUser(null) }
    catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  const toggleActive = async (u) => {
    try { await updateUser({ userId: u.id, active: !u.active }).unwrap(); toast.success(u.active ? 'Deactivated' : 'Activated') }
    catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  const handleUpdateOffice = async () => {
    if (!eo.name?.trim()) { toast.error('Office name is required'); return }
    try {
      await updateOffice({ officeId: editOffice.id, name: eo.name.trim(), hardcopyInventoryCount: parseInt(eo.hardcopyInventoryCount) || 0 }).unwrap()
      toast.success('Office updated')
      setEditOffice(null)
    } catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  if (ul) return <div className="text-center py-5"><div className="spinner-das mx-auto" style={{ width: 40, height: 40 }} /></div>

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ul className="nav nav-tabs mb-0">
          <li className="nav-item"><button className={`nav-link ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users ({users.length})</button></li>
          <li className="nav-item"><button className={`nav-link ${tab === 'offices' ? 'active' : ''}`} onClick={() => setTab('offices')}>Offices ({offices.length})</button></li>
        </ul>
        {tab === 'users' && <button className="btn btn-das-primary btn-sm" onClick={() => setShowCreate(true)}><FiPlus className="me-1" /> New User</button>}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="das-card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr>{['Name', 'Username', 'Phone', 'Role', 'Office', 'Status', 'Actions'].map(h => <th key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>{users.map(u => (
                <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--das-gray-500)' }}>@{u.username}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{u.phone || '—'}</td>
                  <td><span className="das-badge info">{u.role?.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: '0.8125rem' }}>{u.office?.name}</td>
                  <td>{u.active ? <span className="das-badge success">Active</span> : <span className="das-badge danger">Inactive</span>}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditUser(u); setEu({ name: u.name, role: u.role, officeId: u.office?.id, password: '', phone: u.phone || '' }) }}><FiEdit size={14} /></button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(u)}><FiPower size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offices Tab */}
      {tab === 'offices' && (
        <div className="das-card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr>{['Office', 'Hardcopy Inventory', 'Users', 'Cases', 'Actions'].map(h => <th key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>{offices.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td><span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--das-primary)' }}>{o.hardcopyInventoryCount?.toLocaleString()}</span></td>
                  <td><span className="das-badge info">{o._count?.users || 0}</span></td>
                  <td><span className="das-badge success">{o._count?.cases || 0}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditOffice(o); setEo({ name: o.name, hardcopyInventoryCount: String(o.hardcopyInventoryCount || 0) }) }}>
                      <FiEdit size={14} />
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCreate(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Create User</h5><button className="btn-close" onClick={() => setShowCreate(false)} /></div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label-das">Full Name</label><input className="form-control form-control-das form-control-sm" value={nu.name} onChange={e => setNu(n => ({ ...n, name: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label-das">Phone Number</label><input className="form-control form-control-das form-control-sm" value={nu.phone} onChange={e => setNu(n => ({ ...n, phone: e.target.value }))} placeholder="e.g. 08012345678" /></div>
                <div className="row g-2 mb-2"><div className="col"><label className="form-label-das">Username</label><input className="form-control form-control-das form-control-sm" value={nu.username} onChange={e => setNu(n => ({ ...n, username: e.target.value }))} /></div><div className="col"><label className="form-label-das">Password</label><input type="password" className="form-control form-control-das form-control-sm" value={nu.password} onChange={e => setNu(n => ({ ...n, password: e.target.value }))} /></div></div>
                <div className="row g-2"><div className="col"><label className="form-label-das">Role</label><select className="form-control form-control-das form-control-sm" value={nu.role} onChange={e => setNu(n => ({ ...n, role: e.target.value }))}><option value="">Select</option>{ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}</select></div><div className="col"><label className="form-label-das">Office</label><select className="form-control form-control-das form-control-sm" value={nu.officeId} onChange={e => setNu(n => ({ ...n, officeId: e.target.value }))}><option value="">Select</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div></div>
              </div>
              <div className="modal-footer"><button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-das-primary" onClick={handleCreate}>Create</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditUser(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Edit — {editUser.name}</h5><button className="btn-close" onClick={() => setEditUser(null)} /></div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label-das">Name</label><input className="form-control form-control-das form-control-sm" value={eu.name || ''} onChange={e => setEu(x => ({ ...x, name: e.target.value }))} /></div>
                <div className="mb-2"><label className="form-label-das">Phone Number</label><input className="form-control form-control-das form-control-sm" value={eu.phone || ''} onChange={e => setEu(x => ({ ...x, phone: e.target.value }))} placeholder="e.g. 08012345678" /></div>
                <div className="row g-2 mb-2"><div className="col"><label className="form-label-das">Role</label><select className="form-control form-control-das form-control-sm" value={eu.role || ''} onChange={e => setEu(x => ({ ...x, role: e.target.value }))}><option value="">Select</option>{ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}</select></div><div className="col"><label className="form-label-das">Office</label><select className="form-control form-control-das form-control-sm" value={eu.officeId || ''} onChange={e => setEu(x => ({ ...x, officeId: e.target.value }))}><option value="">Select</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div></div>
                <div className="mb-2"><label className="form-label-das">New Password (leave blank to keep)</label><input type="password" className="form-control form-control-das form-control-sm" value={eu.password || ''} onChange={e => setEu(x => ({ ...x, password: e.target.value }))} /></div>
              </div>
              <div className="modal-footer"><button className="btn btn-outline-secondary" onClick={() => setEditUser(null)}>Cancel</button><button className="btn btn-das-primary" onClick={handleUpdate}>Save</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Office Modal */}
      {editOffice && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditOffice(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Office</h5>
                <button className="btn-close" onClick={() => setEditOffice(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label-das">Office Name <span style={{ color: 'var(--das-danger)' }}>*</span></label>
                  <input className="form-control form-control-das" value={eo.name} onChange={e => setEo(x => ({ ...x, name: e.target.value }))} placeholder="e.g. Maitama Office" />
                </div>
                <div className="mb-3">
                  <label className="form-label-das">Hardcopy Inventory Count</label>
                  <input type="number" min="0" className="form-control form-control-das" value={eo.hardcopyInventoryCount} onChange={e => setEo(x => ({ ...x, hardcopyInventoryCount: e.target.value }))} placeholder="Total physical CofO records in this office" />
                  <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)', marginTop: 4 }}>
                    Total number of hardcopy CofO case files held at this office. Used for digitization progress tracking.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setEditOffice(null)}>Cancel</button>
                <button className="btn btn-das-primary" onClick={handleUpdateOffice} disabled={!eo.name?.trim()}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin