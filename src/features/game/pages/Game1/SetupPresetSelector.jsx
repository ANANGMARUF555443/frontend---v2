import './SetupPresetSelector.css'

export default function SetupPresetSelector({
  presetList,
  presetTerpilih,
  onSelectPreset,
  onHapusPreset,
}) {
  if (!presetList || presetList.length === 0) return null

  return (
    <section className="game1-block">
      <h2 className="game1-block-title">Preset tersimpan</h2>
      <div className="game1-preset-list">
        <button
          type="button"
          className={`game1-preset-chip ${
            presetTerpilih === '' ? 'is-active' : ''
          }`}
          onClick={() => onSelectPreset('')}
        >
          Ad-hoc (tanpa preset)
        </button>
        {presetList.map((p) => (
          <div
            key={p.id}
            className={`game1-preset-chip-wrap ${
              presetTerpilih === String(p.id) ? 'is-active' : ''
            }`}
          >
            <button
              type="button"
              className="game1-preset-chip"
              onClick={() => onSelectPreset(String(p.id))}
            >
              {p.nama_setting || `Preset #${p.id}`}
            </button>
            <button
              type="button"
              className="game1-preset-remove"
              title="Hapus preset"
              onClick={() => onHapusPreset(p.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}