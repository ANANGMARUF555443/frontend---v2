// 19 "letak" (bagian/posisi) tetap yang selalu ada di tiap bab.
// Urutan array ini menentukan urutan tab di halaman Kosakata Admin.
// HARUS tetap sinkron dengan backend/constants.py (LETAK_CHOICES) --
// kalau ubah salah satu, ubah juga yang lain.
export const LETAK_LIST = [
  { key: 'judul', order: 1, label: 'Judul', desc: 'Halaman pembuka bab (rangkuman)' },
  { key: 'kosakata_1', order: 2, label: 'Kosakata 1' },
  { key: 'soal_kosakata_1', order: 3, label: 'Soal Kosakata 1' },
  { key: 'tata_bahasa_1', order: 4, label: 'Tata Bahasa 1' },
  { key: 'soal_tata_bahasa_1', order: 5, label: 'Soal Tata Bahasa 1' },
  { key: 'percakapan_1', order: 6, label: 'Percakapan 1' },
  { key: 'soal_percakapan_1', order: 7, label: 'Soal Percakapan 1' },
  { key: 'pelafalan', order: 8, label: 'Pelafalan' },
  { key: 'kosakata_2', order: 9, label: 'Kosakata 2' },
  { key: 'soal_kosakata_2', order: 10, label: 'Soal Kosakata 2' },
  { key: 'tata_bahasa_2', order: 11, label: 'Tata Bahasa 2' },
  { key: 'soal_tata_bahasa_2', order: 12, label: 'Soal Tata Bahasa 2' },
  { key: 'percakapan_2', order: 13, label: 'Percakapan 2' },
  { key: 'soal_percakapan_2', order: 14, label: 'Soal Percakapan 2' },
  { key: 'ungkapan_berguna', order: 15, label: 'Ungkapan Berguna' },
  { key: 'budaya', order: 16, label: 'Budaya' },
  { key: 'penilaian_diri', order: 17, label: 'Penilaian Diri' },
  { key: 'latihan_membaca', order: 18, label: 'Latihan Membaca' },
  { key: 'latihan_mendengarkan', order: 19, label: 'Latihan Mendengarkan' },
]

export const LETAK_LABELS = Object.fromEntries(LETAK_LIST.map((l) => [l.key, l.label]))

export const BAB_COUNT = 60
