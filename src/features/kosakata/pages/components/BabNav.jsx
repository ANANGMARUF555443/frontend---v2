import { BAB_COUNT } from '../../../../shared/constants/letak'

export default function BabNav({ bab, setBab }) {
  return (
    <div className="ka-bab-nav">
      <button
        type="button"
        className="ka-bab-arrow"
        disabled={bab <= 1}
        onClick={() => setBab((b) => Math.max(1, b - 1))}
        aria-label="Bab sebelumnya"
      >
        &lsaquo;
      </button>
      <label className="ka-bab-select-wrap">
        <span className="ka-bab-select-label">BAB</span>
        <select
          className="ka-bab-select"
          value={bab}
          onChange={(e) => setBab(Number(e.target.value))}
        >
          {Array.from({ length: BAB_COUNT }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} / {BAB_COUNT}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="ka-bab-arrow"
        disabled={bab >= BAB_COUNT}
        onClick={() => setBab((b) => Math.min(BAB_COUNT, b + 1))}
        aria-label="Bab berikutnya"
      >
        &rsaquo;
      </button>
    </div>
  )
}
