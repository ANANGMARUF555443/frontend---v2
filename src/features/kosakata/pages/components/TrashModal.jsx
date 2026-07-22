export default function TrashModal({
  trashOpen,
  closeTrash,
  activeLetak,
  bab,
  hiddenInCurrentLetak,
  hidingId,
  toggleHide,
}) {
  if (!trashOpen) return null

  return (
    <div className="ka-modal-backdrop" onClick={closeTrash}>
      <div className="ka-modal ka-trash-modal" onClick={(e) => e.stopPropagation()}>
        <h2>🚮 Disembunyikan — {activeLetak?.label} (Bab {bab})</h2>
        {hiddenInCurrentLetak.length === 0 ? (
          <p className="ka-empty">Belum ada kosakata yang disembunyikan di bagian ini.</p>
        ) : (
          <ul className="ka-trash-item-list">
            {hiddenInCurrentLetak.map((it) => (
              <li className="ka-trash-item" key={it.id}>
                <div className="ka-trash-item-text">
                  <span className="ka-trash-item-korean" lang="ko">{it.korean_text}</span>
                  {it.indonesian_text && (
                    <span className="ka-trash-item-indo">{it.indonesian_text}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="ka-unhide-btn"
                  onClick={() => toggleHide(it)}
                  disabled={hidingId === it.id}
                >
                  {hidingId === it.id ? '…' : 'Tampilkan'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="ka-form-actions">
          <button type="button" className="ka-cancel-btn" onClick={closeTrash}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
