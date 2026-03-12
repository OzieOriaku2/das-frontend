import { useState, useMemo } from 'react'
import { FiCheckCircle, FiFile, FiPlus, FiUpload, FiMonitor, FiAlertCircle, FiEye } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useGetCasesQuery, useSubmitIndexingMutation, useUploadDocumentMutation } from '../slices/caseApiSlice'
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

// ─── Required DOCUMENTS — must be uploaded before indexing can proceed ────
const REQUIRED_DOCS = [
  { type: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
  { type: 'LAND_PARCEL_DIAGRAM', label: 'Land Parcel Diagram' },
  { type: 'OWNER_ID', label: 'Owner ID' },
]

// ─── Required FIELDS — all mandatory per upstream spec ──────────────────────
const REQUIRED_FIELDS = [
  { key: 'fullName', label: 'Owner Name', altKey: 'firstName' },
  { key: 'ownerId', label: 'Owner ID Number' },
  { key: 'gender', label: 'Gender' },
  { key: 'ownerType', label: 'Owner Type' },
  { key: 'ownershipType', label: 'Ownership Type' },
  { key: 'propertyId', label: 'Property Unique ID' },
  { key: 'cofoReference', label: 'CofO Reference Number' },
  { key: 'issuanceDate', label: 'CofO Issuance Date' },
  { key: 'registrationDate', label: 'CofO Registration Date' },
]

// ─── Form components (defined OUTSIDE DataEntry to prevent re-mount on each keystroke) ──
const errStyle = { borderColor: 'var(--das-danger)', boxShadow: '0 0 0 2px rgba(220,38,38,0.1)' }

const Input = ({ k, label, required, type = 'text', placeholder, value, onChange, error }) => (
  <div>
    <label className="form-label-das">
      {label}{required && <span style={{ color: 'var(--das-danger)' }}> *</span>}
    </label>
    <input
      type={type}
      className={`form-control form-control-das form-control-sm ${error ? 'is-invalid' : ''}`}
      value={value}
      onChange={e => onChange(k, e.target.value)}
      placeholder={placeholder}
      style={error ? errStyle : undefined}
    />
    {error && <div style={{ fontSize: '0.6875rem', color: 'var(--das-danger)', marginTop: 2 }}>{error}</div>}
  </div>
)

const Select = ({ k, label, required, options, value, onChange, error }) => (
  <div>
    <label className="form-label-das">
      {label}{required && <span style={{ color: 'var(--das-danger)' }}> *</span>}
    </label>
    <select
      className={`form-control form-control-das form-control-sm ${error ? 'is-invalid' : ''}`}
      value={value}
      onChange={e => onChange(k, e.target.value)}
      style={error ? errStyle : undefined}
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <div style={{ fontSize: '0.6875rem', color: 'var(--das-danger)', marginTop: 2 }}>{error}</div>}
  </div>
)

const DataEntry = () => {
  const { data, isLoading } = useGetCasesQuery({ stage: 'SCANNED', pageSize: 100 })
  const [submitIndexing, { isLoading: saving }] = useSubmitIndexingMutation()
  const [uploadDoc, { isLoading: uploading }] = useUploadDocumentMutation()

  const [idx, setIdx] = useState(0)
  const [saved, setSaved] = useState(0)
  const [touched, setTouched] = useState(false) // true after first submit attempt

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadMode, setUploadMode] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [docMeta, setDocMeta] = useState({ documentType: '', documentRef: '', documentDate: '', dpiSetting: '150', scanQuality: 'GOOD', pageCount: '1' })

  // Indexing form state
  const [meta, setMeta] = useState({
    firstName: '', lastName: '', fullName: '', ownerId: '', gender: '',
    ownerType: '', ownershipType: '', propertyId: '', location: '',
    physicalLocation: '',
    fileNumber: '', cofoReference: '', issuanceDate: '', registrationDate: '',
  })

  const setM = (k, v) => setMeta(m => ({ ...m, [k]: v }))
  const setDM = (k, v) => setDocMeta(m => ({ ...m, [k]: v }))

  const resetMeta = () => {
    setMeta({ firstName: '', lastName: '', fullName: '', ownerId: '', gender: '', ownerType: '', ownershipType: '', propertyId: '', location: '', physicalLocation: '', fileNumber: '', cofoReference: '', issuanceDate: '', registrationDate: '' })
    setTouched(false)
  }
  const resetUpload = () => { setUploadFile(null); setDocMeta({ documentType: '', documentRef: '', documentDate: '', dpiSetting: '150', scanQuality: 'GOOD', pageCount: '1' }); setUploadMode(null) }
  const closeUpload = () => { setShowUpload(false); resetUpload() }

  const queue = data?.cases || []
  const rec = queue[idx]

  // ─── Validation ───────────────────────────────────────────────────────────
  const uploadedDocTypes = (rec?.documents || []).map(d => d.documentType)

  const missingDocs = useMemo(() => {
    return REQUIRED_DOCS.filter(rd => !uploadedDocTypes.includes(rd.type))
  }, [uploadedDocTypes])

  const fieldErrors = useMemo(() => {
    const errs = {}
    REQUIRED_FIELDS.forEach(({ key, label, altKey }) => {
      if (altKey) {
        if (!meta[key]?.trim() && !meta[altKey]?.trim()) errs[key] = `${label} is required`
      } else {
        if (!meta[key]?.trim()) errs[key] = `${label} is required`
      }
    })
    return errs
  }, [meta])

  const docsReady = missingDocs.length === 0
  const fieldsReady = Object.keys(fieldErrors).length === 0
  const isFormValid = docsReady && fieldsReady
  const missingFieldCount = Object.keys(fieldErrors).length

  const hasError = (key) => touched && fieldErrors[key]

  // ─── Save & Next ──────────────────────────────────────────────────────────
  const saveNext = async () => {
    setTouched(true)

    // Check documents first
    if (!docsReady) {
      const missing = missingDocs.map(d => d.label).join(', ')
      toast.error(`Required documents missing: ${missing}. Upload them before indexing.`)
      return
    }

    // Check fields
    if (!fieldsReady) {
      const missing = Object.values(fieldErrors)
      toast.error(`Required fields missing: ${missing.join(', ')}`)
      return
    }

    try {
      await submitIndexing({
        caseId: rec.id,
        metadata: {
          ...meta,
          fullName: meta.fullName || `${meta.firstName} ${meta.lastName}`.trim(),
          ownerType: meta.ownerType || undefined,
          ownershipType: meta.ownershipType || undefined,
        },
      }).unwrap()
      setSaved(s => s + 1)
      resetMeta()
      toast.success('Indexed — sent to QA')
      if (idx < queue.length - 1) setIdx(i => i + 1)
    } catch (e) {
      toast.error(e?.data?.error || 'Failed to save')
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
      await uploadDoc({ caseId: rec.id, formData: fd }).unwrap()
      toast.success(`${DOC_TYPES.find(d => d.value === docMeta.documentType)?.label || 'Document'} uploaded`)
      closeUpload()
    } catch (e) { toast.error(e?.data?.error || 'Upload failed') }
  }

  // ─── Loading / Empty ──────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="text-center py-5">
      <div className="spinner-das mx-auto mb-3" style={{ width: 40, height: 40 }} />
      <p className="text-muted">Loading queue...</p>
    </div>
  )

  if (!queue.length) return (
    <div className="das-card">
      <div className="das-card-body text-center py-5">
        <FiCheckCircle size={40} color="var(--das-success)" />
        <h5 className="mt-3 text-success">All records indexed!</h5>
      </div>
    </div>
  )

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted">{queue.length} awaiting · Record {idx + 1}/{queue.length}</span>
        <span className="das-badge success">Today: {saved}</span>
      </div>

      <div className="row g-4">
        {/* ═══ LEFT: Case Documents ═══ */}
        <div className="col-lg-5">
          <div className="das-card">
            <div className="das-card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Case — {rec?.cofoNumber} · {rec?.documents?.length || 0} docs</h6>
                <button className="btn btn-sm btn-das-primary" onClick={() => { setShowUpload(true); setUploadMode(null) }}>
                  <FiPlus className="me-1" /> Add Document
                </button>
              </div>

              {rec?.documents?.map(doc => (
                <div key={doc.id} className="d-flex align-items-center p-2 rounded mb-1" style={{ background: 'var(--das-gray-100)' }}>
                  <FiFile className="me-2" style={{ color: 'var(--das-primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{doc.documentType?.replace(/_/g, ' ')}</div>
                    {doc.documentRef && <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>Ref: {doc.documentRef}</div>}
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewDoc(doc)}><FiEye size={13} className="me-1" />View</button>
                </div>
              ))}

              {(!rec?.documents || rec.documents.length === 0) && (
                <div className="text-center py-4 text-muted" style={{ fontSize: '0.8125rem' }}>
                  No documents yet — click "Add Document" to upload scans
                </div>
              )}

              {/* Required documents checklist */}
              <div className="mt-3 pt-3 border-top">
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Required Documents
                </div>
                {REQUIRED_DOCS.map(rd => {
                  const present = uploadedDocTypes.includes(rd.type)
                  return (
                    <div key={rd.type} className="d-flex align-items-center gap-2 py-1" style={{ fontSize: '0.8125rem' }}>
                      {present ? (
                        <FiCheckCircle size={14} color="var(--das-success)" />
                      ) : (
                        <FiAlertCircle size={14} color="var(--das-danger)" />
                      )}
                      <span style={{ color: present ? 'var(--das-gray-700)' : 'var(--das-danger)', fontWeight: present ? 400 : 600 }}>{rd.label}</span>
                      {!present && <span className="das-badge danger" style={{ marginLeft: 'auto' }}>Missing</span>}
                    </div>
                  )
                })}
                {!docsReady && touched && (
                  <div className="alert alert-danger py-2 mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                    <FiAlertCircle className="me-1" />Upload all required documents before indexing
                  </div>
                )}
              </div>

              {rec?.physicalLocation && (
                <div className="alert alert-info py-2 mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                  <strong>Current Physical Location:</strong> {rec.physicalLocation}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Metadata Form ═══ */}
        <div className="col-lg-7">
          <div className="das-card">
            <div className="das-card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">CofO Metadata</h6>
                {touched && !isFormValid && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--das-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiAlertCircle size={13} />
                    {!docsReady && `${missingDocs.length} doc${missingDocs.length > 1 ? 's' : ''} missing`}
                    {!docsReady && !fieldsReady && ' · '}
                    {!fieldsReady && `${missingFieldCount} field${missingFieldCount > 1 ? 's' : ''} missing`}
                  </span>
                )}
              </div>

              <div className="row g-2">
                <div className="col-6"><Input k="firstName" label="First Name" value={meta.firstName} onChange={setM} error={hasError("firstName")} /></div>
                <div className="col-6"><Input k="lastName" label="Last Name" value={meta.lastName} onChange={setM} error={hasError("lastName")} /></div>
                <div className="col-12"><Input k="fullName" label="Full Name (as on CofO)" required value={meta.fullName} onChange={setM} error={hasError("fullName")} /></div>
                <div className="col-6"><Input k="ownerId" label="Owner ID Number" required value={meta.ownerId} onChange={setM} error={hasError("ownerId")} /></div>
                <div className="col-6">
                  <Select k="gender" label="Gender" required value={meta.gender} onChange={setM} error={hasError("gender")} options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                  ]} />
                </div>
                <div className="col-6">
                  <Select k="ownerType" label="Owner Type" required value={meta.ownerType} onChange={setM} error={hasError("ownerType")} options={[
                    { value: 'INDIVIDUAL', label: 'Individual' },
                    { value: 'CORPORATE', label: 'Corporate' },
                    { value: 'GOVERNMENT', label: 'Government' },
                    { value: 'JOINT_VENTURE', label: 'Joint Venture' },
                  ]} />
                </div>
                <div className="col-6">
                  <Select k="ownershipType" label="Ownership Type" required value={meta.ownershipType} onChange={setM} error={hasError("ownershipType")} options={[
                    { value: 'SINGLE_OWNED', label: 'Single Owned' },
                    { value: 'JOINT_CO_OWNED', label: 'Joint / Co-owned (Male & Female)' },
                    { value: 'CORPORATE_OWNED', label: 'Corporate Owned' },
                  ]} />
                </div>
                <div className="col-6"><Input k="propertyId" label="Property / Survey ID" required value={meta.propertyId} onChange={setM} error={hasError("propertyId")} /></div>
                <div className="col-6"><Input k="location" label="Location" placeholder="Plot/Block" value={meta.location} onChange={setM} error={hasError("location")} /></div>
                <div className="col-12" style={{ marginTop: 4, marginBottom: 4 }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4 }}>Physical Storage</div>
                </div>
                <div className="col-12"><Input k="physicalLocation" label="Room / Shelf / Box" placeholder="e.g. Room 2, Shelf 5, Box 14" value={meta.physicalLocation} onChange={setM} error={hasError("physicalLocation")} /></div>
                <div className="col-12" style={{ marginTop: 4, marginBottom: 4 }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4 }}>Reference Numbers</div>
                </div>
                <div className="col-6"><Input k="fileNumber" label="File Number" value={meta.fileNumber} onChange={setM} error={hasError("fileNumber")} /></div>
                <div className="col-6"><Input k="cofoReference" label="CofO Reference Number" required value={meta.cofoReference} onChange={setM} error={hasError("cofoReference")} /></div>
                <div className="col-6"><Input k="issuanceDate" label="CofO Issuance Date" type="date" required value={meta.issuanceDate} onChange={setM} error={hasError("issuanceDate")} /></div>
                <div className="col-6"><Input k="registrationDate" label="CofO Registration Date" type="date" required value={meta.registrationDate} onChange={setM} error={hasError("registrationDate")} /></div>
              </div>

              {/* Submit bar */}
              <div className="d-flex gap-2 mt-3 pt-3 border-top align-items-center">
                <button
                  className="btn btn-das-primary flex-grow-1"
                  onClick={saveNext}
                  disabled={saving || (touched && !isFormValid)}
                  style={(touched && !isFormValid) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  {saving ? 'Saving...' : 'Save & Next'}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => { if (idx < queue.length - 1) { setIdx(i => i + 1); resetMeta() } }}>Skip</button>
                {!touched && !isFormValid && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>
                    {!docsReady ? `${missingDocs.length} doc${missingDocs.length > 1 ? 's' : ''} + ` : ''}
                    {missingFieldCount} field{missingFieldCount > 1 ? 's' : ''} remaining
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DOCUMENT UPLOAD MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showUpload && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={closeUpload}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Document — {rec?.cofoNumber}</h5>
                <button className="btn-close" onClick={closeUpload} />
              </div>
              <div className="modal-body">

                {/* Step 1: Choose method */}
                {!uploadMode && (
                  <div>
                    <p className="text-muted mb-3">Choose how to add a scanned document:</p>
                    <div className="row g-3">
                      <div className="col-6">
                        <div onClick={() => setUploadMode('scan')} className="das-card text-center p-4" style={{ cursor: 'pointer', border: '2px solid var(--das-gray-200)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--das-primary)'; e.currentTarget.style.background = 'rgba(27,107,74,0.04)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--das-gray-200)'; e.currentTarget.style.background = '' }}>
                          <FiMonitor size={32} color="var(--das-primary)" className="mb-2" />
                          <h6>Scan from Scanner</h6>
                          <p style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)', marginBottom: 0 }}>Scan directly from HP scanner</p>
                        </div>
                      </div>
                      <div className="col-6">
                        <div onClick={() => setUploadMode('upload')} className="das-card text-center p-4" style={{ cursor: 'pointer', border: '2px solid var(--das-gray-200)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--das-blue)'; e.currentTarget.style.background = 'rgba(41,104,163,0.04)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--das-gray-200)'; e.currentTarget.style.background = '' }}>
                          <FiUpload size={32} color="var(--das-blue)" className="mb-2" />
                          <h6>Upload Scanned File</h6>
                          <p style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)', marginBottom: 0 }}>Upload a PDF or image already scanned</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2a: Scan */}
                {uploadMode === 'scan' && (
                  <div className="text-center py-3">
                    <FiMonitor size={48} color="var(--das-primary)" className="mb-3" />
                    <h6>Scanner Integration</h6>
                    <p className="text-muted" style={{ maxWidth: 380, margin: '0 auto 1rem' }}>HP Smart Document Scan SDK. PDF/A, Grayscale 8-bit.</p>
                    <div className="row g-2 mb-3" style={{ maxWidth: 400, margin: '0 auto' }}>
                      <div className="col-6">
                        <label className="form-label-das">Document Type *</label>
                        <select className="form-control form-control-das form-control-sm" value={docMeta.documentType} onChange={e => setDM('documentType', e.target.value)}>
                          <option value="">Select</option>{DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label-das">DPI</label>
                        <select className="form-control form-control-das form-control-sm" value={docMeta.dpiSetting} onChange={e => setDM('dpiSetting', e.target.value)}>
                          <option value="150">150 DPI (Good)</option><option value="300">300 DPI (Poor)</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn btn-das-primary" disabled={!docMeta.documentType}
                      onClick={() => { toast.info('Scanner SDK not yet integrated — use file upload'); setUploadMode('upload') }}>
                      <FiMonitor className="me-1" /> Start Scanning
                    </button>
                    <div className="mt-2"><button className="btn btn-sm btn-link text-muted" onClick={() => setUploadMode('upload')}>Or upload a file instead</button></div>
                  </div>
                )}

                {/* Step 2b: Upload */}
                {uploadMode === 'upload' && (
                  <div>
                    <div onClick={() => document.getElementById('das-doc-file')?.click()} className="text-center p-4 rounded mb-3"
                      style={{ border: `2px dashed ${uploadFile ? 'var(--das-primary)' : 'var(--das-gray-300)'}`, background: uploadFile ? 'rgba(27,107,74,0.04)' : 'var(--das-gray-100)', cursor: 'pointer' }}>
                      {uploadFile ? (
                        <><FiFile size={28} color="var(--das-primary)" className="mb-2" /><div style={{ fontWeight: 600, color: 'var(--das-primary)' }}>{uploadFile.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</div></>
                      ) : (
                        <><FiUpload size={28} color="var(--das-gray-400)" className="mb-2" /><div style={{ fontWeight: 600, color: 'var(--das-gray-600)' }}>Click to select file</div><div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>PDF, TIFF, JPG — Max 50MB</div></>
                      )}
                      <input id="das-doc-file" type="file" accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]) }} />
                    </div>
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="form-label-das">Document Type *</label>
                        <select className="form-control form-control-das form-control-sm" value={docMeta.documentType} onChange={e => setDM('documentType', e.target.value)}>
                          <option value="">Select document type</option>{DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="col-6"><label className="form-label-das">Doc Reference</label><input className="form-control form-control-das form-control-sm" value={docMeta.documentRef} onChange={e => setDM('documentRef', e.target.value)} placeholder="e.g. CofO/1001" /></div>
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
                )}
              </div>
              {uploadMode === 'upload' && (
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={closeUpload}>Cancel</button>
                  <button className="btn btn-das-primary" onClick={handleUpload} disabled={uploading || !uploadFile || !docMeta.documentType}>
                    {uploading ? <><span className="spinner-border spinner-border-sm me-1" /> Uploading...</> : <><FiUpload className="me-1" /> Upload Document</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewDoc && <DocumentViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}

export default DataEntry