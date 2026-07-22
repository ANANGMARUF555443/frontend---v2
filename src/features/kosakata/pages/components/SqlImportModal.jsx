export default function SqlImportModal({
  sqlOpen,
  closeSqlImport,
  handleSqlImportSubmit,
  sqlText,
  setSqlText,
  sqlSaving,
  sqlError,
  sqlResultCount,
  bab,
  activeLetak,
}) {
  if (!sqlOpen) return null

  return (
    <div className="ka-modal-backdrop" onClick={closeSqlImport}>
      <div className="ka-modal ka-sql-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Impor Kosakata via SQL</h2>
        <p className="ka-sql-help">
          Tempel daftar <code>(korean_text, english_text, indonesian_text, key_point)</code>{' '}
          di bawah ini untuk menambah banyak kosakata sekaligus -- satu baris per tuple,
          urutannya <strong>teks Korea, terjemahan Inggris, terjemahan Indonesia, keterangan</strong>.
          Kolom <strong>bab</strong> &amp; <strong>letak</strong> otomatis diisi{' '}
          <strong>Bab {bab}</strong> &amp; <strong>{activeLetak?.label}</strong> (bagian yang
          sedang dibuka), dan <strong>urutan tampil</strong> otomatis melanjutkan dari
          kosakata yang sudah ada di bagian ini. Kalau keterangan kosong, tulis{' '}
          <code>NULL</code>.
        </p>

        <form onSubmit={handleSqlImportSubmit} className="ka-form">
          <textarea
            className="ka-sql-textarea"
            rows={10}
            spellCheck={false}
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder={
              `('안녕하세요', 'Hello', 'Halo', NULL),\n` +
              `('감사합니다', 'Thank you', 'Terima kasih', NULL);`
            }
          />

          <p className="ka-sql-target-info">
            Akan disimpan ke <strong>Bab {bab}</strong> · <strong>{activeLetak?.label}</strong>
          </p>

          {sqlError && <p className="auth-error">{sqlError}</p>}
          {sqlResultCount !== null && (
            <p className="ka-sql-success">
              ✓ Berhasil menambah {sqlResultCount} kosakata.
            </p>
          )}

          <div className="ka-form-actions">
            <button type="button" className="ka-cancel-btn" onClick={closeSqlImport}>
              Tutup
            </button>
            <button type="submit" className="ka-save-btn" disabled={sqlSaving}>
              {sqlSaving ? 'Mengimpor…' : 'Impor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
