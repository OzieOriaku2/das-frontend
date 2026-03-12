import { FiMonitor, FiDatabase, FiHardDrive } from 'react-icons/fi'

const Settings = () => (
  <div className="fade-in" style={{ maxWidth: 700 }}>
    <div className="das-card mb-4">
      <div className="das-card-body">
        <h6 className="mb-3" style={{ fontWeight: 700 }}><FiMonitor size={18} className="me-2" style={{ color: 'var(--das-primary)' }} />System Information</h6>
        {[['Application', 'Digital Archiving System (DAS)'], ['Version', '1.0.0'], ['Environment', import.meta.env.MODE], ['API Endpoint', import.meta.env.VITE_API_URL || '/api']].map(([l, v]) => (
          <div key={l} className="d-flex py-2 border-bottom">
            <span style={{ width: 160, fontSize: '0.75rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{l}</span>
            <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="das-card mb-4">
      <div className="das-card-body">
        <h6 className="mb-3" style={{ fontWeight: 700 }}><FiHardDrive size={18} className="me-2" style={{ color: 'var(--das-primary)' }} />Scanning Defaults</h6>
        {[['Format', 'PDF/A (ISO 19005)'], ['Color Mode', 'Grayscale 8-bit'], ['Default DPI', '150 DPI (Good Quality)'], ['Degraded DPI', '300 DPI (Poor/Damaged)'], ['Page Handling', 'One multipage PDF per physical document']].map(([l, v]) => (
          <div key={l} className="d-flex py-2 border-bottom">
            <span style={{ width: 160, fontSize: '0.75rem', fontWeight: 600, color: 'var(--das-gray-500)', textTransform: 'uppercase' }}>{l}</span>
            <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="das-card">
      <div className="das-card-body">
        <h6 className="mb-3" style={{ fontWeight: 700 }}><FiDatabase size={18} className="me-2" style={{ color: 'var(--das-primary)' }} />Data Policy</h6>
        <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--das-gray-700)' }}>
          <p>All data is stored on-premise within the Ekiti Geospatial Data Center infrastructure. No data is transmitted to external servers or cloud services.</p>
          <p>Document downloads are restricted to authorized personnel (Administrator, Editor) and require a mandatory documented reason. Every view and download is permanently recorded in the audit log.</p>
          <p className="mb-0">Committed records are read-only. Modifications require Editor-role access with mandatory justification, tracked in the audit trail.</p>
        </div>
      </div>
    </div>
  </div>
)

export default Settings