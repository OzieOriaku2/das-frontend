import { useState, useEffect } from 'react'
import { FiLayers, FiUsers, FiFile, FiSearch, FiChevronRight, FiEye, FiDownload, FiRefreshCw, FiX, FiSliders } from 'react-icons/fi'
import {
  useGetArchiveStatsQuery, useGetReportByGenderQuery,
  useGetReportByOwnershipQuery, useGetReportByOwnerTypeQuery, useGetReportByDocTypeQuery,
} from '../slices/reportApiSlice'
import { useSearchCasesQuery, useGetCaseQuery } from '../slices/caseApiSlice'
import DocumentViewer from '../components/common/DocumentViewer'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#1B6B4A', '#2968A3', '#6848A0', '#C9A227', '#DC2626', '#0284C7', '#8A6B3A', '#5A8A6B']

// ─── Export Helpers ─────────────────────────────────────────────────────────

const exportToCSV = (reportData) => {
  if (!reportData?.rows) return
  const hasPercent = reportData.rows[0]?.percent !== undefined
  const header = hasPercent ? 'Category,Count,Percentage' : 'Category,Count'
  const rows = reportData.rows.map(r =>
    hasPercent
      ? `"${r.label.replace(/_/g, ' ')}",${r.count},${r.percent}%`
      : `"${r.label.replace(/_/g, ' ')}",${r.count}`
  )
  const footer = hasPercent ? `"Total",${reportData.total},100%` : `"Total",${reportData.total}`
  const csv = [header, ...rows, footer].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DAS_${reportData.report?.replace(/\s+/g, '_')}_${reportData.period || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const exportToPDF = (reportData) => {
  if (!reportData?.rows) return
  const hasPercent = reportData.rows[0]?.percent !== undefined
  const now = new Date().toLocaleString()
  const periodLabel = reportData.period === 'all' ? 'All Time' : reportData.period

  const tableRows = reportData.rows.map((r, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLORS[i % COLORS.length]};margin-right:8px;vertical-align:middle;"></span>
        ${r.label.replace(/_/g, ' ')}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:700;">${r.count}</td>
      ${hasPercent ? `<td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;color:#1B6B4A;">${r.percent}%</td>` : ''}
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${reportData.report} — DAS Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1B6B4A; }
    .header-left h1 { font-size: 20px; font-weight: 800; color: #1B6B4A; margin-bottom: 4px; }
    .header-left h2 { font-size: 14px; font-weight: 500; color: #666; }
    .header-right { text-align: right; font-size: 11px; color: #888; }
    .meta { display: flex; gap: 30px; margin-bottom: 24px; }
    .meta-item { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; }
    .meta-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta-value { font-size: 22px; font-weight: 800; color: #1B6B4A; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead th { background: #f5f5f5; padding: 10px 12px; font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
    thead th:nth-child(2), thead th:nth-child(3) { text-align: right; }
    tfoot td { padding: 10px 12px; font-weight: 800; border-top: 2px solid #333; }
    tfoot td:nth-child(2), tfoot td:nth-child(3) { text-align: right; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Digital Archiving System</h1>
      <h2>${reportData.report}</h2>
    </div>
    <div class="header-right">
      <div>Government of Ekiti State</div>
      <div>Ekiti Geospatial Data Center</div>
      <div style="margin-top:8px;">Generated: ${now}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Period</div>
      <div class="meta-value" style="font-size:16px;">${periodLabel}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Total Records</div>
      <div class="meta-value">${reportData.total}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Categories</div>
      <div class="meta-value">${reportData.rows.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th style="text-align:right;">Count</th>
        ${hasPercent ? '<th style="text-align:right;">Percentage</th>' : ''}
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td style="text-align:right;color:#1B6B4A;">${reportData.total}</td>
        ${hasPercent ? '<td style="text-align:right;">100%</td>' : ''}
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <span>DAS — Digital Archiving System · Confidential</span>
    <span>Page 1 of 1</span>
  </div>

  <div class="no-print" style="margin-top:20px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 24px;background:#1B6B4A;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

// ─── Advanced Search Modal ──────────────────────────────────────────────────
// ─── Reusable form fields for Advanced Search (OUTSIDE to prevent remount) ──
const AdvField = ({ label, k, type = 'text', placeholder, value, onChange }) => (
  <div>
    <label className="form-label-das">{label}</label>
    <input type={type} className="form-control form-control-das form-control-sm" value={value || ''}
      onChange={e => onChange(k, e.target.value)} placeholder={placeholder} />
  </div>
)

const AdvSelect = ({ label, k, options, value, onChange }) => (
  <div>
    <label className="form-label-das">{label}</label>
    <select className="form-control form-control-das form-control-sm" value={value || ''} onChange={e => onChange(k, e.target.value)}>
      <option value="">— Any —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const AdvancedSearchModal = ({ filters, onApply, onClose }) => {
  const [f, setF] = useState({ ...filters })
  const set = (k, v) => setF(prev => {
    const next = { ...prev }
    if (v === '' || v === undefined || v === null) { delete next[k] } else { next[k] = v }
    return next
  })
  const activeCount = Object.keys(f).length

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000 }} onClick={onClose}>
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header" style={{ borderBottom: '1px solid var(--das-gray-200)' }}>
            <div>
              <h5 className="modal-title mb-0" style={{ fontSize: '1rem', fontWeight: 700 }}>
                <FiSliders size={16} className="me-2" style={{ color: 'var(--das-primary)' }} />
                Advanced Search
              </h5>
              <div style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>
                Filter committed records by specific fields, dates, and ranges
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Owner Details */}
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4, marginBottom: 10 }}>
              Owner Details
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-4"><AdvField label="First Name" k="firstName" placeholder="e.g. Abubakar" value={f.firstName} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="Surname" k="lastName" placeholder="e.g. Mohammed" value={f.lastName} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="Owner ID / NIN" k="ownerId" placeholder="e.g. NIN12345678901" value={f.ownerId} onChange={set} /></div>
              <div className="col-md-4">
                <AdvSelect label="Gender" k="gender" value={f.gender} onChange={set} options={[
                  { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' },
                ]} />
              </div>
              <div className="col-md-4">
                <AdvSelect label="Owner Type" k="ownerType" value={f.ownerType} onChange={set} options={[
                  { value: 'INDIVIDUAL', label: 'Individual' }, { value: 'CORPORATE', label: 'Corporate' },
                  { value: 'GOVERNMENT', label: 'Government' }, { value: 'JOINT_VENTURE', label: 'Joint Venture' },
                ]} />
              </div>
              <div className="col-md-4">
                <AdvSelect label="Ownership Type" k="ownershipType" value={f.ownershipType} onChange={set} options={[
                  { value: 'SINGLE_OWNED', label: 'Single Owned' },
                  { value: 'JOINT_CO_OWNED', label: 'Joint / Co-owned (M&F)' },
                  { value: 'CORPORATE_OWNED', label: 'Corporate Owned' },
                ]} />
              </div>
            </div>

            {/* Property & Reference */}
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4, marginBottom: 10 }}>
              Property &amp; Reference Numbers
            </div>
            <div className="row g-2 mb-3">
              <div className="col-md-4"><AdvField label="CofO Number" k="cofoNumber" placeholder="e.g. COFO-2024-001" value={f.cofoNumber} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="CofO Reference" k="cofoReference" placeholder="e.g. REF/2024/5000" value={f.cofoReference} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="File Number" k="fileNumber" placeholder="e.g. FN/2024/1000" value={f.fileNumber} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="Property / Survey ID" k="propertyId" placeholder="e.g. SRV/5001" value={f.propertyId} onChange={set} /></div>
              <div className="col-md-4"><AdvField label="Location" k="location" placeholder="e.g. Plot 1, Block A" value={f.location} onChange={set} /></div>
            </div>

            {/* Date Ranges */}
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--das-gray-200)', paddingBottom: 4, marginBottom: 10 }}>
              Date Ranges
            </div>
            <div className="row g-2">
              <div className="col-md-3"><AdvField label="Registration From" k="regDateFrom" type="date" value={f.regDateFrom} onChange={set} /></div>
              <div className="col-md-3"><AdvField label="Registration To" k="regDateTo" type="date" value={f.regDateTo} onChange={set} /></div>
              <div className="col-md-3"><AdvField label="Issuance From" k="issueDateFrom" type="date" value={f.issueDateFrom} onChange={set} /></div>
              <div className="col-md-3"><AdvField label="Issuance To" k="issueDateTo" type="date" value={f.issueDateTo} onChange={set} /></div>
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid var(--das-gray-200)', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setF({}); onApply({}) }}>
              Clear All Filters
            </button>
            <div className="d-flex gap-2 align-items-center">
              {activeCount > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--das-primary)', fontWeight: 600 }}>{activeCount} filter{activeCount > 1 ? 's' : ''} active</span>
              )}
              <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-das-primary" onClick={() => onApply(f)}>
                <FiSearch size={14} className="me-1" /> Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Archive = () => {
  const [tab, setTab] = useState('browse')
  const [searchQ, setSearchQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [searchTrigger, setSearchTrigger] = useState({ stage: 'COMMITTED', page: 1, pageSize: 20 })
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [showAdvSearch, setShowAdvSearch] = useState(false)
  const [advFilters, setAdvFilters] = useState({})

  // Reports state
  const [rType, setRType] = useState('gender')
  const [period, setPeriod] = useState('all')

  // ─── Debounced real-time search (300ms) ───────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchQ)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQ])

  useEffect(() => {
    setSearchTrigger(prev => ({
      ...prev,
      ...advFilters,
      q: debouncedQ || undefined,
      page: 1,
    }))
  }, [debouncedQ, advFilters])

  const { data: stats, isLoading: statsLoading } = useGetArchiveStatsQuery()
  const { data: searchData, isFetching: searching } = useSearchCasesQuery(searchTrigger, { skip: tab !== 'browse' })
  const { data: caseDetail } = useGetCaseQuery(selectedCaseId, { skip: !selectedCaseId })

  // Report queries — only fetch when on reports tab
  const genderQ = useGetReportByGenderQuery(period, { skip: tab !== 'reports' || rType !== 'gender' })
  const ownershipQ = useGetReportByOwnershipQuery(period, { skip: tab !== 'reports' || rType !== 'ownership' })
  const ownerTypeQ = useGetReportByOwnerTypeQuery(period, { skip: tab !== 'reports' || rType !== 'ownertype' })
  const docTypeQ = useGetReportByDocTypeQuery(period, { skip: tab !== 'reports' || rType !== 'doctypes' })
  const reportMap = { gender: genderQ, ownership: ownershipQ, ownertype: ownerTypeQ, doctypes: docTypeQ }
  const activeReport = reportMap[rType]

  const doSearch = (page = 1) => setSearchTrigger(prev => ({ ...prev, page }))
  const s = stats || { total: 0, gender: { male: 0, female: 0, femalePercent: '0' }, jointMaleFemale: { count: 0, percent: '0' }, documents: { total: 0, avgPerCase: '0', byType: {} }, ownerType: {}, ownershipType: {} }

  if (statsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="text-center">
          <div className="spinner-das mb-3 mx-auto" style={{ width: 40, height: 40 }} />
          <p className="text-muted">Loading archive data...</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW — single case with documents and audit trail
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedCaseId && caseDetail?.case) {
    const c = caseDetail.case
    return (
      <div className="fade-in">
        <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setSelectedCaseId(null)}>← Back to list</button>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="das-card">
              <div className="das-card-body">
                <h5 className="mb-3">{c.cofoNumber} <span className="das-badge success">Committed</span>
                  {c.source === 'LMIS_IMPORT' && <span className="das-badge info ms-1">LMIS</span>}
                </h5>
                {[
                  ['Full Name', c.fullName], ['Owner ID', c.ownerId], ['Gender', c.gender?.replace(/_/g, ' ')],
                  ['Owner Type', c.ownerType?.replace(/_/g, ' ')], ['Ownership', c.ownershipType?.replace(/_/g, ' ')],
                  ['Property ID', c.propertyId], ['Location', c.location],
                  ['Physical Storage', c.physicalLocation],
                  ['File Number', c.fileNumber], ['CofO Reference', c.cofoReference],
                  ['Issued', c.issuanceDate ? new Date(c.issuanceDate).toLocaleDateString() : '—'],
                  ['Registered', c.registrationDate ? new Date(c.registrationDate).toLocaleDateString() : '—'],
                  ['Office', c.office?.name],
                ].map(([l, v]) => (
                  <div key={l} className="d-flex py-2 border-bottom">
                    <span style={{ width: 140, fontSize: '0.75rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{l}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem' }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="das-card mb-3">
              <div className="das-card-body">
                <h6 className="mb-3">Documents ({c.documents?.length})</h6>
                {c.documents?.map(doc => (
                  <div key={doc.id} className="d-flex align-items-center p-2 rounded mb-1" style={{ background: 'var(--das-gray-100)' }}>
                    <FiFile className="me-2" style={{ color: 'var(--das-primary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{doc.documentType?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{doc.format} · {doc.dpiSetting}DPI · {doc.pageCount}pg</div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setViewDoc(doc)}>
                      <FiEye size={13} className="me-1" />View
                    </button>
                  </div>
                ))}
                {(!c.documents || c.documents.length === 0) && <p className="text-muted mb-0">No documents</p>}
              </div>
            </div>
            <div className="das-card">
              <div className="das-card-body">
                <h6 className="mb-3">Audit Trail</h6>
                {c.auditLogs?.map((log, i) => (
                  <div key={log.id || i} className="d-flex gap-2 py-2 border-bottom">
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--das-primary)', marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{log.action?.replace(/_/g, ' ')}</div>
                      {log.reason && <div style={{ fontSize: '0.75rem', color: 'var(--das-gray-600)', fontStyle: 'italic' }}>{log.reason}</div>}
                      <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{log.user?.name} · {new Date(log.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Document Viewer — INSIDE detail view return */}
        {viewDoc && <DocumentViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN VIEW — hero stats, tabs
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fade-in">
      {/* Hero Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Case Files', value: s.total, icon: FiLayers, color: 'green' },
          { label: 'Female Owned', value: `${s.gender.femalePercent}%`, sub: `${s.gender.female} CofOs`, icon: FiUsers, color: 'purple' },
          { label: 'Joint (M&F)', value: s.jointMaleFemale.count, sub: `${s.jointMaleFemale.percent}%`, icon: FiUsers, color: 'blue' },
          { label: 'Total Documents', value: s.documents.total, sub: `${s.documents.avgPerCase} per case`, icon: FiFile, color: 'gold' },
          { label: 'Corporate', value: s.ownerType.CORPORATE || 0, icon: FiLayers, color: 'danger' },
        ].map((st, i) => (
          <div key={i} className="col">
            <div className="stat-card">
              <div className={`stat-icon ${st.color}`}><st.icon /></div>
              <div className="stat-content">
                <span className="stat-value">{st.value}</span>
                <span className="stat-label">{st.label}</span>
                {st.sub && <span style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{st.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {[{ id: 'browse', label: 'Browse & View' }, { id: 'analytics', label: 'Analytics' }, { id: 'reports', label: 'Reports' }].map(t => (
          <li key={t.id} className="nav-item">
            <button className={`nav-link ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}
              style={tab === t.id ? { color: 'var(--das-primary)', fontWeight: 600 } : {}}>{t.label}</button>
          </li>
        ))}
      </ul>

      {/* ═══════════════════════════════════════════════════════════════════
          BROWSE TAB
          ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'browse' && (
        <div>
          <div className="d-flex gap-2 mb-2">
            <div className="flex-grow-1 position-relative">
              <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--das-gray-400)' }} />
              <input
                className="form-control form-control-das"
                style={{ paddingLeft: 36, paddingRight: searchQ ? 36 : 12 }}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name, CofO number, reference, file number, location, owner ID…"
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <FiX size={16} color="var(--das-gray-400)" />
                </button>
              )}
            </div>
            <button className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={() => setShowAdvSearch(true)}>
              <FiSliders size={14} /> Advanced
              {Object.keys(advFilters).length > 0 && (
                <span className="das-badge success" style={{ marginLeft: 2 }}>{Object.keys(advFilters).length}</span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {Object.keys(advFilters).length > 0 && (
            <div className="d-flex flex-wrap gap-1 mb-3">
              {Object.entries(advFilters).map(([k, v]) => (
                <span key={k} className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: 'rgba(27,107,74,0.08)', color: 'var(--das-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}: {String(v).replace(/_/g, ' ')}
                  <button onClick={() => { const nf = { ...advFilters }; delete nf[k]; setAdvFilters(nf) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <FiX size={12} color="var(--das-primary)" />
                  </button>
                </span>
              ))}
              <button className="btn btn-sm btn-link p-0" style={{ fontSize: '0.75rem' }} onClick={() => setAdvFilters({})}>Clear all</button>
            </div>
          )}

          {searching && <div className="text-center py-2" style={{ fontSize: '0.8125rem', color: 'var(--das-gray-500)' }}>Searching...</div>}

          {searchData && !searching && (
            <div className="das-card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead><tr>{['CofO ID', 'Owner', 'Gender', 'Ownership', 'Docs', 'Date', ''].map(h => <th key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                  <tbody>{searchData.cases.map(r => (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCaseId(r.id)}>
                      <td style={{ fontWeight: 600, color: 'var(--das-primary)' }}>{r.cofoNumber}</td>
                      <td><div style={{ fontWeight: 500 }}>{r.fullName}</div><div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{r.fileNumber}</div></td>
                      <td><span className={`das-badge ${r.gender === 'FEMALE' ? 'purple' : 'info'}`}>{r.gender}</span></td>
                      <td style={{ fontSize: '0.8125rem' }}>{r.ownershipType?.replace(/_/g, ' ')}</td>
                      <td><span className="das-badge success">{r.documents?.length}</span></td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--das-gray-500)' }}>{r.registrationDate ? new Date(r.registrationDate).toLocaleDateString() : '—'}</td>
                      <td><FiChevronRight size={14} color="var(--das-gray-400)" /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ fontSize: '0.8125rem', color: 'var(--das-gray-500)' }}>
                <span>Page {searchData.pagination.page}/{searchData.pagination.totalPages} · {searchData.pagination.total} records</span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary" disabled={searchData.pagination.page <= 1} onClick={() => doSearch(searchData.pagination.page - 1)}>Prev</button>
                  <button className="btn btn-sm btn-outline-secondary" disabled={searchData.pagination.page >= searchData.pagination.totalPages} onClick={() => doSearch(searchData.pagination.page + 1)}>Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ANALYTICS TAB — Live charts from archive stats
          ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="row g-4">
          {/* Gender Pie + Bar */}
          <div className="col-md-6">
            <div className="das-card h-100">
              <div className="das-card-body">
                <h6 className="mb-3" style={{ fontWeight: 700 }}>Gender Distribution</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Male', value: s.gender.male },
                      { name: 'Female', value: s.gender.female },
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} >
                      <Cell fill="#2968A3" />
                      <Cell fill="#6848A0" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="d-flex justify-content-center gap-4 mt-2" style={{ fontSize: '0.8125rem' }}>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#2968A3', marginRight: 6 }} />Male: <strong>{s.gender.male}</strong></div>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#6848A0', marginRight: 6 }} />Female: <strong>{s.gender.female}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Type Bar */}
          <div className="col-md-6">
            <div className="das-card h-100">
              <div className="das-card-body">
                <h6 className="mb-3" style={{ fontWeight: 700 }}>Owner Type Breakdown</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(s.ownerType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--das-gray-200)" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {Object.keys(s.ownerType).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ownership Type Pie */}
          <div className="col-md-6">
            <div className="das-card h-100">
              <div className="das-card-body">
                <h6 className="mb-3" style={{ fontWeight: 700 }}>Ownership Type</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={Object.entries(s.ownershipType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                      {Object.keys(s.ownershipType).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Document Types Bar */}
          <div className="col-md-6">
            <div className="das-card h-100">
              <div className="das-card-body">
                <h6 className="mb-3" style={{ fontWeight: 700 }}>Documents by Type</h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(s.documents.byType || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))} margin={{ bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--das-gray-200)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {Object.keys(s.documents.byType || {}).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="col-12">
            <div className="das-card">
              <div className="das-card-body">
                <h6 className="mb-3" style={{ fontWeight: 700 }}>Summary Statistics</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 rounded" style={{ background: 'var(--das-gray-100)' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>Gender</div>
                      <table className="table table-sm mb-0" style={{ fontSize: '0.8125rem' }}>
                        <tbody>
                          <tr><td>Male</td><td className="text-end fw-bold">{s.gender.male}</td></tr>
                          <tr><td>Female</td><td className="text-end fw-bold">{s.gender.female}</td></tr>
                          <tr><td>Female %</td><td className="text-end fw-bold" style={{ color: 'var(--das-primary)' }}>{s.gender.femalePercent}%</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded" style={{ background: 'var(--das-gray-100)' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>Ownership</div>
                      <table className="table table-sm mb-0" style={{ fontSize: '0.8125rem' }}>
                        <tbody>
                          {Object.entries(s.ownershipType).map(([k, v]) => (
                            <tr key={k}><td>{k.replace(/_/g, ' ')}</td><td className="text-end fw-bold">{v}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 rounded" style={{ background: 'var(--das-gray-100)' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', marginBottom: 8 }}>Documents</div>
                      <table className="table table-sm mb-0" style={{ fontSize: '0.8125rem' }}>
                        <tbody>
                          <tr><td>Total</td><td className="text-end fw-bold">{s.documents.total}</td></tr>
                          <tr><td>Avg per Case</td><td className="text-end fw-bold">{s.documents.avgPerCase}</td></tr>
                          {Object.entries(s.documents.byType || {}).map(([k, v]) => (
                            <tr key={k}><td style={{ fontSize: '0.75rem' }}>{k.replace(/_/g, ' ')}</td><td className="text-end fw-bold">{v}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          REPORTS TAB — Period-based reports with charts + tables
          ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'reports' && (
        <div>
          {/* Filters */}
          <div className="das-card mb-4">
            <div className="das-card-body">
              <div className="row g-3 align-items-end">
                <div className="col-auto">
                  <label className="form-label-das">Report Type</label>
                  <select className="form-control form-control-das" value={rType} onChange={e => setRType(e.target.value)}>
                    <option value="gender">CofOs by Gender</option>
                    <option value="ownership">CofOs by Ownership Type</option>
                    <option value="ownertype">CofOs by Owner Type</option>
                    <option value="doctypes">Captured Documents by Type</option>
                  </select>
                </div>
                <div className="col-auto">
                  <label className="form-label-das">Period</label>
                  <select className="form-control form-control-das" value={period} onChange={e => setPeriod(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="col-auto">
                  <button className="btn btn-outline-secondary" onClick={() => activeReport.refetch?.()}>
                    <FiRefreshCw size={14} className="me-1" /> Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report Content */}
          {activeReport.isLoading && <div className="text-center py-4"><div className="spinner-das mx-auto" /></div>}

          {activeReport.data && (
            <div className="row g-4">
              {/* Chart */}
              <div className="col-lg-7">
                <div className="das-card">
                  <div className="das-card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0" style={{ fontWeight: 700 }}>{activeReport.data.report}</h6>
                      <span style={{ fontSize: '0.75rem', color: 'var(--das-gray-500)' }}>
                        Period: {activeReport.data.period === 'all' ? 'All Time' : activeReport.data.period} · Total: {activeReport.data.total}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      {activeReport.data.rows?.length <= 4 ? (
                        <PieChart>
                          <Pie
                            data={activeReport.data.rows.map(r => ({ name: r.label.replace(/_/g, ' '), value: r.count }))}
                            cx="50%" cy="50%" innerRadius={55} outerRadius={110} paddingAngle={4} dataKey="value"
                            label={({ name, percent }) => percent > 0.03 ? `${name} ${(percent * 100).toFixed(1)}%` : ''}
                          >
                            {activeReport.data.rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(val) => [val, 'Count']} />
                          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        </PieChart>
                      ) : (
                        <BarChart data={activeReport.data.rows.map(r => ({ name: r.label.replace(/_/g, ' '), count: r.count }))} margin={{ bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--das-gray-200)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, angle: -30, textAnchor: 'end' }} height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {activeReport.data.rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="col-lg-5">
                <div className="das-card">
                  <div className="das-card-body">
                    <h6 className="mb-3" style={{ fontWeight: 700 }}>Data Table</h6>
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>Category</th>
                          <th style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', textAlign: 'right' }}>Count</th>
                          {activeReport.data.rows?.[0]?.percent && (
                            <th style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', textAlign: 'right' }}>%</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {activeReport.data.rows?.map((r, i) => (
                          <tr key={r.label}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                <span style={{ fontSize: '0.875rem' }}>{r.label.replace(/_/g, ' ')}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.count}</td>
                            {r.percent && <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--das-primary)' }}>{r.percent}%</td>}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--das-gray-300)' }}>
                          <td style={{ fontWeight: 700 }}>Total</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--das-primary)' }}>{activeReport.data.total}</td>
                          {activeReport.data.rows?.[0]?.percent && <td style={{ textAlign: 'right', fontWeight: 700 }}>100%</td>}
                        </tr>
                      </tfoot>
                    </table>

                    {/* Export buttons */}
                    <div className="d-flex gap-2 mt-3 pt-3 border-top">
                      <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => exportToPDF(activeReport.data)}>
                        <FiDownload size={13} className="me-1" /> Export PDF
                      </button>
                      <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => exportToCSV(activeReport.data)}>
                        <FiDownload size={13} className="me-1" /> Export Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ADVANCED SEARCH MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {showAdvSearch && <AdvancedSearchModal
        filters={advFilters}
        onApply={(f) => { setAdvFilters(f); setShowAdvSearch(false) }}
        onClose={() => setShowAdvSearch(false)}
      />}

      {/* Document Viewer — for browse tab (outside detail view) */}
      {viewDoc && <DocumentViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  )
}

export default Archive