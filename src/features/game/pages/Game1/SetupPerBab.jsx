import './SetupPerBab.css'

export default function SetupPerBab({ babDipilih, babCount, onBabChange }) {
  return (
    <section className="game1-block">
      <h2 className="game1-block-title">Pilih Bab</h2>
      <div className="game1-bab-nav">
        <button
          type="button"
          disabled={babDipilih <= 1}
          onClick={() => onBabChange(babDipilih - 1)}
        >
          &lsaquo;
        </button>
        <select
          value={babDipilih}
          onChange={(e) => onBabChange(Number(e.target.value))}
        >
          {Array.from({ length: babCount }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Bab {n} / {babCount}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={babDipilih >= babCount}
          onClick={() => onBabChange(babDipilih + 1)}
        >
          &rsaquo;
        </button>
      </div>
    </section>
  )
}