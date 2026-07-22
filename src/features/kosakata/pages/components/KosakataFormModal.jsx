import { BAB_COUNT, LETAK_LIST } from '../../../../shared/constants/letak'

export default function KosakataFormModal({
  formOpen,
  formMode,
  formData,
  formError,
  saving,
  closeForm,
  handleFormSubmit,
  handleFormField,
  openPicker,
}) {
  if (!formOpen) return null

  return (
    <div className="ka-modal-backdrop" onClick={closeForm}>
      <div className="ka-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{formMode === 'add' ? 'Tambah Kosakata' : 'Edit Kosakata'}</h2>
        <form onSubmit={handleFormSubmit} className="ka-form">
          <div className="ka-form-row-2">
            <label className="ka-field">
              <span>Bab</span>
              <select
                value={formData.bab}
                onChange={(e) => handleFormField('bab', e.target.value)}
              >
                {Array.from({ length: BAB_COUNT }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Bab {n}</option>
                ))}
              </select>
            </label>

            <label className="ka-field">
              <span>Letak</span>
              <select
                value={formData.letak}
                onChange={(e) => handleFormField('letak', e.target.value)}
              >
                {LETAK_LIST.map((l) => (
                  <option key={l.key} value={l.key}>{l.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="ka-field">
            <span>Teks Korea</span>
            <textarea
              required
              rows={2}
              value={formData.korean_text}
              onChange={(e) => handleFormField('korean_text', e.target.value)}
              placeholder="예: 안녕하세요"
            />
          </label>

          <label className="ka-field">
            <span>Terjemahan Inggris</span>
            <textarea
              rows={2}
              value={formData.english_text}
              onChange={(e) => handleFormField('english_text', e.target.value)}
              placeholder="mis. Hello"
            />
          </label>

          <label className="ka-field">
            <span>Terjemahan Indonesia</span>
            <textarea
              rows={2}
              value={formData.indonesian_text}
              onChange={(e) => handleFormField('indonesian_text', e.target.value)}
              placeholder="mis. Halo"
            />
          </label>

          <label className="ka-field">
            <span>Poin Penting</span>
            <textarea
              rows={2}
              value={formData.key_point}
              onChange={(e) => handleFormField('key_point', e.target.value)}
              placeholder="Catatan/penjelasan tambahan (opsional)"
            />
          </label>

          {(['image_url', 'audio_url', 'document_url']).map((field) => (
            <label className="ka-field" key={field}>
              <span>
                URL {field === 'image_url' ? 'Gambar' : field === 'audio_url' ? 'Audio' : 'Dokumen'}
              </span>
              <div className="ka-media-input-row">
                <input
                  type="text"
                  value={formData[field]}
                  onChange={(e) => handleFormField(field, e.target.value)}
                  placeholder="https://…"
                />
                <button type="button" className="ka-pick-btn" onClick={() => openPicker(field)}>
                  Pilih
                </button>
              </div>
            </label>
          ))}

          <label className="ka-field">
            <span>Urutan Tampil</span>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => handleFormField('order_index', e.target.value)}
            />
          </label>

          {formError && <p className="auth-error">{formError}</p>}

          <div className="ka-form-actions">
            <button type="button" className="ka-cancel-btn" onClick={closeForm}>
              Batal
            </button>
            <button type="submit" className="ka-save-btn" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
