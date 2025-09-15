
---

# 🌐 Aira – WhatsApp Bot

### 🤖 WhatsApp Bot Menggunakan **Baileys Multi-Device**

Aira adalah bot WhatsApp serbaguna yang berfungsi sebagai **asisten pribadi, teman interaktif, serta alat bantu akademik dan grup.**
Dibangun menggunakan [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) untuk dukungan multi-device yang andal.

---

## ✨ Fitur Utama

* **🔗 Kompatibilitas Multi-Device:** Berbasis `@whiskeysockets/baileys`, mendukung WhatsApp multi-device dengan stabil.
* **💾 Penyimpanan Data Permanen:** Menyimpan obrolan, kontak, dan pesan menggunakan penyimpanan berbasis file kustom.
* **📚 Manajemen Akademik & Grup:** Menyediakan info jadwal kelas, kalender akademik, daftar tugas, dan manajemen grup.
* **🎨 Media & Hiburan:** Kirim gambar/GIF acak dari folder lokal.
* **🛡️ Filter Kata Tidak Pantas (Badwall):** Deteksi kata kasar dan respons otomatis untuk menjaga suasana grup.
* **🎮 Game Interaktif – Evil Cultivator:** Game peran dengan fase siang/malam, voting, dan role unik yang dimainkan dalam grup.

---

## ⚙️ Prasyarat

Sebelum memulai, pastikan:

* [Node.js](https://nodejs.org/) **v14+**
* [Git](https://git-scm.com/)

---

## 🚀 Instalasi

1. **Clone repositori**

   ```sh
   git clone [repository_url]
   cd aira
   ```

2. **Instal dependensi**

   ```sh
   npm install
   ```

3. **Jalankan bot**

   ```sh
   npm start
   ```

   → Sebuah QR code akan muncul di terminal. Scan menggunakan WhatsApp Anda untuk menghubungkan bot.

---

## 📝 Penggunaan

Aira mendukung prefiks perintah: `aira`, `!`, `.`, `/`, `#`

### 🎮 Perintah Game – Evil Cultivator

**Grup Commands**

* `aira start game` → Memulai game baru
* `aira join game` → Bergabung ke game
* `aira begin game` → (Host) Memulai game
* `aira players` → Lihat daftar pemain
* `aira game status` → Lihat status game
* `aira accuse <nomor>` → Menuduh pemain (fase siang)
* `aira vote` → Memulai voting
* `aira vote <nomor>` → Memberikan suara
* `aira end game` → Mengakhiri game
* `aira game guide` → Panduan lengkap

**Chat Pribadi (Role Khusus)**

* `aira roles` → Lihat peran Anda
* `aira kill <nomor>` → (Shadow Cultivator / Sect Leader) Membunuh pemain
* `aira skip` → Melewati giliran membunuh
* `aira protect <nomor>` → (Divine Protector) Melindungi pemain
* `aira scry <nomor>` → (Fate Seeker) Lihat role pemain
* `aira revive <nomor>` → (Immortal Alchemist) Menghidupkan kembali pemain

---

### 🎓 Perintah Akademik & Umum

* `aira menu` → Lihat semua perintah
* `aira tag` / `aira panggil` → Mention semua anggota grup
* `aira grup` / `aira kelas` → Lihat daftar grup kelas
* `aira nilai` / `aira metrik` → Lihat metrik penilaian

**Kalender & Jadwal**

* `aira libur` / `aira cuti` → Jadwal libur nasional & cuti bersama
* `aira kalender` → Kalender akademik (opsi: `ganjil`, `genap`, `lalu`, `sekarang`)
* `aira roster` / `aira jadwal` → Jadwal kelas mingguan
* `aira kp` / `aira pengganti` → Jadwal kelas pengganti
* `aira uas` → Jadwal UAS
* `aira uts` → Jadwal UTS
* `aira jc` / `aira cicilan` → Jadwal pembayaran cicilan kuliah
* `aira ta` / `aira tugas akhir` → Info TA, biaya, & jadwal
* `aira tugas` / `aira besar` → Daftar tugas besar
* `aira matkul` → Info mata kuliah & kriteria penilaian

---

### 🖼️ Perintah Media

* `/gambar` → Kirim gambar acak dari `media/images`
* `/gif` → Kirim GIF acak dari `media/gifs`

---

## 🤝 Kontribusi

* **Penulis:** Jajang
* **Library:** [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys)

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah **MIT License**.

---