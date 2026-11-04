"""Label tampilan & pengelompokan field untuk frontend.
Field yang tidak ada di sini tetap berfungsi: labelnya dibuat dari nama kolom."""

LABELS = {
    "num_lag1": "Skor NUM tahun sebelumnya",
    # identitas & wilayah
    "jenis_sek": "Jenis sekolah",
    "sts_sek": "Status sekolah",
    "kurikulum__lag1": "Kurikulum",
    "daerah_khusus": "Daerah khusus",
    "kd_kokab": "Kabupaten/kota",
    "wilayah_bagian": "Wilayah bagian",
    "jenis_wilayah": "Jenis wilayah",
    "status_wilayah": "Status wilayah",
    # sumber daya sekolah
    "proporsi_pendidik_min_s1__lag1": "Proporsi pendidik minimal S1 (%)",
    "proporsi_pendidik_sertifikasi__lag1": "Proporsi pendidik tersertifikasi (%)",
    "jumlah_peserta_didik__lag1": "Jumlah peserta didik",
    "jumlah_pendidik__lag1": "Jumlah pendidik",
    "rasio_pendidik_peserta_didik__lag1": "Rasio pendidik : peserta didik",
    "jumlah_r_kelas__lag1": "Jumlah ruang kelas",
    "jumlah_komp_milik__lag1": "Jumlah komputer milik sekolah",
    "jumlah_perpus__lag1": "Jumlah perpustakaan",
    "jumlah_rombel__lag1": "Jumlah rombongan belajar",
    "jumlah_siswa_rombel__lag1": "Jumlah siswa dalam rombel",
    "jumlah_siswa_penerima_pip__lag1": "Jumlah siswa penerima PIP",
    "rasio_siswa_penerima_pip__lag1": "Rasio siswa penerima PIP",
    "ketersediaan_internet__lag1": "Ketersediaan internet",
    "ketersediaan_listrik__lag1": "Ketersediaan listrik",
    "ses_siswa__lag1": "Status sosial-ekonomi siswa (SES)",
}

_IDENTITAS = {"jenis_sek", "sts_sek", "kurikulum__lag1", "daerah_khusus", "kd_kokab",
              "wilayah_bagian", "jenis_wilayah", "status_wilayah"}
_SUMBER_DAYA = {
    "proporsi_pendidik_min_s1__lag1", "proporsi_pendidik_sertifikasi__lag1", "jumlah_peserta_didik__lag1",
    "jumlah_pendidik__lag1", "rasio_pendidik_peserta_didik__lag1", "jumlah_r_kelas__lag1",
    "jumlah_komp_milik__lag1", "jumlah_perpus__lag1", "jumlah_rombel__lag1", "jumlah_siswa_rombel__lag1",
    "jumlah_siswa_penerima_pip__lag1", "rasio_siswa_penerima_pip__lag1",
    "ketersediaan_internet__lag1", "ketersediaan_listrik__lag1",
}


def label_for(name: str) -> str:
    if name in LABELS:
        return LABELS[name]
    base = name.replace("__lag1", "")
    if base.startswith("bg"):
        return f"Survei latar belakang siswa: {base}"
    return f"Indeks survei: {base}"          # kode indikator (ach, eqc, tor, ...)


def group_for(name: str) -> str:
    if name == "num_lag1":
        return "Skor tahun sebelumnya"
    if name in _IDENTITAS:
        return "Identitas & wilayah"
    if name in _SUMBER_DAYA:
        return "Sumber daya sekolah"
    if name.startswith("bg"):
        return "Latar belakang siswa (survei)"
    return "Iklim sekolah & indikator survei"
