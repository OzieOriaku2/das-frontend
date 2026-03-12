import { FiBookOpen, FiMail, FiPhone, FiHelpCircle, FiFileText, FiShield } from 'react-icons/fi'

const Help = () => {
  const guides = [
    { icon: FiFileText, title: 'Scanning Guide', desc: 'How to scan documents — DPI settings, PDF/A compliance, multipage assembly' },
    { icon: FiBookOpen, title: 'Data Entry Guide', desc: 'Indexing workflow — required fields, document upload, metadata entry' },
    { icon: FiShield, title: 'QA Review Guide', desc: 'Verification process — checking metadata against scanned documents' },
    { icon: FiHelpCircle, title: 'Archive Browser', desc: 'Searching records, viewing documents, understanding reports and analytics' },
  ]

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div className="das-card mb-4">
        <div className="das-card-body">
          <h5 className="mb-1" style={{ fontWeight: 700 }}>Help & Support</h5>
          <p style={{ fontSize: '0.875rem', color: 'var(--das-gray-500)', marginBottom: 0 }}>
            Digital Archiving System — CofO Mass Digitization
          </p>
        </div>
      </div>

      <div className="das-card mb-4">
        <div className="das-card-body">
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            User Guides
          </div>
          <div className="row g-3">
            {guides.map(g => (
              <div key={g.title} className="col-md-6">
                <div className="p-3 rounded h-100" style={{ background: 'var(--das-gray-100)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,107,74,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--das-gray-100)'}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <g.icon size={18} color="var(--das-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{g.title}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--das-gray-600)', marginBottom: 0 }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="das-card mb-4">
        <div className="das-card-body">
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Quick Reference
          </div>

          <h6 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8 }}>Required Documents per Case File</h6>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--das-gray-700)', paddingLeft: '1.25rem', marginBottom: 16 }}>
            <li>Certificate of Occupancy (CofO) — <strong>mandatory</strong></li>
            <li>Land Parcel Diagram / Location Map — <strong>mandatory</strong></li>
            <li>Owner's ID — <strong>mandatory</strong></li>
            <li>Allocation Letter — if applicable</li>
            <li>Tax Clearance — if applicable</li>
            <li>Survey Plan — if applicable</li>
          </ul>

          <h6 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8 }}>Scanning Standards</h6>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--das-gray-700)', paddingLeft: '1.25rem', marginBottom: 0 }}>
            <li>Format: PDF/A (ISO 19005)</li>
            <li>Color Mode: Grayscale 8-bit</li>
            <li>Resolution: 150 DPI (good condition) / 300 DPI (poor/degraded)</li>
            <li>One multipage PDF per physical document</li>
          </ul>
        </div>
      </div>

      <div className="das-card">
        <div className="das-card-body">
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--das-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Contact Support
          </div>
          <div className="d-flex gap-4">
            <div className="d-flex align-items-center gap-2">
              <FiMail size={16} color="var(--das-primary)" />
              <span style={{ fontSize: '0.875rem' }}>sgdc@ekitistate.gov.ng</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <FiPhone size={16} color="var(--das-primary)" />
              <span style={{ fontSize: '0.875rem' }}>+234 706 757 2652</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help