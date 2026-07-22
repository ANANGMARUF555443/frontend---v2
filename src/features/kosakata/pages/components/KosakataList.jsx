import KosakataCard from './KosakataCard'

export default function KosakataList({
  loading,
  filteredItems,
  search,
  currentItems,
  activeLetak,
  bab,
  ...cardProps
}) {
  if (loading) {
    return <p className="ka-status">Memuat…</p>
  }

  if (filteredItems.length === 0) {
    return (
      <p className="ka-empty">
        {search
          ? 'Tidak ada kosakata yang cocok dengan pencarian.'
          : currentItems.length > 0
            ? 'Semua kosakata di bagian ini disembunyikan. Buka 🚮 untuk menampilkannya lagi.'
            : `Belum ada kosakata di bagian "${activeLetak?.label}" untuk Bab ${bab}.`}
      </p>
    )
  }

  return (
    <ul className="ka-list">
      {filteredItems.map((item) => (
        <KosakataCard key={item.id} item={item} {...cardProps} />
      ))}
    </ul>
  )
}
