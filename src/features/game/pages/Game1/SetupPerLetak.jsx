import SetupPerBab from './SetupPerBab'
import './SetupPerLetak.css'

export default function SetupPerLetak({
  babDipilih,
  babCount,
  onBabChange,
  letakChoices,
  maksLetak,
  letakDitandai,
  onToggleLetak,
}) {
  return (
    <>
      <SetupPerBab
        babDipilih={babDipilih}
        babCount={babCount}
        onBabChange={onBabChange}
      />

      <section className="game1-block">
        <h2 className="game1-block-title">
          Pilih letak ({letakDitandai.length}/{maksLetak})
        </h2>
        <div className="game1-chip-row">
          {letakChoices.map((l) => (
            <button
              key={l.key}
              type="button"
              className={`game1-chip ${
                letakDitandai.includes(l.key) ? 'is-active' : ''
              }`}
              onClick={() => onToggleLetak(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}