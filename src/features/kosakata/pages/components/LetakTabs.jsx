import { LETAK_LIST } from '../../../../shared/constants/letak'

export default function LetakTabs({ letak, grouped, hiddenIds, markedIds, changeLetak, activeLetak }) {
  return (
    <>
      <nav className="ka-tabs" aria-label="Bagian dalam bab">
        {LETAK_LIST.map((l) => (
          <button
            key={l.key}
            type="button"
            className={`ka-tab ${letak === l.key ? 'active' : ''}`}
            onClick={() => changeLetak(l.key)}
          >
            {l.label}
            {grouped[l.key]?.length ? (
              <span className="ka-tab-count">
                {(() => {
                  const visible = grouped[l.key].filter((it) => !hiddenIds.has(it.id))
                  return `${visible.filter((it) => markedIds.has(it.id)).length}/${visible.length}`
                })()}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {activeLetak?.desc && <p className="ka-tab-desc">{activeLetak.desc}</p>}
    </>
  )
}
