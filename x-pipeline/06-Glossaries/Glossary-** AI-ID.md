# AI Glossary (Indonesian)

This file contains the living database of AI technical terms and frameworks in Indonesian.

---

## ** Open-Weight Model

**Apa itu?**
** Open-Weight Model adalah model AI di mana parameter hasil pelatihan (bobot) dirilis secara publik, sehingga siapa pun bisa unduh, host, kustomisasi, dan jalankan di server sendiri tanpa perlu bergantung ke penyedia API terpusat.

**Mengapa ini penting?**
Ia mendemokratisasi akses ke AI canggih, memberdayakan startup, peneliti, dan developer untuk menghindari biaya per-request mahal serta risiko privasi. Rilis open-weight besar seperti Kimi K3 bisa langsung menggeser kekuatan pasar karena membuktikan bahwa performa frontier tidak lagi memerlukan chip termutakhir eksklusif atau langganan API mahal.

**Bahasa Bayi**
Bayangkan restoran yang bagikan resep rahasianya gratis. Sekarang kamu bisa masak hidangan yang persis sama di rumah, ubah tingkat pedas, bahkan buka warung sendiri pakai resep itu—tanpa bayar restoran atau datang ke sana.

**Contoh / Studi Kasus**
Kimi K3 dari Moonshot AI: model open-weight 2,8 triliun parameter yang menyamai performa model frontier AS. Perilisan publiknya memicu aksi jual besar-besaran di saham semikonduktor karena investor sadar AI yang efisien dan tersedia gratis bisa memangkas kebutuhan hardware raksasa.

<!-- Date: 2026-07-19 -->

---

## ** Proprietary Model

**Apa itu?**
** Proprietary Model adalah sistem AI tertutup di mana arsitektur, data pelatihan, dan bobot model dirahasiakan penyedia. Akses cuma bisa lewat API atau langganan terkontrol, tanpa bisa intip atau modifikasi model di baliknya.

**Mengapa ini penting?**
Ia lindungi kekayaan intelektual penyedia dan menciptakan sumber pendapatan berulang, tapi mengunci pengguna dalam ekosistem tunggal dan bisa hambat kompetisi. Saat alternatif open-weight tangguh muncul, proprietary model berisiko kehilangan kekuatan harga dan basis developer.

**Bahasa Bayi**
Bayangkan restoran yang hanya sajikan hidangan spesial di ruang makannya sendiri. Kamu cuma bisa makan di sana dengan harga yang mereka tentukan, dan resepnya tidak pernah diberikan—jadi kamu tidak bisa masak sendiri atau memperbaiki masakan itu.

**Contoh / Studi Kasus**
Model seperti GPT-5.6 biasanya proprietary. Developer bayar per token lewat API dan tidak bisa menjalankannya secara lokal. Kejutan Kimi K3 langsung menantang model bisnis ini, memaksa perusahaan mempertimbangkan ulang kebutuhan tetap terkunci di sistem mahal dan tertutup ketika alternatif open-weight sudah tersedia.

<!-- Date: 2026-07-19 -->

---

## Clinical-grade AI

**Apa itu?**
Clinical-grade AI adalah model kecerdasan buatan yang sudah lolos uji validasi ketat dan mendapat izin dari regulator seperti FDA untuk digunakan dalam diagnosis, perawatan, atau pengelolaan pasien. Ini bukan sekadar purwarupa atau demo; alat ini sudah sah secara hukum membantu keputusan medis karena memenuhi standar keamanan klinis.

**Mengapa ini penting?**
Tanpa validasi clinical-grade, alat AI apa pun hanya akan menjadi liabilitas di rumah sakit. Standar ini menentukan algoritma mana yang boleh masuk ke alur kerja radiologi, pencatatan klinis, atau rencana terapi. Ini adalah penjaga gerbang yang memisahkan mainan Silicon Valley dari alat yang bisa kita percayai untuk memeriksa paru-paru, darah, atau jantung kita.

**Bahasa Bayi**
Bayangkan kamu punya teman yang sangat pintar mendeteksi tulang retak di foto rontgen. Kamu tidak akan membiarkan teman itu menandatangani laporan medis sebelum guru sejati (FDA) mengujinya dan memberinya lisensi. Clinical-grade AI adalah teman yang sudah berlisensi itu—ia masih perlu diawasi dokter sungguhan, tapi sudah diizinkan ikut membantu.

**Contoh / Studi Kasus**
Sebuah AI yang menganalisis CT-scan untuk mendeteksi emboli paru harus melewati proses izin FDA 510(k) sebelum rumah sakit bisa memakainya. Setelah diizinkan, radiolog bisa mengandalkannya untuk menandai gumpalan potensial, tapi wajib mengonfirmasi ulang—ini mengubah alur kerja dari mencari menjadi memverifikasi.

<!-- Date: 2026-07-23 -->

---

## Human-in-the-loop (HITL)

**Apa itu?**
Human-in-the-loop (HITL) adalah kerangka tata kelola di mana AI memberikan rekomendasi atau prediksi, tapi seorang ahli manusia wajib meninjau dan menyetujui hasil itu sebelum tindakan akhir diambil. Ini adalah pos pemeriksaan wajib yang dirancang untuk menangkap kekeliruan, bias, atau kasus berbahaya yang tidak dilatihkan ke model.

**Mengapa ini penting?**
Model AI bisa gagal dalam cara yang tak terduga, terutama saat berhadapan dengan penyakit langka atau data dunia nyata yang berantakan. HITL inilah yang mencegah misdiagnosis otomatis sampai ke pasien. Kerangka ini juga memberi regulator dan asuransi jejak audit yang jelas: setiap keputusan otomatis sudah diverifikasi secara sadar oleh klinisi berlisensi.

**Bahasa Bayi**
Pikirkan mobil otonom yang tetap minta kamu memegang setir. Mobil bisa menyetir dan mengerem sendiri, tapi ketika bingung di persimpangan aneh, kamu siap mengambil alih. AI mengerjakan bagian berat, tapi kamu adalah bos terakhir yang memastikan semua aman.

**Contoh / Studi Kasus**
Ketika alat triase bertenaga AI di IGD menyarankan seorang pasien boleh pulang, perawat atau dokter wajib meninjau tanda vital dan alasan AI sebelum memulangkan. Kalau model melewatkan gejala kecil, manusia yang menangkapnya—loop ini menjaga rumah sakit terlindungi secara hukum dan pasien tetap hidup.

<!-- Date: 2026-07-23 -->
