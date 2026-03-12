import { useState, useEffect } from 'react'
import {
  FiFile, FiRotateCw, FiZoomIn, FiZoomOut, FiSun, FiMoon,
  FiEye, FiDownload, FiLock, FiAlertTriangle,
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { selectToken, selectCurrentUser } from '../../slices/authSlice'
import { toast } from 'react-toastify'

// Roles authorized to download documents
const DOWNLOAD_ROLES = ['ADMINISTRATOR', 'EDITOR']

const DocumentViewer = ({ doc, onClose }) => {
  const token = useSelector(selectToken)
  const user = useSelector(selectCurrentUser)
  const canDownload = DOWNLOAD_ROLES.includes(user?.role)

  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadReason, setDownloadReason] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [fileType, setFileType] = useState(null) // 'pdf' | 'image' | 'other'

  // Detect file type from metadata first, blob MIME type as fallback
  const detectType = (docObj, blob) => {
    if (docObj?.format === 'PDF/A' || docObj?.format?.includes('PDF')) return 'pdf'
    if (docObj?.fileName?.match(/\.pdf$/i)) return 'pdf'
    if (docObj?.fileName?.match(/\.(jpg|jpeg|png|gif|tiff|tif)$/i)) return 'image'
    if (blob?.type?.includes('pdf')) return 'pdf'
    if (blob?.type?.startsWith('image/')) return 'image'
    return 'pdf' // default — most DAS documents are PDF/A
  }

  // Fetch file as blob — JWT protected
  useEffect(() => {
    if (!doc?.id) return
    let url = null

    const fetchDoc = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/documents/file/${doc.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Failed to load')
          throw new Error(errText.includes('{') ? JSON.parse(errText).error : `Failed to load document (${res.status})`)
        }
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setFileType(detectType(doc, blob))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [doc?.id, token])

  // Block right-click
  const blockActions = (e) => { e.preventDefault(); return false }
  const resetView = () => { setRotation(0); setZoom(1); setBrightness(100); setContrast(100) }

  // ─── Authorized Download with Reason ──────────────────────────────────────
  const handleDownload = async () => {
    if (!downloadReason.trim()) {
      toast.error('You must provide a reason for downloading this document')
      return
    }

    setDownloading(true)
    try {
      const res = await fetch(`/api/documents/download/${doc.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: downloadReason.trim() }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Download not authorized')
      }

      // Trigger actual file download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName || `document-${doc.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Document downloaded — action logged')
      setShowDownloadModal(false)
      setDownloadReason('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (!doc) return null

  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,0.7)', zIndex: 2000 }}
      onClick={onClose}
      onContextMenu={blockActions}
    >
      <div
        className="modal-dialog modal-xl"
        style={{ maxWidth: '95vw', maxHeight: '95vh', margin: '2.5vh auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div className="modal-header py-2 px-3" style={{ borderBottom: '1px solid var(--das-gray-200)', flexShrink: 0 }}>
            <div className="d-flex align-items-center gap-2">
              <FiEye size={16} color="var(--das-primary)" />
              <h6 className="modal-title mb-0" style={{ fontSize: '0.875rem' }}>
                Document Viewer — {doc.documentType?.replace(/_/g, ' ')}
              </h6>
              <span className="das-badge info" style={{ fontSize: '0.625rem' }}>View Only</span>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body p-0 d-flex" style={{ flex: 1, overflow: 'hidden' }}>

            {/* Left: Document preview */}
            <div
              className="flex-grow-1 d-flex align-items-center justify-content-center"
              style={{ background: '#2d2d2d', position: 'relative', overflow: 'hidden', userSelect: 'none' }}
              onContextMenu={blockActions}
              onDragStart={blockActions}
            >
              {loading && (
                <div className="text-center">
                  <div className="spinner-das mb-2 mx-auto" style={{ width: 32, height: 32, borderTopColor: '#fff' }} />
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Loading document...</div>
                </div>
              )}

              {error && (
                <div className="text-center">
                  <FiFile size={40} color="rgba(255,255,255,0.3)" />
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: 8 }}>{error}</div>
                </div>
              )}

              {blobUrl && !loading && !error && (
                <>
                  {fileType === 'pdf' ? (
                    <iframe
                      src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      style={{
                        width: '100%', height: '100%', border: 'none',
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        transition: 'transform 0.3s ease, filter 0.2s ease',
                      }}
                      title="Document preview"
                    />
                  ) : fileType === 'image' ? (
                    <img
                      src={blobUrl} alt="Document scan"
                      style={{
                        maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                        transform: `rotate(${rotation}deg) scale(${zoom})`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        transition: 'transform 0.3s ease, filter 0.2s ease',
                        pointerEvents: 'none',
                      }}
                      draggable="false" onContextMenu={blockActions}
                    />
                  ) : (
                    <div className="text-center">
                      <FiFile size={48} color="rgba(255,255,255,0.3)" />
                      <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>Preview not available</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 4 }}>{doc.fileName}</div>
                    </div>
                  )}
                </>
              )}

              {/* Watermark */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.04, fontSize: '4rem', fontWeight: 900,
                color: '#fff', transform: 'rotate(-30deg)', letterSpacing: '0.1em', userSelect: 'none',
              }}>CONFIDENTIAL</div>
            </div>

            {/* Right: Metadata + Controls */}
            <div style={{ width: 280, borderLeft: '1px solid var(--das-gray-200)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

              {/* Document info */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--das-gray-200)', flex: 1, overflow: 'auto' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Document Information
                </div>
                {[
                  ['Type', doc.documentType?.replace(/_/g, ' ')],
                  ['Reference', doc.documentRef],
                  ['Date', doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : '—'],
                  ['File Name', doc.fileName],
                  ['Format', doc.format || 'PDF/A'],
                  ['Color Mode', doc.colorMode || 'Grayscale 8-bit'],
                  ['DPI', doc.dpiSetting ? `${doc.dpiSetting} DPI` : '—'],
                  ['Quality', doc.scanQuality],
                  ['Pages', doc.pageCount],
                  ['File Size', doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : '—'],
                  ['Scanned', doc.scanDate ? new Date(doc.scanDate).toLocaleDateString() : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="d-flex py-1" style={{ borderBottom: '1px solid var(--das-gray-100)' }}>
                    <span style={{ width: 85, fontSize: '0.6875rem', fontWeight: 600, color: 'var(--das-gray-500)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* View controls */}
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--das-gray-200)' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  View Controls
                </div>

                <div className="d-flex gap-1 mb-2">
                  <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => setRotation(r => r - 90)}>
                    <FiRotateCw size={13} style={{ transform: 'scaleX(-1)' }} /> -90°
                  </button>
                  <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => setRotation(r => r + 90)}>
                    <FiRotateCw size={13} /> +90°
                  </button>
                </div>

                <div className="d-flex gap-1 mb-2">
                  <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><FiZoomOut size={13} /></button>
                  <span className="btn btn-sm btn-outline-secondary flex-grow-1" style={{ cursor: 'default' }}>{Math.round(zoom * 100)}%</span>
                  <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><FiZoomIn size={13} /></button>
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>
                    <span><FiSun size={11} /> Brightness</span><span>{brightness}%</span>
                  </div>
                  <input type="range" className="form-range" min="30" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ height: 4 }} />
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>
                    <span><FiMoon size={11} /> Contrast</span><span>{contrast}%</span>
                  </div>
                  <input type="range" className="form-range" min="30" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} style={{ height: 4 }} />
                </div>

                <button className="btn btn-sm btn-outline-secondary w-100 mb-2" onClick={resetView}>Reset View</button>

                {/* ── Download Button — authorized roles only ── */}
                {canDownload ? (
                  <button
                    className="btn btn-sm btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-1"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <FiDownload size={13} /> Authorized Download
                  </button>
                ) : (
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2"
                    style={{ fontSize: '0.6875rem', color: 'var(--das-gray-400)' }}>
                    <FiLock size={11} /> Download restricted
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Download Reason Modal ── */}
      {showDownloadModal && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}
          onClick={() => setShowDownloadModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'rgba(220,38,38,0.05)', borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiAlertTriangle size={16} color="var(--das-danger)" />
                  </div>
                  <div>
                    <h6 className="modal-title mb-0" style={{ fontSize: '0.9375rem' }}>Authorized Document Download</h6>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>This action is permanently logged</div>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowDownloadModal(false)} />
              </div>
              <div className="modal-body">
                <div className="p-3 rounded mb-3" style={{ background: 'var(--das-gray-100)', fontSize: '0.8125rem' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--das-gray-500)' }}>Document:</span>
                    <span style={{ fontWeight: 600 }}>{doc.documentType?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span style={{ color: 'var(--das-gray-500)' }}>File:</span>
                    <span style={{ fontWeight: 500 }}>{doc.fileName}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: 'var(--das-gray-500)' }}>Requested by:</span>
                    <span style={{ fontWeight: 600 }}>{user?.name}</span>
                  </div>
                </div>

                <label className="form-label-das">
                  Reason for Download <span style={{ color: 'var(--das-danger)' }}>*</span>
                </label>
                <textarea
                  className="form-control form-control-das"
                  rows={3}
                  value={downloadReason}
                  onChange={e => setDownloadReason(e.target.value)}
                  placeholder="Provide a justification for downloading this government document (e.g., Court order reference, official request number, verification purpose...)"
                  style={!downloadReason.trim() && downloading ? { borderColor: 'var(--das-danger)' } : {}}
                />
                <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)', marginTop: 4 }}>
                  This reason, your identity, and timestamp will be recorded in the permanent audit log.
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--das-gray-200)' }}>
                <button className="btn btn-outline-secondary" onClick={() => { setShowDownloadModal(false); setDownloadReason('') }}>Cancel</button>
                <button
                  className="btn btn-danger d-flex align-items-center gap-1"
                  onClick={handleDownload}
                  disabled={downloading || !downloadReason.trim()}
                >
                  {downloading ? (
                    <><span className="spinner-border spinner-border-sm" /> Processing...</>
                  ) : (
                    <><FiDownload size={14} /> Confirm Download</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block print */}
      <style>{`@media print { .modal { display: none !important; } }`}</style>
    </div>
  )
}

export default DocumentViewer