export default function Toolbar({
  search,
  setSearch,
  viewMenuOpen,
  toggleViewMenu,
  viewMode,
  chooseViewMode,
  setViewMenuOpen,
  openTrash,
  hiddenCount,
  canManage,
  openSqlImport,
  openAddForm,
}) {
  return (
    <div className="ka-toolbar">
      <input
        type="text"
        className="ka-search"
        placeholder="Cari di bagian ini…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="ka-view-menu-wrap">
        <button
          type="button"
          className="ka-view-menu-btn"
          onClick={toggleViewMenu}
          aria-label="Mode tampilan"
          aria-expanded={viewMenuOpen}
        >
          ⋮
        </button>
        {viewMenuOpen && (
          <>
            <div className="ka-view-menu-backdrop" onClick={() => setViewMenuOpen(false)} />
            <div className="ka-view-menu">
              <button
                type="button"
                className={`ka-view-menu-item ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => chooseViewMode('all')}
              >
                Tampilkan semua
              </button>
              <button
                type="button"
                className={`ka-view-menu-item ${viewMode === 'korean_only' ? 'active' : ''}`}
                onClick={() => chooseViewMode('korean_only')}
              >
                Hanya Korea
              </button>
              <button
                type="button"
                className={`ka-view-menu-item ${viewMode === 'indo_only' ? 'active' : ''}`}
                onClick={() => chooseViewMode('indo_only')}
              >
                Hanya Indonesia
              </button>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className="ka-trash-menu-btn"
        onClick={openTrash}
        aria-label="Lihat kosakata yang disembunyikan"
        title="Kosakata yang disembunyikan"
      >
        🚮
        {hiddenCount > 0 && <span className="ka-trash-count">{hiddenCount}</span>}
      </button>
      {canManage && (
        <>
          <button type="button" className="ka-sql-btn" onClick={openSqlImport}>
            Impor SQL
          </button>
          <button type="button" className="ka-add-btn" onClick={openAddForm}>
            + Tambah
          </button>
        </>
      )}
    </div>
  )
}
