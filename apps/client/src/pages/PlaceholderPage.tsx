export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </header>
      <div className="form-card">
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
          This module is coming soon. It will be implemented in a future phase.
        </p>
      </div>
    </div>
  );
}
