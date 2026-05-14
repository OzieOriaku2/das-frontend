import { useState } from 'react'
import { FiPlus, FiFile, FiUpload, FiMonitor, FiCheckCircle, FiPackage, FiEye } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useCreateCaseMutation, useGetCasesQuery, useUploadDocumentMutation } from '../slices/caseApiSlice'
import DocumentViewer from '../components/common/DocumentViewer'

const DOC_TYPES = [
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
  { value: 'LAND_PARCEL_DIAGRAM', label: 'Land Parcel Diagram' },
  { value: 'OWNER_ID', label: 'Owner ID' },
  { value: 'ALLOCATION_LETTER', label: 'Allocation Letter' },
  { value: 'TAX_CLEARANCE', label: 'Tax Clearance' },
  { value: 'SURVEY_PLAN', label: 'Survey Plan' },
  { value: 'OTHER', label: 'Other' },
]

const Scanning = () => {
  const [createCase, { isLoading: creating }] = useCreateCaseMutation()
  const [uploadDoc, { isLoading: uploading }] = useUploadDocumentMutation()
  const { data: recentData, refetch } = useGetCasesQuery({ stage: 'SCANNED', pageSize: 20 })

  // Create case form
  const [cofoNumber, setCofoNumber] = useState('')
  const [physicalLocation, setPhysicalLocation] = useState('')
  const [batchId, setBatchId] = useState('')

  // Active case for document upload
  const [activeCase, setActiveCase] = useState(null)

  // Upload modal
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [docMeta, setDocMeta] = useState({ documentType: '', documentRef: '', documentDate: '', dpiSetting: '150', scanQuality: 'GOOD', pageCount: '1' })
  const setDM = (k, v) => setDocMeta(m => ({ ...m, [k]: v }))
  const resetUpload = () => { setUploadFile(null); setDocMeta({ documentType: '', documentRef: '', documentDate: '', dpiSetting: '150', scanQuality: 'GOOD', pageCount: '1' }) }

  // Document viewer
  const [viewDoc, setViewDoc] = useState(null)

  const recentCases = recentData?.cases || []

  // ─── Create Case ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!cofoNumber.trim()) { toast.error('CofO number is required'); return }
    try {
      const result = await createCase({
        cofoNumber: cofoNumber.trim(),
        physicalLocation: physicalLocation.trim() || undefined,
        batchId: batchId.trim() || undefined,
      }).unwrap()
      toast.success(`Case ${result.case.cofoNumber} created`)
      setActiveCase(result.case)
      setCofoNumber('')
      setPhysicalLocation('')
      setBatchId('')
      refetch()
    } catch (e) {
      toast.error(e?.data?.error || 'Failed to create case')
    }
  }

  // ─── Upload Document ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile) { toast.error('Select a file'); return }
    if (!docMeta.documentType) { toast.error('Select document type'); return }
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('documentType', docMeta.documentType)
    if (docMeta.documentRef) fd.append('documentRef', docMeta.documentRef)
    if (docMeta.documentDate) fd.append('documentDate', docMeta.documentDate)
    fd.append('dpiSetting', docMeta.dpiSetting)
    fd.append('scanQuality', docMeta.scanQuality)
    fd.append('pageCount', docMeta.pageCount)
    fd.append('format', 'PDF/A')
    fd.append('colorMode', 'Grayscale 8-bit')
    try {
      await uploadDoc({ caseId: activeCase.id, formData: fd }).unwrap()
      toast.success(`${DOC_TYPES.find(d => d.value === docMeta.documentType)?.label || 'Document'} uploaded`)
      setShowUpload(false)
      resetUpload()
      refetch()
      // Refresh active case documents
      const updated = recentCases.find(c => c.id === activeCase.id)
      if (updated) setActiveCase(updated)
    } catch (e) { toast.error(e?.data?.error || 'Upload failed') }
  }

  return (
    <div className="fade-in">
      <div className="row g-4">

        {/* ═══ LEFT: Create Case + Recent Cases ═══ */}
        <div className="col-lg-5">
          {/* Create New Case */}
          <div className="das-card mb-4">
            <div className="das-card-body">
              <h6 className="mb-3" style={{ fontWeight: 700 }}>
                <FiPlus size={16} className="me-2" style={{ color: 'var(--das-primary)' }} />
                Register New Case File
              </h6>
              <div className="mb-2">
                <label className="form-label-das">CofO Number <span style={{ color: 'var(--das-danger)' }}>*</span></label>
                <input className="form-control form-control-das form-control-sm" value={cofoNumber}
                  onChange={e => setCofoNumber(e.target.value)} placeholder="e.g. COFO-2026-001"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div className="mb-2">
                <label className="form-label-das">Physical Location (Room / Shelf / Box)</label>
                <input className="form-control form-control-das form-control-sm" value={physicalLocation}
                  onChange={e => setPhysicalLocation(e.target.value)} placeholder="e.g. Room 1, Shelf 3, Box 7" />
              </div>
              <div className="mb-3">
                <label className="form-label-das">Batch ID (optional)</label>
                <input className="form-control form-control-das form-control-sm" value={batchId}
                  onChange={e => setBatchId(e.target.value)} placeholder="e.g. BATCH-2026-03-12" />
              </div>
              <button className="btn btn-das-primary w-100" onClick={handleCreate} disabled={creating || !cofoNumber.trim()}>
                {creating ? 'Creating...' : <><FiPlus className="me-1" /> Create Case</>}
              </button>
            </div>
          </div>

          {/* Recent Scanned Cases */}
          <div className="das-card">
            <div className="das-card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0" style={{ fontWeight: 700 }}>
                  <FiPackage size={16} className="me-2" style={{ color: 'var(--das-gray-500)' }} />
                  Scanned Cases ({recentCases.length})
                </h6>
              </div>
              {recentCases.length === 0 && (
                <div className="text-center py-4 text-muted" style={{ fontSize: '0.8125rem' }}>
                  No cases yet — create one above
                </div>
              )}
              {recentCases.map(c => (
                <div key={c.id}
                  className="d-flex align-items-center p-2 rounded mb-1"
                  style={{
                    background: activeCase?.id === c.id ? 'rgba(27,107,74,0.08)' : 'var(--das-gray-100)',
                    border: activeCase?.id === c.id ? '1px solid var(--das-primary)' : '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onClick={() => setActiveCase(c)}
                >
                  <FiFile className="me-2" style={{ color: 'var(--das-primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.cofoNumber}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>
                      {c.documents?.length || 0} docs · {c.physicalLocation || 'No location'}
                    </div>
                  </div>
                  <span className="das-badge info" style={{ fontSize: '0.625rem' }}>SCANNED</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Selected Case — Upload Documents ═══ */}
        <div className="col-lg-7">
          {!activeCase ? (
            <div className="das-card">
              <div className="das-card-body text-center py-5">
                <FiPackage size={40} color="var(--das-gray-300)" />
                <h6 className="mt-3" style={{ color: 'var(--das-gray-500)' }}>Select or create a case</h6>
                <p style={{ fontSize: '0.8125rem', color: 'var(--das-gray-400)' }}>Create a new case on the left, then upload scanned documents here</p>
              </div>
            </div>
          ) : (
            <div className="das-card">
              <div className="das-card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0" style={{ fontWeight: 700 }}>{activeCase.cofoNumber}</h6>
                    <div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>
                      {activeCase.physicalLocation || 'No physical location set'} · {activeCase.office?.name || ''}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-das-primary" onClick={() => setShowUpload(true)}>
                    <FiUpload className="me-1" /> Upload Document
                  </button>
                </div>

                {/* Documents list */}
                {(!activeCase.documents || activeCase.documents.length === 0) ? (
                  <div className="text-center py-4 rounded" style={{ background: 'var(--das-gray-100)' }}>
                    <FiUpload size={32} color="var(--das-gray-400)" className="mb-2" />
                    <div style={{ fontWeight: 600, color: 'var(--das-gray-600)' }}>No documents yet</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>Click "Upload Document" to add scanned files</div>
                  </div>
                ) : (
                  <div>
                    {activeCase.documents.map(doc => (
                      <div key={doc.id} className="d-flex align-items-center p-2 rounded mb-1" style={{ background: 'var(--das-gray-100)' }}>
                        <FiFile className="me-2" style={{ color: 'var(--das-primary)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{doc.documentType?.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>
                            {doc.format || 'PDF/A'} · {doc.dpiSetting || 150}DPI · {doc.pageCount || 1}pg
                            {doc.documentRef && ` · Ref: ${doc.documentRef}`}
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewDoc(doc)}>
                          <FiEye size={13} className="me-1" />View
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scanning info */}
                <div className="mt-3 p-3 rounded" style={{ background: 'var(--das-gray-100)', fontSize: '0.75rem', color: 'var(--das-gray-600)' }}>
                  <strong>Scanning Standards:</strong> PDF/A format · Grayscale 8-bit · 150 DPI (good) or 300 DPI (poor/degraded) · One multipage PDF per physical document
                </div>

                {/* Status */}
                <div className="mt-3 p-3 rounded d-flex align-items-center gap-2" style={{ background: 'rgba(27,107,74,0.06)' }}>
                  <FiCheckCircle size={16} color="var(--das-primary)" />
                  <div style={{ fontSize: '0.8125rem' }}>
                    <strong>Status:</strong> This case is in <span className="das-badge info">SCANNED</span> stage.
                    Once all documents are uploaded, a Data Entry clerk will index the metadata and send it to QA Review.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Upload Modal ═══ */}
      {showUpload && activeCase && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowUpload(false); resetUpload() }}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Document — {activeCase.cofoNumber}</h5>
                <button className="btn-close" onClick={() => { setShowUpload(false); resetUpload() }} />
              </div>
              <div className="modal-body">
                {/* File picker */}
                <div onClick={() => document.getElementById('scan-doc-file')?.click()} className="text-center p-4 rounded mb-3"
                  style={{ border: `2px dashed ${uploadFile ? 'var(--das-primary)' : 'var(--das-gray-300)'}`, background: uploadFile ? 'rgba(27,107,74,0.04)' : 'var(--das-gray-100)', cursor: 'pointer' }}>
                  {uploadFile ? (
                    <><FiFile size={28} color="var(--das-primary)" className="mb-2" /><div style={{ fontWeight: 600, color: 'var(--das-primary)' }}>{uploadFile.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</div></>
                  ) : (
                    <><FiUpload size={28} color="var(--das-gray-400)" className="mb-2" /><div style={{ fontWeight: 600, color: 'var(--das-gray-600)' }}>Click to select scanned file</div><div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>PDF, TIFF, JPG — Max 50MB</div></>
                  )}
                  <input id="scan-doc-file" type="file" accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]) }} />
                </div>

                {/* Metadata */}
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label-das">Document Type <span style={{ color: 'var(--das-danger)' }}>*</span></label>
                    <select className="form-control form-control-das form-control-sm" value={docMeta.documentType} onChange={e => setDM('documentType', e.target.value)}>
                      <option value="">Select document type</option>
                      {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="col-6"><label className="form-label-das">Document Reference</label><input className="form-control form-control-das form-control-sm" value={docMeta.documentRef} onChange={e => setDM('documentRef', e.target.value)} placeholder="e.g. CofO/2026/001" /></div>
                  <div className="col-6"><label className="form-label-das">Document Date</label><input type="date" className="form-control form-control-das form-control-sm" value={docMeta.documentDate} onChange={e => setDM('documentDate', e.target.value)} /></div>
                  <div className="col-4">
                    <label className="form-label-das">DPI</label>
                    <select className="form-control form-control-das form-control-sm" value={docMeta.dpiSetting} onChange={e => setDM('dpiSetting', e.target.value)}>
                      <option value="150">150 (Good)</option><option value="300">300 (Poor)</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label-das">Quality</label>
                    <select className="form-control form-control-das form-control-sm" value={docMeta.scanQuality} onChange={e => setDM('scanQuality', e.target.value)}>
                      <option value="GOOD">Good</option><option value="POOR">Poor / Degraded</option>
                    </select>
                  </div>
                  <div className="col-4"><label className="form-label-das">Pages</label><input type="number" min="1" className="form-control form-control-das form-control-sm" value={docMeta.pageCount} onChange={e => setDM('pageCount', e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => { setShowUpload(false); resetUpload() }}>Cancel</button>
                <button className="btn btn-das-primary" onClick={handleUpload} disabled={uploading || !uploadFile || !docMeta.documentType}>
                  {uploading ? <><span className="spinner-border spinner-border-sm me-1" /> Uploading...</> : <><FiUpload className="me-1" /> Upload Document</>}
                </button>
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

export default Scanning