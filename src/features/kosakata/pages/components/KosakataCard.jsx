import { MEDIA_ICON } from '../constants'

export default function KosakataCard({
  item,
  cardOverride,
  viewMode,
  numberById,
  markedIds,
  markingId,
  hidingId,
  canManage,
  deletingId,
  toggleCardOverride,
  toggleMark,
  toggleHide,
  openEditForm,
  handleDelete,
}) {
  // Mode tampilan efektif untuk kartu ini: override per-kartu
  // (kalau ada) menang atas mode global.
  const override = cardOverride[item.id]
  let effectiveMode = viewMode
  if (viewMode === 'all' && override) {
    effectiveMode = override // 'korean_only' | 'indo_only'
  } else if (viewMode !== 'all' && override === 'translation') {
    effectiveMode = 'all'
  }

  return (
    <li className="ka-card">
      <div className="ka-card-main">
        <span className="ka-card-number" aria-hidden="true">
          {numberById.get(item.id)}
        </span>
        {effectiveMode !== 'indo_only' && (
          <p className="ka-korean" lang="ko">{item.korean_text}</p>
        )}
        {effectiveMode === 'all' && item.english_text && (
          <p className="ka-english">{item.english_text}</p>
        )}
        {effectiveMode !== 'korean_only' && item.indonesian_text && (
          <p className="ka-indonesian">{item.indonesian_text}</p>
        )}
        {effectiveMode === 'all' && item.key_point && (
          <p className="ka-keypoint">★ {item.key_point}</p>
        )}

        {(item.image_url || item.audio_url || item.document_url) && (
          <div className="ka-media-badges">
            {item.image_url && (
              <a href={item.image_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                <span aria-hidden="true">{MEDIA_ICON.image_url}</span> Gambar
              </a>
            )}
            {item.audio_url && (
              <a href={item.audio_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                <span aria-hidden="true">{MEDIA_ICON.audio_url}</span> Audio
              </a>
            )}
            {item.document_url && (
              <a href={item.document_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                <span aria-hidden="true">{MEDIA_ICON.document_url}</span> Dokumen
              </a>
            )}
          </div>
        )}

        <div className="ka-card-toggles">
          {viewMode === 'all' ? (
            <>
              <button
                type="button"
                className={`ka-toggle-btn ${override === 'korean_only' ? 'active' : ''}`}
                onClick={() => toggleCardOverride(item.id, 'korean_only')}
              >
                🇰🇷
              </button>
              <button
                type="button"
                className={`ka-toggle-btn ${override === 'indo_only' ? 'active' : ''}`}
                onClick={() => toggleCardOverride(item.id, 'indo_only')}
              >
                🇮🇩
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`ka-toggle-btn ${override === 'translation' ? 'active' : ''}`}
              onClick={() => toggleCardOverride(item.id, 'translation')}
            >
              🌐
            </button>
          )}
        </div>
      </div>
      <div className="ka-card-side">
        <button
          type="button"
          className={`ka-mark-btn ${markedIds.has(item.id) ? 'active' : ''}`}
          onClick={() => toggleMark(item)}
          disabled={markingId === item.id}
          aria-pressed={markedIds.has(item.id)}
          aria-label={markedIds.has(item.id) ? 'Batalkan tanda hafalan' : 'Tandai untuk hafalan'}
          title={markedIds.has(item.id) ? 'Sudah ditandai — klik untuk batal' : 'Tandai kosakata ini'}
        >
          {markedIds.has(item.id) ? '★' : '☆'}
        </button>
        {canManage && (
          <div className="ka-card-actions">
            <button type="button" className="ka-edit-btn" onClick={() => openEditForm(item)}>
              Edit
            </button>
            <button
              type="button"
              className="ka-delete-btn"
              disabled={deletingId === item.id}
              onClick={() => handleDelete(item)}
            >
              {deletingId === item.id ? '…' : 'Hapus'}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className="ka-trash-btn"
        onClick={() => toggleHide(item)}
        disabled={hidingId === item.id}
        aria-label="Sembunyikan kosakata ini"
        title="Sembunyikan (tidak ikut dihitung hafalan)"
      >
        🗑️
      </button>
    </li>
  )
}
