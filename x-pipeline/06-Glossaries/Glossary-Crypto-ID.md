# Crypto Glossary (Indonesian)

This file contains the living database of Crypto technical terms and frameworks in Indonesian.

---

## Consensus Rules

**Apa itu?**
Consensus Rules adalah hukum-hukum dasar terprogram yang tidak bisa ditawar, yang harus diikuti semua node di jaringan blockchain untuk sepakat pada satu buku besar yang valid. Aturan ini tentukan apa yang membuat transaksi atau blok sah — seperti batas ukuran blok, verifikasi tanda tangan, dan suplai koin.

**Mengapa ini penting?**
Consensus rules adalah konstitusi sebuah blockchain. Mereka cegah otoritas pusat manipulasi buku besar dan pastikan semua peserta — dari node retail kecil sampai mining pool raksasa — beroperasi di bawah standar obyektif yang sama. Tanpa aturan ini, tidak ada uang terdesentralisasi, karena siapa pun bisa ciptakan koin palsu atau ubah sejarah. Mengubah aturan ini, bahkan lewat soft fork, adalah keputusan tata kelola yang sangat sensitif karena ia geser batas apa yang dianggap "valid" oleh jaringan.

**Bahasa Bayi**
Bayangkan permainan Monopoli. Semua sepakati buku aturan sebelum main: kamu dapat $200 saat lewat Mulai, masuk penjara di lemparan tertentu. Aturan itu adalah consensus rules. Kalau tiba-tiba ada yang mau ubah "penjara" jadi "dapat giliran ekstra" di tengah permainan, pemain lain akan tolak lanjut karena kamu langgar kesepakatan dasar. Untuk ubah aturan, semua harus setuju dulu. Consensus rules Bitcoin itu buku aturan tadi — dan hanya itu yang menjaga uang tetap nyata.

**Contoh / Studi Kasus**
Batas suplai 21 juta koin di Bitcoin adalah consensus rule. Setiap node periksa bahwa tidak ada blok yang ciptakan lebih dari subsidi yang diizinkan. Kalau seorang miner coba kasih dirinya sendiri 100 Bitcoin tambahan, semua full node otomatis tolak blok itu karena melanggar aturan suplai. Matematika ketat yang sudah disepakati inilah yang beri Bitcoin kelangkaan dan kepercayaan.

<!-- Date: 2026-07-19 -->

---

## Ecosystem Bootstrapping

**Apa itu?**
Ecosystem Bootstrapping adalah proses beri insentif kepada developer dan user untuk gabung ke jaringan blockchain baru lewat hibah, subsidi, atau dukungan akselerator demi capai critical mass.

**Mengapa ini penting?**
Saat jaringan baru rilis, ia pada dasarnya kosong melompong seperti kota mati. Protokol wajib keluar modal besar untuk tarik builder masuk ke ekosistemnya. Ia kasih uang gratis, bayar biaya audit keamanan, dan sedia likuiditas market-making agar startup bisa rilis produk mereka dengan mudah.

**Bahasa Bayi**
Bayangkan seperti buka mall baru. Pemilik mall kasih sewa gratis untuk brand besar selama tahun pertama hanya agar pengunjung biasa mulai datang.

**Contoh / Studi Kasus**
MegaETH danai 20 startup dan bayar biaya audit keamanan mereka untuk pancing aktivitas jaringannya.

---

## Liquidity Squeeze

**Apa itu?**
Liquidity Squeeze adalah kondisi pasar di mana suplai aset yang tersedia di bursa tiba-tiba mengering.

**Mengapa ini penting?**
Kondisi ini buat order book jadi tipis, sehingga order beli kecil saja bisa picu lonjakan harga gila-gilaan. Kita wajib pantau ini karena jika kita trading pakai leverage, volatilitas liar bisa dengan mudah hancurkan akun kita.

**Bahasa Bayi**
Bayangkan kamu pergi ke pasar untuk beli apel, tapi sebuah restoran besar baru saja borong 90% apel di sana. Penjual yang tersisa pasti langsung naikkan harga untuk sisa apel tersebut.

**Contoh / Studi Kasus**
Abraxas Capital tarik 45,996 ETH dari Binance, buat bursa kekurangan token untuk fasilitasi trading harian.

<!-- Date: 2026-07-17 -->

---

## Soft Fork

**Apa itu?**
Soft Fork adalah upgrade protokol blockchain yang bersifat backward-compatible, di mana node yang tidak upgrade tetap bisa memvalidasi blok dan transaksi baru, meski tidak bisa menggunakan fitur barunya.

**Mengapa ini penting?**
Soft fork adalah cara paling minim gangguan untuk perbarui blockchain. Jaringan bisa berevolusi tanpa paksa semua peserta upgrade seketika, mencegah perpecahan rantai. Namun, soft fork juga bisa sisipkan aturan konsensus baru yang batasi transaksi tertentu yang tadinya sah — persis seperti yang diusulkan BIP 110. Ini menjadikan soft fork bukan sekadar alat teknis, tapi juga alat tata kelola.

**Bahasa Bayi**
Bayangkan klub yang mewajibkan semua anak pakai baju merah. Semua tahu aturan itu. Lalu ketua klub bilang: mulai minggu depan, siapa pun yang pakai topi biru tidak boleh masuk. Anak-anak bertopi biru yang sudah di dalam boleh tetap main, tapi yang baru pakai topi biru ditolak. Anak-anak lama tetap paham aturan baju merah, tapi sekarang ada batasan tambahan. Itu soft fork: anggota lama tetap ikut permainan, tapi aturan baru diam-diam ubah apa yang diterima.

**Contoh / Studi Kasus**
SegWit (Segregated Witness) adalah soft fork yang diaktifkan di Bitcoin pada 2017. Upgrade ini mengubah struktur data transaksi sehingga lebih banyak transaksi bisa masuk per blok. Node yang tidak upgrade tetap bisa validasi blok, tapi tidak bisa verifikasi data 'witness' baru. Bitcoin pun lebih skalabel tanpa pecah rantai.

<!-- Date: 2026-07-19 -->

---

## Staking

**Apa itu?**
Staking adalah proses mengunci aset kripto di mekanisme proof-of-stake blockchain untuk bantu validasi transaksi, amankan jaringan, dan dapat imbalan.

**Mengapa ini penting?**
Staking ubah aset diam jadi mesin penghasil pasif income. Selain itu, staking tarik suplai aset dari bursa, sehingga likuiditas tipis dan harga bisa bergerak liar saat ada permintaan tiba-tiba.

**Bahasa Bayi**
Bayangkan kamu titipkan sepeda ke armada rental, lalu tiap hari kamu dapat uang sewa kecil. Sepeda itu tidak bisa kamu pakai, tapi kamu tetap dapat uang hanya karena punya sepeda.

**Contoh / Studi Kasus**
Bitmine nge-stake 85% dari 5.77 juta ETH miliknya, bikin suplai itu tidak bisa langsung dijual dan memperparah liquidity squeeze.

<!-- Date: 2026-07-21 -->

---

## Value Capture

**Apa itu?**
Value Capture adalah kemampuan protokol atau model bisnis untuk tahan sebagian nilai ekonomi yang dihasilkan oleh user atau aplikasinya.

**Mengapa ini penting?**
Tanpa ini, protokol jalan seperti yayasan amal. Ia bayar biaya pertumbuhan awal tapi tidak dapat apa-apa saat proyek tersebut sukses. Protokol wajib pasang mekanisme, seperti biaya transaksi, token burn, atau kepemilikan ekuitas, untuk jaga kas mereka sendiri.

**Bahasa Bayi**
Saat mall sudah penuh pengunjung, pemilik wajib mulai tarik uang sewa dan biaya parkir untuk cetak profit sungguhan.

**Contoh / Studi Kasus**
Karena MegaETH gagal tangkap nilai dari startup binaannya, ia ubah haluan untuk bangun aplikasi internalnya sendiri agar pendapatan tetap masuk ke kas.
