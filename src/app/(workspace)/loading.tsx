export default function WorkspaceLoading() {
  return (
    <div className="brand-page loading-page" aria-label="Memuat halaman" role="status">
      <span className="visually-hidden">Memuat data...</span>
      <div className="loading-heading">
        <span />
        <strong />
        <small />
      </div>
      <div className="loading-card-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="loading-card" key={index}>
            <span />
            <strong />
            <small />
          </div>
        ))}
      </div>
      <div className="loading-table">
        <span />
        {Array.from({ length: 5 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  );
}
