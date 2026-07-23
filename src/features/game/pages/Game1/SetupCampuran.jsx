import './SetupCampuran.css'

export default function SetupCampuran({
  tandaiList,
  idKosakataDitandai,
  onToggleKosakata,
}) {
  return (
    <section className="game1-block">
      <h2 className="game1-block-title">
        Pilih kosakata tertandai ({idKosakataDitandai.length} dipilih)
      </h2>
      {tandaiList.length === 0 ? (
        <p className="game1-hint">
          Belum ada kosakata yang ditandai. Tandai dulu di halaman Kosakata.
        </p>
      ) : (
        <div className="game1-kosakata-pick-list">
          {tandaiList.map(
            (t) =>
              t.kosakata && (
                <button
                  key={t.kosakata.id}
                  type="button"
                  className={`game1-kosakata-pick ${
                    idKosakataDitandai.includes(t.kosakata.id) ? 'is-active' : ''
                  }`}
                  onClick={() => onToggleKosakata(t.kosakata.id)}
                >
                  <span className="game1-kosakata-pick-ko">
                    {t.kosakata.korean_text}
                  </span>
                  <span className="game1-kosakata-pick-id">
                    {t.kosakata.indonesian_text}
                  </span>
                  <span className="game1-kosakata-pick-meta">
                    Bab {t.kosakata.bab}
                  </span>
                </button>
              )
          )}
        </div>
      )}
    </section>
  )
}