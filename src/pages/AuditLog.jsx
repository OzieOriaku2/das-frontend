import { useState, useEffect } from 'react'
import { FiSearch, FiX, FiShield, FiEye, FiDownload, FiCheck, FiXCircle, FiEdit, FiFile, FiRefreshCw } from 'react-icons/fi'
import { useGetAuditLogsQuery } from '../slices/adminApiSlice'

const ACTION_CONFIG = {
  SCANNED:             { label: 'Scanned',            color: 'info',    icon: FiFile },
  INDEXED:             { label: 'Indexed',             color: 'info',    icon: FiEdit },
  QA_APPROVED:         { label: 'QA Approved',         color: 'success', icon: FiCheck },
  QA_REJECTED:         { label: 'QA Rejected',         color: 'danger',  icon: FiXCircle },
  EDITED:              { label: 'Edited',              color: 'warning', icon: FiEdit },
  RECORD_CREATED:      { label: 'Record Created',      color: 'info',    icon: FiFile },
  DOCUMENT_ADDED:      { label: 'Document Added',      color: 'info',    icon: FiFile },
  DOCUMENT_REMOVED:    { label: 'Document Removed',    color: 'danger',  icon: FiXCircle },
  DOCUMENT_VIEWED:     { label: 'Document Viewed',     color: 'purple',  icon: FiEye },
  DOCUMENT_DOWNLOADED: { label: 'Document Downloaded', color: 'danger',  icon: FiDownload },
  LMIS_INGESTED:       { label: 'LMIS Ingested',      color: 'success', icon: FiShield },
}

const ACTIONS = Object.keys(ACTION_CONFIG)

const AuditLog = () => {
  const [searchQ, setSearchQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 300)
    return () => clearTimeout(t)
  }, [searchQ])

  useEffect(() => { setPage(1) }, [debouncedQ, actionFilter])

  const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery({
    q: debouncedQ || undefined,
    action: actionFilter || undefined,
    page,
    pageSize: 50,
  })

  const logs = data?.logs || []
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 }

  return (
    <div className="fade-in">
      {/* Filters */}
      <div className="das-card mb-3">
        <div className="das-card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col">
              <div className="position-relative">
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--das-gray-400)' }} />
                <input
                  className="form-control form-control-das"
                  style={{ paddingLeft: 36, paddingRight: searchQ ? 36 : 12 }}
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search by CofO number, owner name, user, reason…"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    <FiX size={16} color="var(--das-gray-400)" />
                  </button>
                )}
              </div>
            </div>
            <div className="col-auto">
              <select className="form-control form-control-das" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ minWidth: 200 }}>
                <option value="">All Actions</option>
                {ACTIONS.map(a => <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>)}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-secondary" onClick={refetch}><FiRefreshCw size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary badges */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <span style={{ fontSize: '0.8125rem', color: 'var(--das-gray-500)' }}>{pagination.total} total entries</span>
        {actionFilter && (
          <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: 'rgba(27,107,74,0.08)', color: 'var(--das-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
            {ACTION_CONFIG[actionFilter]?.label}
            <button onClick={() => setActionFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <FiX size={12} color="var(--das-primary)" />
            </button>
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && <div className="text-center py-5"><div className="spinner-das mx-auto" style={{ width: 40, height: 40 }} /></div>}

      {/* Table */}
      {!isLoading && (
        <div className="das-card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  {['Timestamp', 'Action', 'User', 'Case', 'Details', 'Reason'].map(h => (
                    <th key={h} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--das-gray-500)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No audit entries found</td></tr>
                )}
                {logs.map(log => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: 'info', icon: FiFile }
                  const Icon = cfg.icon
                  return (
                    <tr key={log.id} style={{ opacity: isFetching ? 0.5 : 1 }}>
                      <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500 }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        <span className={`das-badge ${cfg.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{log.user?.name || '—'}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{log.user?.role?.replace(/_/g, ' ')}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--das-primary)' }}>{log.cofOCase?.cofoNumber || '—'}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{log.cofOCase?.fullName}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.fieldName && <span style={{ color: 'var(--das-gray-600)' }}>{log.fieldName}: </span>}
                        {log.newValue || '—'}
                      </td>
                      <td style={{ fontSize: '0.8125rem', maxWidth: 200 }}>
                        {log.reason ? (
                          <span style={{ fontStyle: 'italic', color: 'var(--das-gray-600)' }}>{log.reason}</span>
                        ) : (
                          <span style={{ color: 'var(--das-gray-400)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ fontSize: '0.8125rem', color: 'var(--das-gray-500)' }}>
            <span>Page {pagination.page}/{pagination.totalPages} · {pagination.total} entries</span>
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLog