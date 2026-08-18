export default function ProviderProfileLoading() {
  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 88, height: 88, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '35%', height: 26, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: '20%', height: 16, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: '50%', height: 14 }} />
        </div>
      </div>

      <div className="skeleton" style={{ width: 140, height: 22, marginBottom: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '30%', height: 12 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 20 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
