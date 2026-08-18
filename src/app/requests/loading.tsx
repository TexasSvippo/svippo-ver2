export default function RequestsLoading() {
  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="skeleton" style={{ width: 200, height: 30, marginBottom: 24 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '30%', height: 12 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 20 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
