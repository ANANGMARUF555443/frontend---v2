export default function HafalanInfo({ hafalanLoading, hafalanStats, babHafalan, bab }) {
  if (hafalanLoading || !hafalanStats || !babHafalan) return null

  return (
    <div className="ka-hafalan-info">
      <div className="ka-hafalan-row">
        <div className="ka-hafalan-item">
          <span className="ka-hafalan-label">Ditandai (semua bab)</span>
          <span className="ka-hafalan-value">
            {hafalanStats.ditandai}/{hafalanStats.total}
          </span>
        </div>
        <div className="ka-hafalan-item">
          <span className="ka-hafalan-label">Bab {bab}</span>
          <span className="ka-hafalan-value">
            {babHafalan.ditandai}/{babHafalan.total}
          </span>
        </div>
      </div>
      <div className="ka-hafalan-bar" aria-hidden="true">
        <div
          className="ka-hafalan-bar-fill"
          style={{
            width: `${babHafalan.total ? Math.round((babHafalan.ditandai / babHafalan.total) * 100) : 0}%`,
          }}
        />
      </div>
    </div>
  )
}
