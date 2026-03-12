import { useState } from 'react'
import { FiLock, FiSave } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { selectCurrentUser, selectToken } from '../slices/authSlice'

const Profile = () => {
  const user = useSelector(selectCurrentUser)
  const token = useSelector(selectToken)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPw || !newPw) { toast.error('All fields required'); return }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Password updated successfully')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div className="das-card mb-4">
        <div className="das-card-body">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--das-primary), var(--das-primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div>
              <h5 className="mb-0">{user?.name}</h5>
              <span className="das-badge info">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4, marginBottom: 12 }}>Account Details</div>
          {[['Full Name', user?.name], ['Username', `@${user?.username}`], ['Role', user?.role?.replace(/_/g, ' ')], ['Office', user?.office?.name], ['Status', user?.active !== false ? 'Active' : 'Inactive']].map(([l, v]) => (
            <div key={l} className="d-flex py-2 border-bottom">
              <span style={{ width: 140, fontSize: '0.75rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{l}</span>
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="das-card">
        <div className="das-card-body">
          <div className="d-flex align-items-center gap-2 mb-3"><FiLock size={18} color="var(--das-primary)" /><h6 className="mb-0">Change Password</h6></div>
          <form onSubmit={handleChangePassword}>
            <div className="mb-3"><label className="form-label-das">Current Password</label><input type="password" className="form-control form-control-das" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
            <div className="row g-3 mb-3">
              <div className="col-6"><label className="form-label-das">New Password</label><input type="password" className="form-control form-control-das" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" /></div>
              <div className="col-6"><label className="form-label-das">Confirm Password</label><input type="password" className="form-control form-control-das" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
            </div>
            <button type="submit" className="btn btn-das-primary" disabled={saving}>{saving ? 'Saving...' : <><FiSave size={14} className="me-1" /> Update Password</>}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Profile