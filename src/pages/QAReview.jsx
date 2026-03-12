import { useState } from 'react'
import { FiCheckCircle, FiXCircle, FiFile, FiEye } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useGetCasesQuery, useQaApproveMutation, useQaRejectMutation } from '../slices/caseApiSlice'
import DocumentViewer from '../components/common/DocumentViewer'

const QAReview = () => {
  const { data, isLoading } = useGetCasesQuery({ stage: 'QA_REVIEW', pageSize: 100 })
  const [approve] = useQaApproveMutation()
  const [rejectMut] = useQaRejectMutation()
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(0)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [viewDoc, setViewDoc] = useState(null)

  const queue = data?.cases || []
  const rec = queue[idx]

  const doApprove = async () => {
    try { await approve(rec.id).unwrap(); setDone(d => d + 1); toast.success('Approved!'); if (idx < queue.length - 1) setIdx(i => i + 1) }
    catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  const doReject = async () => {
    if (!reason.trim()) return
    try { await rejectMut({ caseId: rec.id, reason }).unwrap(); setShowReject(false); setDone(d => d + 1); toast.error('Rejected'); setReason(''); if (idx < queue.length - 1) setIdx(i => i + 1) }
    catch (e) { toast.error(e?.data?.error || 'Failed') }
  }

  if (isLoading) return <div className="text-center py-5"><div className="spinner-das mx-auto mb-3" style={{ width: 40, height: 40 }} /><p className="text-muted">Loading QA queue...</p></div>
  if (!queue.length) return <div className="das-card"><div className="das-card-body text-center py-5"><FiCheckCircle size={40} color="var(--das-success)" /><h5 className="mt-3 text-success">QA queue empty!</h5></div></div>

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted">{queue.length} awaiting</span>
        <span className="das-badge success">Reviewed: {done}</span>
      </div>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="das-card"><div className="das-card-body">
            <h6 className="mb-3">Documents — {rec?.cofoNumber}</h6>
            {rec?.documents?.map(doc => (
              <div key={doc.id} className="d-flex align-items-center p-2 rounded mb-1" style={{ background: 'var(--das-gray-100)' }}>
                <FiFile className="me-2" style={{ color: 'var(--das-primary)' }} />
                <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 500 }}>{doc.documentType?.replace(/_/g, ' ')}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewDoc(doc)}><FiEye size={13} className="me-1" />View</button>
              </div>
            ))}
          </div></div>
        </div>
        <div className="col-lg-7">
          <div className="das-card"><div className="das-card-body">
            <h6 className="mb-3">Verify Metadata</h6>
            {[
              ['CofO ID', rec?.cofoNumber],
              ['File Number', rec?.fileNumber],
              ['CofO Reference', rec?.cofoReference],
              ['Owner', rec?.fullName],
              ['Owner ID', rec?.ownerId],
              ['Gender', rec?.gender?.replace(/_/g, ' ')],
              ['Owner Type', rec?.ownerType?.replace(/_/g, ' ')],
              ['Ownership', rec?.ownershipType?.replace(/_/g, ' ')],
              ['Property ID', rec?.propertyId],
              ['Location', rec?.location],
              ['Physical Storage', rec?.physicalLocation],
              ['Issuance Date', rec?.issuanceDate ? new Date(rec.issuanceDate).toLocaleDateString() : '—'],
              ['Registration Date', rec?.registrationDate ? new Date(rec.registrationDate).toLocaleDateString() : '—'],
            ].map(([l, v]) => (
              <div key={l} className="d-flex py-2 border-bottom">
                <span style={{ width: 130, fontSize: '0.6875rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{l}</span>
                <span style={{ flex: 1, fontSize: '0.8125rem' }}>{v || '—'}</span>
              </div>
            ))}
            <div className="d-flex gap-2 mt-3 pt-3 border-top">
              <button className="btn btn-success flex-grow-1" onClick={doApprove}><FiCheckCircle className="me-1" /> Approve</button>
              <button className="btn btn-danger" onClick={() => setShowReject(true)}><FiXCircle className="me-1" /> Reject</button>
            </div>
          </div></div>
        </div>
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowReject(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title">Reject Record</h5><button className="btn-close" onClick={() => setShowReject(false)} /></div>
              <div className="modal-body">
                <label className="form-label-das">Reason *</label>
                <textarea className="form-control form-control-das" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Image quality too low…" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowReject(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={doReject} disabled={!reason.trim()}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {viewDoc && <DocumentViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}

export default QAReview