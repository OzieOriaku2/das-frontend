import { FiTarget, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'
import { useGetDigitizationReportQuery } from '../slices/reportApiSlice'

const DigiDashboard = () => {
  const { data, isLoading, error, refetch } = useGetDigitizationReportQuery()

  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
      <div className="text-center"><div className="spinner-das mb-3 mx-auto" style={{ width: 40, height: 40 }} /><p className="text-muted">Loading pipeline data...</p></div>
    </div>
  )

  if (error) return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between">
      <span>Failed to load. <button className="btn btn-sm btn-outline-danger ms-2" onClick={refetch}><FiRefreshCw className="me-1" /> Retry</button></span>
    </div>
  )

  const d = data
  const totalInv = d.offices.reduce((s, o) => s + o.hardcopyInventory, 0)

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <p className="text-muted mb-0">{d.pipeline.total} cases · {d.totalDocuments} documents · PDF/A Grayscale 8-bit</p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={refetch}><FiRefreshCw className="me-1" /> Refresh</button>
      </div>

      {/* Pipeline Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Scanned', value: d.pipeline.total, sub: `of ${totalInv.toLocaleString()} cases`, color: 'blue' },
          { label: 'Committed', value: d.pipeline.committed, sub: 'verified & archived', color: 'green' },
          { label: 'Awaiting Indexing', value: d.pipeline.scanned + d.pipeline.indexing, sub: 'in queue', color: 'gold' },
          { label: 'In QA Review', value: d.pipeline.qaReview, sub: 'awaiting verification', color: 'purple' },
          { label: 'Rejected', value: d.pipeline.rejected, sub: 'needs attention', color: 'danger' },
        ].map((st, i) => (
          <div key={i} className="col">
            <div className="stat-card">
              <div className={`stat-icon ${st.color}`}><FiTarget /></div>
              <div className="stat-content">
                <span className="stat-value">{st.value}</span>
                <span className="stat-label">{st.label}</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--das-gray-500)' }}>{st.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Office Breakdown */}
      <div className="das-card">
        <div className="das-card-body">
          <h6 className="mb-3">Office Breakdown</h6>
          <div className="row g-3">
            {d.offices.map(o => (
              <div key={o.id} className="col-md-6">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 500 }}>{o.name}</span>
                  <span style={{ color: 'var(--das-gray-500)', fontWeight: 600 }}>{o.committed}/{o.hardcopyInventory.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                  <div className="progress-bar" role="progressbar" style={{ width: `${o.percentComplete}%`, background: 'linear-gradient(90deg, var(--das-primary), var(--das-primary-light))', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DigiDashboard
