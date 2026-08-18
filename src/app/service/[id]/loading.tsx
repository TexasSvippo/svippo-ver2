export default function ServiceDetailLoading() {
  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div className="skeleton" style={{ width: 220, height: 14, marginBottom: 24 }} />

      <div className="skeleton" style={{ width: 120, height: 22, borderRadius: 999, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: '60%', height: 34, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: 260, height: 16, marginBottom: 32 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 60%) minmax(0, 35%)', gap: 32 }}>
        <div>
          <div className="skeleton" style={{ width: '100%', height: 360, marginBottom: 24 }} />
          <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 32 }} />
          <div className="skeleton" style={{ width: 160, height: 20, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 90 }} />
        </div>

        <div>
          <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 12, marginBottom: 20 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 12 }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  )
}
