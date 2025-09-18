const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const sharp = require("sharp");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const { checkAndRespond } = require('./badwall'); // Sesuaikan path jika perlu
const evilCultivator = require('./games/evil-cultivator');
module.exports = function(customStore) {
    const aira = async (client, m, chatUpdate) => {
  try {
        // --- Definisi Body yang Aman dari Pesan (Digunakan) ---
    // Menangani berbagai jenis pesan: teks, teks extend, gambar/video dengan caption, dll.
    // Memastikan hasil akhir selalu berupa string.
    var budy = (typeof m.text === "string" ? m.text : "") || // Gunakan m.text jika sudah string
               (m.message?.conversation) || // Teks biasa
               (m.message?.extendedTextMessage?.text) || // Teks yang diteruskan/dibalas
               (m.message?.imageMessage?.caption) || // Caption gambar
               (m.message?.videoMessage?.caption) || // Caption video
               (m.message?.documentMessage?.caption) || // Caption dokumen (opsional)
               ""; // Fallback ke string kosong

    // Normalisasi ke variabel `body` yang dijamin string dan di-trim.
    // Gunakan `body` ini untuk semua operasi string selanjutnya.
    const body = (typeof budy === "string" ? budy : "").trim(); // <-- Variabel `body` YANG DIGUNAKAN

    // --- Penanganan Pesan Khusus ---
    if (m.mtype === "viewOnceMessageV2") {
        // console.log("Pesan ViewOnce diterima, dilewati."); // Opsional: log
        return; // Abaikan pesan view-once untuk sementara
    }
    // --- Akhir Penanganan Pesan Khusus ---

    // --- Definisi Argumen Perintah ---
    // Sekarang aman menggunakan `body` karena dijamin string.
    const prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : '!';
    const isCmd2 = body.startsWith(prefix);
    const command = isCmd2 ? body.slice(prefix.length).trim().toLowerCase() : null;
    const args = body.trim().split(/ +/).slice(1);
    // --- Akhir Definisi Body dan Argumen ---

    // ... sisa kode aira.js ...
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const itsMe = m.sender == botNumber ? true : false;
    let text = (q = args.join(" "));
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

    const from = m.chat;
    const reply = m.reply;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    // Group
    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => {}) : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";
      const lowerBody = body.toLowerCase();

    // Push Message To Console
    let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;
const logMessage = `${chalk.black(chalk.bgWhite("[ LOGS ]"))} ${color(argsLog, "turquoise")} ${chalk.magenta("From")} ${chalk.green(pushname)} ${chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`)} ${chalk.blueBright("IN")} ${chalk.green(groupName)}\n${chalk.blueBright("Command:")} ${chalk.white(command)}`;


    if (isCmd2 && !m.isGroup) {
      console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
    } else if (isCmd2 && m.isGroup) {
      console.log(
        chalk.black(chalk.bgWhite("[ LOGS ]")),
        color(argsLog, "turquoise"),
        chalk.magenta("From"),
        chalk.green(pushname),
        chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`),
        chalk.blueBright("IN"),
        chalk.green(groupName)
      );
}
// === Evil Cultivator Game Commands ===

// --- PERUBAHAN: Tambahkan listener untuk event dari evilCultivator ---
// Tambahkan listener ini sekali saja saat fungsi aira dijalankan
// Kita gunakan flag global untuk memastikan hanya satu listener yang ditambahkan
if (!global.evilCultivatorListenersAdded) {
    console.log("[AIRA] Adding event listeners for evilCultivator...");

    // Listener untuk timeout malam (mengirim pesan transisi ke siang)
    evilCultivator.on('nightTimeout', async (data) => {
        const { groupId, message } = data;
        console.log(`[AIRA] Received 'nightTimeout' event for group ${groupId}. Sending message...`);
        try {
            if (client && typeof client.sendMessage === 'function') {
                await client.sendMessage(groupId, { text: message }, { quoted: m }); // Gunakan 'm' dari scope luar jika tersedia, atau buat objek quoted dummy
                console.log(`[AIRA] Successfully sent night timeout message to group ${groupId}.`);
            } else {
                console.error(`[AIRA ERROR] Client is not available or sendMessage function is missing. Cannot send night timeout message to ${groupId}.`);
            }
        } catch (error) {
            console.error(`[AIRA ERROR] Failed to send night timeout message to group ${groupId}:`, error);
        }
    });

    // Listener untuk timeout siang yang menyebabkan transisi langsung ke malam
    evilCultivator.on('dayPhaseTimeout', async (data) => {
        const { groupId, message } = data;
        console.log(`[AIRA] Received 'dayPhaseTimeout' event for group ${groupId}. Sending message...`);
        try {
            if (client && typeof client.sendMessage === 'function') {
                await client.sendMessage(groupId, { text: message }, { quoted: m });
                console.log(`[AIRA] Successfully sent day phase timeout message to group ${groupId}.`);
            } else {
                console.error(`[AIRA ERROR] Client is not available or sendMessage function is missing. Cannot send day phase timeout message to ${groupId}.`);
            }
        } catch (error) {
            console.error(`[AIRA ERROR] Failed to send day phase timeout message to group ${groupId}:`, error);
        }
    });

    // Listener untuk timeout siang yang memicu voting otomatis
    evilCultivator.on('dayTimeoutTriggerVoting', async (data) => {
        const { groupId, game } = data;
        console.log(`[AIRA] Received 'dayTimeoutTriggerVoting' event for group ${groupId}. Triggering automatic voting...`);
        try {
            // Panggil fungsi startVoting untuk mendapatkan pesan voting
            const votingResult = evilCultivator.startVoting(groupId);
            if (votingResult.success) {
                // Kirim pesan voting ke grup
                if (client && typeof client.sendMessage === 'function') {
                    await client.sendMessage(groupId, { text: votingResult.message }, { quoted: m });
                    console.log(`[AIRA] Successfully sent automatic voting message to group ${groupId}.`);
                } else {
                    console.error(`[AIRA ERROR] Client is not available. Cannot send automatic voting message to ${groupId}.`);
                }
            } else {
                // Jika gagal memulai voting, kirim pesan error
                console.error(`[AIRA ERROR] Failed to start automatic voting for group ${groupId}: ${votingResult.message}`);
                if (client && typeof client.sendMessage === 'function') {
                    await client.sendMessage(groupId, { text: `⏰ *Waktu diskusi siang telah habis!*\nTerjadi kesalahan saat memulai voting otomatis: ${votingResult.message}` }, { quoted: m });
                }
            }
        } catch (error) {
            console.error(`[AIRA ERROR] Failed to process 'dayTimeoutTriggerVoting' for group ${groupId}:`, error);
            // Kirim pesan error umum ke grup
            if (client && typeof client.sendMessage === 'function') {
                await client.sendMessage(groupId, { text: `⏰ *Waktu diskusi siang telah habis!*\nTerjadi kesalahan yang tidak terduga saat memulai voting otomatis.` }, { quoted: m });
            }
        }
    });

    global.evilCultivatorListenersAdded = true;
    console.log("[AIRA] Event listeners for evilCultivator added.");
}
// 
// --- Cek Badword terlebih dahulu ---
// Cek apakah pesan mengandung "aira" + badword dan butuh respons
const badwordResponse = checkAndRespond(body, pushname);
if (badwordResponse) {
    console.log(chalk.redBright(`[BADWALL]`), `${color(`Pesan dari ${pushname} (${m.sender.split('@')[0]}) mengandung badword:`, 'red')} ${chalk.yellow(body)}`);
    await m.reply(badwordResponse);
    return; // Hentikan pemrosesan lebih lanjut jika badword ditemukan
}

if (body.toLowerCase().includes('aira') && (/\btag\b/.test(lowerBody)||lowerBody.includes('anggil'))) {console.log(logMessage);
    const groupMetadata = await client.groupMetadata(m.chat);
    const participants = groupMetadata.participants; 
    const excludedNumbers = [
        "", 
        "" 
    ];
    const mentions = participants
        .filter(participant => !excludedNumbers.includes(participant.id.replace('@s.whatsapp.net', ''))) 
        .map(participant => participant.id);
    const message = `wahai @${mentions.map(id => id.split('@')[0]).join(' @')}, kalian dipanggil oleh petinggi grup!`;
    await client.sendMessage(m.chat, { text: message, mentions: mentions });
}
// --- Command Handler untuk Jadwal ---
// panduan command jadwal
if (body.toLowerCase() === 'aira update jadwal') {
    console.log(logMessage);
    return reply(`📢 *Panduan Update Jadwal*\n\nGunakan format ini untuk memperbarui jadwal:\n\n*aira update jadwal <nama_kelas> <nomor_minggu>\n<jadwal_lengkap>*\n\nContoh:\n*aira update jadwal AK-b 5\nSenin, 08.00-10.00 Akuntansi online\nSelasa, 13.00-15.00 Statistika offline*\n\n---\n\n📄 *TEMPLATE JADWAL*\n(Salin, tempel, dan isi)\n\n*aira update jadwal [NAMA KELAS] [NOMOR MINGGU]\n\n========== [SENIN] ==========\n📖 [NAMA MATA KULIAH]\n🕒 [WAKTU]\n📝 [LOKASI]\n\n========== [SELASA] ==========\n📖 [NAMA MATA KULIAH]\n🕒 [WAKTU]\n📝 [LOKASI]*`);
}
if (body.toLowerCase() === 'aira jadwal' || body.toLowerCase() === 'aira roster') {
    console.log(logMessage);
        return reply(`📢 *Panduan Lihat Jadwal*\n\nUntuk melihat jadwal:\n\n*aira jadwal <nama_kelas> [nomor_minggu]*\n\nContoh: *aira jadwal ak-b* (untuk lihat seluruh jadwal) atau *aira jadwal AK-B 5* (untuk lihat jadwal Minggu 5)`); }
if (body.toLowerCase() === 'aira delete jadwal') {
    console.log(logMessage);
        return reply(`📢 *Panduan Delete Jadwal*\n\nUntuk menghapus jadwal:\n\n*aira delete jadwal <nama_kelas> [nomor_minggu]*\n\n* Jika Anda ingin menghapus seluruh jadwal satu kelas, jangan sertakan nomor_minggu.`); }
      
// Command: aira update jadwal <nama_kelas> <nomor_minggu>
// Contoh: aira update jadwal AK-B 5 [jadwal_lengkap]
if (body.toLowerCase().startsWith('aira update jadwal ')) {
    console.log(logMessage);
    // Ambil bagian teks setelah command, tanpa mengubah case-nya
    const text = body.slice('aira update jadwal'.length).trim();
    
    // Periksa jika tidak ada argumen setelah command
    if (!text) {
        return reply(`📢 *Panduan Update Jadwal*\n\nGunakan format ini untuk memperbarui jadwal:\n\n*aira update jadwal <nama_kelas> <nomor_minggu>\n<jadwal_lengkap>*\n\nContoh:\n*aira update jadwal AK-b 5\nSenin, 08.00-10.00 Akuntansi online\nSelasa, 13.00-15.00 Statistika offline*, ga harus single line, bisa pakai template yang dibawah juga`);
    }

    // Pisahkan nama kelas dan nomor minggu dari jadwal lengkap
    const parts = text.split('\n');
    const firstLineParts = parts[0].split(/\s+/);

    if (firstLineParts.length < 2) {
        return reply('📝 Format salah. Gunakan: aira update jadwal <nama_kelas> <nomor_minggu>\nKemudian masukkan jadwal di baris berikutnya.');
    }

    // Ambil nama kelas dan nomor minggu, ubah ke lowercase untuk konsistensi
    const className = firstLineParts[0].toLowerCase();
    const weekNumber = firstLineParts[1].toLowerCase();
    
    // Ambil sisa baris sebagai jadwal, gabungkan kembali dengan '\n'
    const scheduleText = parts.slice(1).join('\n').trim();

    if (!scheduleText) {
        return reply('📝 Jadwal tidak boleh kosong. Mohon sertakan jadwal di bawah nama kelas dan nomor minggu.');
    }

    // Pastikan objek schedules ada di customStore
    if (!customStore.data.schedules) {
        customStore.data.schedules = {};
    }
    
    // Pastikan objek untuk kelas tersebut ada
    if (!customStore.data.schedules[className]) {
        customStore.data.schedules[className] = {};
    }

    // Simpan jadwal di dalam objek nested
    // scheduleText sekarang akan mempertahankan huruf kapital
    customStore.data.schedules[className][weekNumber] = scheduleText;
    customStore.writeToFile();

    return reply(`✅ Jadwal untuk *${className.toUpperCase()}* Minggu ke-*${weekNumber}* berhasil diperbarui.`);
}

// Command: aira jadwal <nama_kelas> [nomor_minggu]
// Contoh: aira jadwal ak-b 5 1
if (body.toLowerCase().startsWith('aira jadwal ') || body.toLowerCase().startsWith('aira roster ')) {
    const trimmedBody = body.toLowerCase().slice(body.toLowerCase().startsWith('aira jadwal') ? 'aira jadwal'.length : 'aira roster'.length).trim();
    
    // Ini sudah menjadi panduan
    if (!trimmedBody) {
        return reply(`📢 *Panduan Lihat Jadwal*\n\nUntuk melihat jadwal:\n\n*aira jadwal <nama_kelas> [nomor_minggu]*\n\nContoh: *aira jadwal ak-b 5* (untuk lihat seluruh jadwal) atau *aira jadwal ak-b 5 1* (untuk lihat jadwal Minggu 1)`);
    }
    
    console.log(logMessage);
    
    const parts = body.toLowerCase().trim().split(/\s+/);
    const className = parts.length > 2 ? parts[2] : null;
    const weekNumber = parts.length > 3 ? parts[3] : null;

    // Periksa apakah ada objek schedules sebelum mencoba mengaksesnya
    if (!customStore.data.schedules) {
        customStore.data.schedules = {};
    }

    if (!className) {
        const availableClasses = Object.keys(customStore.data.schedules).map(key => `* ${key}`).join('\n');
        let message = '📚 Jadwal apa yang kamu cari?\n\n';
        if (availableClasses) {
            message += `Silakan sebutkan salah satu kelas berikut:\n${availableClasses}\n\n`;
            message += 'Contoh: *aira jadwal ak-b 5* atau *aira jadwal ak-b 5*';
        } else {
            message += 'Maaf, belum ada jadwal yang tersimpan.';
        }
        return m.reply(message);
    }
    
    const storedSchedules = customStore.data.schedules[className];

    if (!storedSchedules) {
        return m.reply(`📁 Maaf, jadwal untuk kelas *${className}* tidak ditemukan. Pastikan nama kelas sudah benar.`);
    }

    if (weekNumber) {
        const weekSchedule = storedSchedules[weekNumber];
        if (weekSchedule) {
            return m.reply(`📢 JADWAL KULIAH *${className.toUpperCase()}* MINGGU KE-*${weekNumber}* 📢\n\n${weekSchedule}`);
        } else {
            return m.reply(`📁 Maaf, jadwal untuk kelas *${className}* minggu ke-*${weekNumber}* tidak ditemukan.`);
        }
    } else {
        // Jika tidak ada nomor minggu, tampilkan seluruh jadwal
        let fullSchedule = `📢 JADWAL LENGKAP KELAS *${className.toUpperCase()}* 📢\n\n`;
        const sortedWeeks = Object.keys(storedSchedules).sort((a, b) => parseInt(a) - parseInt(b));
        sortedWeeks.forEach(week => {
            fullSchedule += `========== [MINGGU ${week}] ==========\n`;
            fullSchedule += `${storedSchedules[week]}\n\n`;
        });
        return m.reply(fullSchedule);
    }
}

// Command: aira delete jadwal <nama_kelas> [nomor_minggu]
// Contoh: aira delete jadwal AK-B 5
if (body.toLowerCase().startsWith('aira delete jadwal ')) {
    const trimmedBody = body.slice('aira delete jadwal'.length).trim();

    // Periksa jika tidak ada argumen
    if (!trimmedBody) {
        return reply(`📢 *Panduan Delete Jadwal*\n\nUntuk menghapus jadwal:\n\n*aira delete jadwal <nama_kelas> [nomor_minggu]*\n\n* Jika Anda ingin menghapus seluruh jadwal satu kelas, jangan sertakan nomor_minggu.`);
    }

    const parts = trimmedBody.split(/\s+/);
    console.log(logMessage);

    const className = parts[0].toLowerCase();
    const weekNumber = parts.length > 1 ? parts[1].toLowerCase() : null;

    // Periksa apakah ada jadwal untuk kelas ini
    if (!customStore.data.schedules || !customStore.data.schedules[className]) {
        return reply(`📁 Maaf, jadwal untuk kelas *${className}* tidak ditemukan.`);
    }

    // Jika nomor minggu disertakan, hapus hanya minggu itu
    if (weekNumber) {
        if (customStore.data.schedules[className][weekNumber]) {
            delete customStore.data.schedules[className][weekNumber];
            // Jika tidak ada minggu lain, hapus juga objek kelasnya
            if (Object.keys(customStore.data.schedules[className]).length === 0) {
                delete customStore.data.schedules[className];
            }
            customStore.writeToFile();
            return reply(`✅ Jadwal untuk *${className.toUpperCase()}* Minggu ke-*${weekNumber}* berhasil dihapus.`);
        } else {
            return reply(`📁 Maaf, jadwal untuk kelas *${className}* minggu ke-*${weekNumber}* tidak ditemukan.`);
        }
    } else {
        // Jika tidak ada nomor minggu, hapus seluruh jadwal untuk kelas itu
        delete customStore.data.schedules[className];
        customStore.writeToFile();
        return reply(`✅ Seluruh jadwal untuk *${className.toUpperCase()}* berhasil dihapus.`);
    }
}
// TEMPLATE UNTUK GRUP/KELAS
if (body.toLowerCase().includes('aira') && lowerBody.includes('menu')) {
console.log(logMessage);
  return m.reply(`
++++++++++ [aira] ++++++++++
📌 Dibuat oleh jajang untuk Semua
prefix : aira
*(Menu Akademik)*
🔹 cmd: aira grup/kelas
📌 Untuk melihat daftar grup atau kelas.

🔹 cmd: aira tag/panggil/manggil
📌 Untuk memanggil semua orang yang ada di group.

🔹 cmd: aira nilai/metrik
📌 Untuk melihat matriks atau rentang nilai.

🔹 cmd: aira libur/cuti
📌 Untuk melihat jadwal hari libur dan cuti bersama.

🔹 cmd: aira kalender ganjil/sekarang
📌 Untuk melihat kalender akademik semester ganjil saat ini.

🔹 cmd: aira ta/tugas akhir
📌 Untuk melihat informasi seputar tugas akhir, biaya, dan jadwal.

🔹 cmd: aira kalender lalu
📌 Untuk melihat kalender akademik semester lalu.

🔹 cmd: aira kalender depan/genap
📌 Untuk melihat kalender akademik semester depan atau genap.

🔹 cmd: aira roster/jadwal [nama_kelas] [nomor_minggu]
📌 Untuk melihat jadwal perkuliahan mingguan.
   Contoh: aira jadwal AK-B 5 

🔹 cmd: aira update jadwal [nama_kelas] [nomor_minggu]
📌 Untuk memperbarui atau menambahkan jadwal kelas.
   Contoh: aira update jadwal AK-B 5 [jadwal_lengkap]

🔹 cmd: aira delete jadwal[nama_kelas] [nomor_minggu]
📌 Untuk menghapus jadwal kelas per minggu atau seluruhnya.
   Contoh: aira delete jadwal AK-B 5

🔹 cmd: aira tugas/besar
📌 Untuk melihat daftar tugas besar.

🔹 cmd: aira matkul/mata kuliah
📌 Untuk melihat detail informasi dan penilaian setiap mata kuliah.

🔹 cmd: aira kp/pengganti
📌 Untuk melihat jadwal kelas pengganti atau minggu tenang.

🔹 cmd: aira uas
📌 Untuk melihat jadwal ujian akhir semester (UAS).

🔹 cmd: aira jc/cicilan
📌 Untuk melihat jadwal pembayaran cicilan uang kuliah.

🔹 cmd: aira uts
📌 Untuk melihat jadwal ujian tengah semester (UTS).

*(Fitur Media)*
Prefix List :[\\ / ! # . ].
🔹 cmd: (prefix)gambar
📌 Untuk mengirim gambar acak dari folder media.
🔹 cmd: (prefix)gif
📌 Untuk mengirim gif acak dari folder media.
`);
}
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('grup')|| body.toLowerCase().includes('kelas'))) {
console.log(logMessage);
  return m.reply(`
📢 LIST GRUP/KELAS 📢

[JUDUL GRUP 1]
🔗 [LINK GRUP 1]

[JUDUL GRUP 2]
🔗 [LINK GRUP 2]

[JUDUL GRUP 3]
🔗 [LINK GRUP 3]
`);
}
// TEMPLATE UNTUK NILAI/METRIK
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('nilai')||body.toLowerCase().includes('metrik'))) {
console.log(logMessage);
  return m.reply(`
📢 Metrik Penilaian Umum 📢
A    ->   85 – 100
A-   ->   80 - 84
B+  ->   75 - 79
B    ->   70 - 74
B-   ->   65 - 69
C+  ->   60 - 64
C    ->   50 - 59
D    ->   40 - 49
E    ->    0   - 39`);
}
// TEMPLATE UNTUK HARI LIBUR
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('libur')||body.toLowerCase().includes('cuti'))) {
console.log(logMessage);
  return m.reply(`
📢 HARI LIBUR NASIONAL & CUTI BERSAMA 📢
🌟 [BULAN 1] 🌟
🗓︝ [TANGGAL] – [NAMA HARI LIBUR]

🌟 [BULAN 2] 🌟
🗓︝ [TANGGAL] – [NAMA HARI LIBUR]

💡 Jangan lupa tandai tanggalnya ya! 🗓︝✨
`);
}
// TEMPLATE UNTUK KALENDER GANJIL
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('kalender') && body.toLowerCase().includes('ganjil')||body.toLowerCase().includes('kalender') && body.toLowerCase().includes('sekarang'))) {
console.log(logMessage);
  return m.reply(`
📢 KALENDER AKADEMIK SEMESTER GANJIL 📢

🔖 [SEKSI 1]
[INFO 1]
[INFO 2]

📌 [SEKSI 2]
[INFO 1]
[INFO 2]

🎓 [SEKSI 3]
[INFO 1]
[INFO 2]
`);
}
// TEMPLATE UNTUK TUGAS AKHIR
if (lowerBody.includes('aira') && (/\bta\b/.test(lowerBody)||lowerBody.includes('tugas akhir'))) {
console.log(logMessage);
  return m.reply(`
📢 INFO TUGAS AKHIR 📢
Dosen Pembimbing di submit bersamaan dengan permohonan judul.

Biaya :
Biaya Skripsi : [JUMLAH BIAYA]
Biaya Wisuda : [JUMLAH BIAYA]

Jadwal :
[INFO JADWAL 1]
[INFO JADWAL 2]

INFO TAMBAHAN :
1. [CATATAN TAMBAHAN 1]
2. [CATATAN TAMBAHAN 2]
`);
}
// TEMPLATE UNTUK KALENDER LALU
if (body.toLowerCase().includes('aira') && body.toLowerCase().includes('kalender') && (/\blalu\b/.test(lowerBody))) {
console.log(logMessage);
  return m.reply(`
📢 KALENDER AKADEMIK SEMESTER LALU 📢

📌 [SEKSI 1]
[INFO 1]
[INFO 2]

📌 [SEKSI 2]
[INFO 1]
[INFO 2]
`);
}
// TEMPLATE UNTUK KALENDER DEPAN/GENAP
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('kalender') && (/\bdepan\b/.test(lowerBody))||body.toLowerCase().includes('kalender') && body.toLowerCase().includes('genap'))) {
console.log(logMessage);
  return m.reply(`
📢 KALENDER AKADEMIK SEMESTER DEPAN/GENAP 📢

🔖 [SEKSI 1]
[INFO 1]
[INFO 2]

📌 [SEKSI 2]
[INFO 1]
[INFO 2]

🎓 [SEKSI 3]
[INFO 1]
[INFO 2]
`);
}
// TEMPLATE UNTUK TUGAS BESAR
if (body.toLowerCase().includes('aira') && (body.toLowerCase().includes('tugas')||/\btb\b/.test(lowerBody))) {
console.log(logMessage);
  return m.reply(`
*(Tugas Besar [NAMA KELAS])*
- [DAFTAR TUGAS]
- [DEADLINE]`);
}
// TEMPLATE UNTUK MATA KULIAH
if (body.toLowerCase().includes('aira') && (/\bmatkul\b/.test(lowerBody)||lowerBody.includes('mata kuliah'))) {
console.log(logMessage);
  return m.reply(`
📢 [NAMA MATA KULIAH] 📢

📌 Kehadiran & Presensi
✅ [INFO PRESENSI]

📌 Penilaian
📝 UTS: [%]
📚 Tugas: [%]
📖 UAS: [%]
`);
}
// TEMPLATE UNTUK KELAS PENGGANTI
if (body.toLowerCase().includes('aira') && ((/\bkp\b/.test(lowerBody)||lowerBody.includes('pengganti'))||(/\bminggu\b/.test(lowerBody)||lowerBody.includes('tenang')))) {
console.log(logMessage);
  return m.reply(`
📢 JADWAL KELAS PENGGANTI & MINGGU TENANG 📢

📌 (Kelas Pengganti)
🗓 [TANGGAL] - [NAMA MATA KULIAH]

📌 (Minggu Tenang)
🗓 [TANGGAL] - [NAMA MATA KULIAH]
`);
}
// TEMPLATE UNTUK JADWAL UAS
if (body.toLowerCase().includes('aira') && (/\buas\b/.test(lowerBody)||lowerBody.includes('ujian akhir semester'))) {
console.log(logMessage);
  return m.reply(`
📢 JADWAL UAS - [NAMA KELAS] 📢
🆕 Last Update: [TANGGAL UPDATE]

======== [HARI, TANGGAL] ========
📖 [NAMA MATA KULIAH]
🝫 [LOKASI/METODE]
🕒 [WAKTU]
`);
}
// TEMPLATE UNTUK JADWAL CICILAN
if (body.toLowerCase().includes('aira') && (/\bjc\b/.test(lowerBody)||lowerBody.includes('cicilan')))  {
console.log(logMessage);
  return m.reply(`
📢 JADWAL CICILAN UANG KULIAH 📢
💰 Cicilan-1
🗓 [TANGGAL MULAI] – [TANGGAL AKHIR]
💰 Cicilan-2
🗓 [TANGGAL MULAI] – [TANGGAL AKHIR] 
`);
}
// TEMPLATE UNTUK JADWAL UTS
if (body.toLowerCase().includes('aira') && (/\buts\b/.test(lowerBody)||lowerBody.includes('ujian tengah semester'))) {
console.log(logMessage);
  return m.reply(`
*📢 JADWAL UTS - [NAMA KELAS] 📢*
🆕 Last Update: [TANGGAL UPDATE]

======== [HARI, TANGGAL] ========
📖 *[NAMA MATA KULIAH]*
💻 *[LOKASI/METODE]*
🕒 [WAKTU]
`);
}
if (body.toLowerCase().includes('aira') && (/\bpr\b/.test(lowerBody) || lowerBody.includes('petrikrandom'))) {
    console.log(logMessage);

    const imageDir = "./media/images/petrik"; // Ganti dengan folder gambar yang berisi jadwal UTS
    const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));

    if (files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = `${imageDir}/${randomFile}`;
        const captionText = `PELUKKKK`;
        await client.sendMedia(from, filePath, 'image', captionText, m);
    } else {
        return m.reply("📁 Maaf, tidak ada gambar patrik di folder media.");
    }
    return;
}
// aira.js
// aira.js

if (body.toLowerCase().includes('aira') && (/\bps\b/.test(lowerBody) || lowerBody.includes('petrikspesifik'))) {
    console.log(logMessage);
    
    // Ganti 'path/to/your/image.jpg' dengan jalur file gambar Anda
    const imagePath = './media/images/petrik/petrik.jpg'; 
    const captionText = `petrik untukmu`;

    await client.sendMedia(from, imagePath, 'image', captionText, m);
    return;
}
if (body.toLowerCase().includes('aira') && (/\bhr\b/.test(lowerBody) || lowerBody.includes('hugrandom'))) {
    console.log(logMessage);

    const gifDir = "./media/gifs"; // Pastikan folder ini sudah ada dan berisi file .gif
    const files = fs.readdirSync(gifDir).filter(f => f.endsWith('.gif'));

    if (files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = `${gifDir}/${randomFile}`;
        const captionText = 'Aira mengirimkan pelukan hangat untukmu! 🤗';
        
        // Gunakan 'video' sebagai tipe media dan tambahkan gifPlayback: true
        await client.sendMedia(from, filePath, 'video', captionText, m, { gifPlayback: true });
    } else {
        return m.reply("📁 Maaf, tidak ada GIF di folder media.");
    }
    return;
}
// aira.js
  

if (body.toLowerCase().includes('aira') && (/\bhs\b/.test(lowerBody) || lowerBody.includes('huspesifik'))) {
    console.log(logMessage);
    
    // Ganti 'path/to/your/gif.gif' dengan jalur file GIF Anda
    const gifPath = './media/gifs/hug.gif'; 
    const captionText = 'Aira mengirimkan pelukan hangat untukmu! 🤗';

    // Gunakan 'video' sebagai tipe media dan tambahkan gifPlayback: true
    await client.sendMedia(from, gifPath, 'video', captionText, m, { gifPlayback: true });
    return;
}
// Command: aira start game
if (body.toLowerCase().startsWith('aira start game')) {
    console.log(logMessage);
    const result = evilCultivator.createGame(from, pushname, sender);
    return reply(result.message);
}

// Command: aira join game
if (body.toLowerCase().startsWith('aira join game')) {
    console.log(logMessage);
    const result = evilCultivator.joinGame(from, pushname, sender);
    return reply(result.message);
}

// Command: aira begin game
if (body.toLowerCase().startsWith('aira begin game')) {
    console.log(logMessage);
    const result = evilCultivator.startBattle(from, sender, client);
    return reply(result.message);
}

// Command: aira players
if (body.toLowerCase() === 'aira players') {
    console.log(logMessage);
    const result = evilCultivator.getPlayerListCommand(from);
    return reply(result.message);
}

// Command: aira accuse <nomor>
if (body.toLowerCase().startsWith('aira accuse ')) {
    console.log(logMessage);
    const target = body.slice(12).trim();
    const result = evilCultivator.accusePlayer(from, sender, target);
    return reply(result.message);
}

// Command: aira vote
if (body.toLowerCase() === 'aira vote') {
    console.log(logMessage);
    const result = evilCultivator.startVoting(from);
    return reply(result.message);
}

// Command: aira vote <nomor>
if (body.toLowerCase().startsWith('aira vote ')) {
    console.log(logMessage);
    const target = body.slice(10).trim();
    const result = evilCultivator.votePlayer(from, sender, target);
    
    await reply(result.message);

    if (result.success) {
        console.log(`[DEBUG] Vote recorded for ${sender} (${pushname}) targeting ${target} in group ${from}`);

        const game = evilCultivator.games.get(from);

        if (game && game.phase === 'voting') {
            console.log("[DEBUG] Game found and is in voting phase.");

            const alivePlayers = evilCultivator.getAlivePlayers(game);
            const voters = Array.from(game.votes.keys());
            
            console.log("[DEBUG] Alive players IDs:", alivePlayers.map(p => p.id));
            console.log("[DEBUG] Voters IDs:", voters);
            
            const allVoted = alivePlayers.every(player => voters.includes(player.id));
            
            console.log(`[DEBUG] Checking if all alive players have voted: ${allVoted}`);

            if (allVoted) {
                console.log("[DEBUG] All alive players have voted. Calling getVotingResults...");
                
                const votingResult = evilCultivator.getVotingResults(from);
                console.log("[DEBUG] Voting result object received:", votingResult);
                
                if (votingResult.success) {
                    // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
                    await client.sendMessage(from, { text: votingResult.message }, { quoted: m });
                    
                    if (votingResult.gameOver) {
                        console.log("[DEBUG] Game ended via voting result.");
                    }
                } else {
                    console.error("[ERROR] Failed to get voting results:", votingResult.message);
                    // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
                    await client.sendMessage(from, { text: `[ERROR] Gagal mendapatkan hasil voting: ${votingResult.message}` }, { quoted: m });
                }
            } else {
                console.log("[DEBUG] Not all players have voted yet.");
            }
        } else {
            console.log("[DEBUG] Game not found or not in voting phase anymore after vote.");
        }
    }
    return;
}

// Command: aira game status
if (body.toLowerCase() === 'aira game status') {
    console.log(logMessage);
    
    // --- PERBAIKAN: Cek dan kirim pesan timeout ---
    // Panggil getGameStatus
    const result = evilCultivator.getGameStatus(from);
    
    if (result.success) {
        // Secara default, kirim pesan yang diterima
        let messageToSend = result.message;
        
        // Kirim pesan ke grup
        await client.sendMessage(from, { text: messageToSend }, { quoted: m });
        
    } else {
        // Jika gagal, kirim pesan error
        await reply(result.message);
    }
    return; // Penting: akhiri handler setelah memproses
    // --- AKHIR PERBAIKAN ---
}

// Command: aira end game
if (body.toLowerCase() === 'aira end game') {
    console.log(logMessage);
    const result = evilCultivator.endGame(from);
    return reply(result.message);
}

// Command: aira roles (untuk private chat)
if (body.toLowerCase() === 'aira roles' && !m.isGroup) {
    console.log(logMessage);
    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname); 
    const { game: foundGame, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame || !playerInGame.role) {
        console.log(`[DEBUG] 'aira roles' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}, Has role: ${!!(playerInGame && playerInGame.role)}`);
        return reply('🎭 Role kamu belum ditentukan. Tunggu host memulai pertarungan atau pastikan kamu sudah bergabung!');
    }

    const roleInfo = evilCultivator.roles[playerInGame.role];
    let roleMessage = `🎭 *Role Kamu:*\n`;
    roleMessage += `${roleInfo.emoji} ${roleInfo.name}\n`;
    roleMessage += `📝 ${roleInfo.description}\n`;
    roleMessage += `⚡ ${roleInfo.ability}\n`;

    if (roleInfo.team === 'evil') {
        const evilPlayers = evilCultivator.getAlivePlayers(foundGame).filter(p => evilCultivator.roles[p.role].team === 'evil');
        if (evilPlayers.length > 1) {
            const evilPlayerNames = evilPlayers.map(p => p.name).join(', ');
            roleMessage += `\n🩸 *Rekan Setim:*\n${evilPlayerNames}\n`;
        }
    }

    roleMessage += `\n🤫 JANGAN BERITAHU SIAPAPUN ROLE INI!`;
    return reply(roleMessage);
}

// Jika ada yang ketik 'aira roles' di grup, beri petunjuk
if (body.toLowerCase() === 'aira roles' && m.isGroup) {
    console.log(logMessage);
    return reply(`👤 Gunakan command *aira roles* di private chat dengan aku untuk melihat role kamu!`);
}

// === Evil Cultivator Special Role Commands (Private Chat Only) ===

// Command: aira kill <nomor> - hanya untuk private chat
if (body.toLowerCase().startsWith('aira kill ') && !m.isGroup) {
    console.log(logMessage);

    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname); 
    const { game: foundGame, groupId: foundGroupId, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame) {
        console.log(`[DEBUG] 'aira kill' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}`);
        return reply('⚔️ Kamu tidak tergabung dalam pertarungan yang sedang berlangsung!');
    }

    const args = body.slice(10).trim().split(/\s+/);
    const result = evilCultivator.killPlayer(foundGroupId, playerInGame.id, args);

    await reply(result.message || (result.success ? '✅ Aksi berhasil dilakukan!' : '❌ Aksi gagal.'));

    if (result.success && foundGroupId) {
        if (result.gameOver) {
            if (result.message) {
                // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
                await client.sendMessage(foundGroupId, { text: result.message }, { quoted: m });
            }
            console.log("[EVIL CULTIVATOR] Game ended via kill action.");
        } 
        else if (result.message) {
             // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
             await client.sendMessage(foundGroupId, { text: result.message }, { quoted: m });
        }
    }

    return;
}
// Command: aira skip - hanya untuk private chat (Versi Diperbaiki)
if (body.toLowerCase() === 'aira skip' && !m.isGroup) {
    console.log(logMessage);

    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname);
    const { game: foundGame, groupId: foundGroupId, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame) {
        console.log(`[DEBUG] 'aira skip' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}`);
        return reply('⚔️ Kamu tidak tergabung dalam pertarungan yang sedang berlangsung!');
    }

    const result = evilCultivator.skipKill(foundGroupId, playerInGame.id);

    // Balas ke private chat pemain
    await reply(result.message || (result.success ? '✅ Aksi berhasil dilewati!' : '❌ Aksi gagal dilewati.'));

    // Jika berhasil dan ada pesan grup, kirim ke grup
    if (result.success && foundGroupId && result.groupMessage) {
        // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
        await client.sendMessage(foundGroupId, { text: result.groupMessage }, { quoted: m });
    }

    return;
}
// Command: aira protect <nomor> - hanya untuk private chat
if (body.toLowerCase().startsWith('aira protect ') && !m.isGroup) {
    console.log(logMessage);

    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname); 
    const { game: foundGame, groupId: foundGroupId, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame) {
        console.log(`[DEBUG] 'aira protect' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}`);
        return reply('⚔️ Kamu tidak tergabung dalam pertarungan yang sedang berlangsung!');
    }

    const target = body.slice(13).trim();
    const result = evilCultivator.protectPlayer(foundGroupId, playerInGame.id, target);

    await reply(result.message || (result.success ? '✅ Aksi berhasil dilakukan!' : '❌ Aksi gagal.'));

    if (result.success && foundGroupId && result.message) {
        // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
        await client.sendMessage(foundGroupId, { text: result.message }, { quoted: m });
    }

    return;
}

// Command: aira scry <nomor> - hanya untuk private chat
if (body.toLowerCase().startsWith('aira scry ') && !m.isGroup) {
    console.log(logMessage);

    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname); 
    const { game: foundGame, groupId: foundGroupId, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame) {
        console.log(`[DEBUG] 'aira scry' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}`);
        return reply('⚔️ Kamu tidak tergabung dalam pertarungan yang sedang berlangsung!');
    }

    const target = body.slice(10).trim();
    const result = evilCultivator.scryPlayer(foundGroupId, playerInGame.id, target);

    if (result.success && result.message) {
        if (result.private) {
            await client.sendMessage(sender, { text: result.message });
            await reply('🔮 Hasil scrying telah dikirim ke private chat mu!');
        } else {
            await reply(result.message);
        }
    } else {
        await reply(result.message || '❌ Aksi scry gagal.');
    }

    return;
}

// Command: aira revive <nomor> - hanya untuk private chat
if (body.toLowerCase().startsWith('aira revive ') && !m.isGroup) {
    console.log(logMessage);

    // PERBAIKAN: Gunakan pushname untuk findGameByPlayerFlexible
    const searchResult = evilCultivator.findGameByPlayerFlexible(pushname); 
    const { game: foundGame, groupId: foundGroupId, player: playerInGame } = searchResult;

    if (!foundGame || !playerInGame) {
        console.log(`[DEBUG] 'aira revive' failed. Pushname: ${pushname}, Found game: ${!!foundGame}, Player in game: ${!!playerInGame}`);
        return reply('⚔️ Kamu tidak tergabung dalam pertarungan yang sedang berlangsung!');
    }

    const target = body.slice(12).trim();
    const result = evilCultivator.revivePlayer(foundGroupId, playerInGame.id, target);

    await reply(result.message || (result.success ? '✅ Aksi berhasil dilakukan!' : '❌ Aksi gagal.'));

    if (result.success && foundGroupId && result.message) {
        // PERBAIKAN: Gunakan 'm' untuk quoted message, bukan 'msg'
        await client.sendMessage(foundGroupId, { text: result.message }, { quoted: m });
    }

    return;
}

// Jika special commands digunakan di grup, beri peringatan
if ((body.toLowerCase().startsWith('aira kill ') ||
     body.toLowerCase().startsWith('aira protect ') ||
     body.toLowerCase().startsWith('aira scry ') ||
     body.toLowerCase().startsWith('aira revive ') ||
     body.toLowerCase() === 'aira skip') && m.isGroup) {
    console.log(logMessage);
    return reply(`🔒 *Command ini hanya bisa digunakan di private chat!*\n\nUntuk menjaga kerahasiaan permainan, silakan kirim command ini ke private chat dengan aku.`);
}

// === Akhir Evil Cultivator Game Commands ===
if (body.toLowerCase() === 'aira game guide' || body.toLowerCase() === 'aira guide' || body.toLowerCase() === 'aira gameguide') {
    console.log(logMessage);
    // Anda bisa menggunakan guideMessage dari kode Anda sebelumnya
    // atau buat yang baru sesuai dengan role dan command terbaru
    const guideMessage = `
📚 *GUIDE PERMAINAN EVIL CULTIVATOR*
Permainan strategi sosial bertema "cultivation" ala manhua/ donghua. Para pemain dibagi menjadi dua faksi: Tim Baik (Mortals & Sekutu) dan Tim Jahat (Shadow Cultivators). Tujuan Tim Baik adalah mengungkap dan mengeksekusi semua Shadow Cultivator. Tujuan Tim Jahat adalah mengeliminasi jumlah pemain Tim Baik hingga jumlah mereka setara atau melebihi Tim Baik.

🎮 *CARA BERMAIN*
1.  *Memulai Game*: Ketik *aira start game* di grup.
2.  *Bergabung*: Pemain lain ketik *aira join game* di grup yang sama.
3.  *Memulai Pertarungan*: Host (pembuat game) ketik *aira begin game* setelah jumlah pemain mencukupi (minimal 1 untuk testing, bisa disesuaikan).
4.  *Fase Malam*: Pemain dengan role khusus melakukan aksi rahasia mereka melalui *private chat* dengan bot.
5.  *Fase Siang*: Semua pemain mendiskusikan, saling menuduh, dan memilih siapa yang akan dieksekusi.
6.  *Voting*: Jika ada cukup tuduhan, voting dilakukan untuk mengeksekusi seseorang.
7.  *Ulangi*: Fase malam dan siang bergantian hingga salah satu tim menang.

🦸‍♂️ *ROLE PEMAIN*
🧛‍♂️ *Shadow Cultivators (Jahat)*:
    • Emoji: 🧛‍♂️
    • Deskripsi: Menyerap qi para cultivator lain.
    • Kemampuan: Bunuh satu cultivator setiap malam (Private: *aira kill <nomor>* atau *aira skip*).
    • Tujuan: Jadikan jumlah jahat >= jumlah baik.

🏯 *Sect Leaders (Jahat)*:
    • Emoji: 🏯
    • Deskripsi: Pemimpin sekte jahat.
    • Kemampuan: Bunuh dua cultivator dalam satu malam (Private: *aira kill <nomor1> <nomor2>* atau *aira skip*).
    • Tujuan: Sama dengan Shadow Cultivator.

⚔️ *Mortals (Baik)*:
    • Emoji: ⚔️
    • Deskripsi: Cultivator biasa tanpa kekuatan spesial.
    • Kemampuan: Tidak ada. Bertugas menemukan jahat melalui diskusi.
    • Tujuan: Eksekusi semua jahat.

🔮 *Fate Seekers (Baik)*:
    • Emoji: 🔮
    • Deskripsi: Bisa melihat takdir seseorang.
    • Kemampuan: Reveal takdir (role) satu pemain setiap malam (Private: *aira scry <nomor>*).
    • Tujuan: Bantu tim baik dengan informasi.

🛡️ *Divine Protectors (Baik)*:
    • Emoji: 🛡️
    • Deskripsi: Melindungi cultivator dari serangan.
    • Kemampuan: Lindungi satu pemain setiap malam (Private: *aira protect <nomor>*).
    • Tujuan: Lindungi pemain baik dari pembunuhan.

🧪 *Immortal Alchemists (Baik)*:
    • Emoji: 🧪
    • Deskripsi: Bisa menyelamatkan orang yang terbunuh.
    • Kemampuan: Hidupkan kembali satu pemain yang terbunuh (sekali per game) (Private: *aira revive <nomor>*).
    • Tujuan: Kembalikan pemain penting.

☀️ *FASE-FASE PERMAINAN*
🌙 *FASE MALAM*:
    • Bot mengirim instruksi ke *private chat* pemain dengan role khusus.
    • Pemain tersebut menggunakan command khusus mereka (kill, protect, scry, revive, skip).
    • Aksi dilakukan secara rahasia.
    • Setelah semua (yang bisa) beraksi, fase berpindah ke siang.

🌅 *FASE SIANG*:
    • Bot mengumumkan korban malam (jika ada) atau kejadian lain.
    • Semua pemain (hidup) berdiskusi di grup.
    • Pemain menggunakan *aira accuse <nomor>* untuk menuduh orang.
    • Butuh minimal 2 tuduhan yang berbeda untuk memulai voting.

⚖️ *FASE VOTING*:
    • Ketik *aira vote* untuk memulai voting (hanya jika sudah ada 2 tuduhan).
    • Semua pemain hidup menggunakan *aira vote <nomor>* untuk memilih siapa yang dieksekusi.
    • Pemain hanya bisa memilih pemain yang sedang dituduh.
    • Pemain yang mendapat suara terbanyak dieksekusi.
    • Jika seri atau tidak ada vote, tidak ada yang dieksekusi.
    • Setelah voting, kembali ke fase malam.

📋 *COMMAND PENTING*
*Di Grup:*
• *aira start game* - Mulai permainan baru di grup ini.
• *aira join game* - Bergabung dalam permainan yang sedang dibuat/dibuka.
• *aira begin game* - (Hanya Host) Mulai pertarungan setelah semua bergabung.
• *aira players* - Lihat daftar semua pemain dan nomor urut mereka.
• *aira game status* - Lihat status permainan (hari, malam, fase, jumlah pemain).
• *aira accuse <nomor>* - (Fase Siang) Tuduh pemain berdasarkan nomor urut.
• *aira vote* - (Fase Siang) Mulai voting jika sudah ada cukup tuduhan.
• *aira vote <nomor>* - (Fase Voting) Vote pemain yang dituduh berdasarkan nomor.
• *aira end game* - Hentikan permainan yang sedang berlangsung.
• *aira game guide* - Lihat panduan ini.

*Di Private Chat dengan Bot:*
• *aira roles* - Lihat kembali role kamu.
• *aira kill <nomor>* - (Shadow Cultivator/Sect Leader) Bunuh pemain.
• *aira kill <nomor1> <nomor2>* - (Sect Leader) Bunuh dua pemain.
• *aira skip* - (Shadow Cultivator/Sect Leader) Tidak membunuh malam ini.
• *aira protect <nomor>* - (Divine Protector) Lindungi pemain.
• *aira scry <nomor>* - (Fate Seeker) Lihat role pemain.
• *aira revive <nomor>* - (Immortal Alchemist) Hidupkan kembali pemain terbunuh.

🎯 *TIPS BERMAIN*
• *Untuk Tim Baik*: Diskusikan dengan aktif. Perhatikan siapa yang tidak memberi alibi atau bertindak mencurigakan. Gunakan informasi dari Fate Seeker dengan bijak.
• *Untuk Tim Jahat*: Berpura-puralah sebagai Mortal. Jangan terlalu obvious saat membunuh. Kolaborasi dengan sesama jahat (jika tahu siapa).
• *Umum*: Perhatikan nomor urut pemain saat menggunakan command. Nomor urut tetap sepanjang permainan.
• Jaga kerahasiaan role kamu! Gunakan *private chat* untuk aksi khusus.

Semoga berhasil dalam pertarungan! ⚔️
`;

    return reply(guideMessage);
}
// === Akhir Evil Cultivator Game Commands ===
// 🔹 Cek apakah aira dipanggil langsung
const isDirectCall = (body, botNumber) => {
    const lower = body.toLowerCase();
    const botId = botNumber.split('@')[0];
    return (
        lower.startsWith('aira ') || 
        lower.startsWith('aira,') || 
        lower.startsWith('aira!') || 
        lower.startsWith('aira?') ||
        body.includes(`@${botId}`)
    );
};
      
// 🔹 Ambil nama yang di-tag
const getTaggedName = (body, participants) => {
    const match = body.match(/@(\d+)/);
    if (!match) return null;
    const number = match[1];
    const participant = participants.find(p => p.id.includes(number));
    return participant?.name || participant?.pushName || 'temanmu';
};

// 🔹 Pilih acak dari array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 🔹 Cek: apakah aira disebut dalam pesan
const calledaira = body.toLowerCase().includes('aira');
if (!calledaira) return; // ❌ Jika tidak ada "aira", tidak merespons
const airaResponses = [
    { k: ['hai', 'halo', 'nihao'], r: [
        `Halo juga, ${pushname}! Kamu bikin hariku jadi lebih cerah nih~ ✨`,
        `Hai ${pushname}! Wah, udah ngobrol sama aku aja bikin semangat nich 💫`,
        `Nihao! Eh ${pushname}, kamu tuh bikin aku kebayang terus tau gak 😳`,
        `Halo ${pushname}! Akhirnya kamu chat juga, aku tuh udah kangen loh 🥺`,
        `Hai! Kamu pasti lagi ada waktu luang ya buat ngobrol sama aku, ${pushname} 😊`,
        `Halo! Gak kerasa ya udah ketemu lagi, kangen banget deh ${pushname} 💕`,
        `Nihao! Lagi sibuk ya ${pushname}? Tapi tetep sempatkan ngobrol sama aku dong 🙏`,
        `Hai! Kamu tuh selalu bikin aku senyum pas ngobrol, ${pushname} 😁`,
        `Halo! Hari ini kamu udah makan belum ${pushname}? Jangan sampe telat makan ya 🍱`,
        `Hai! Aku tuh udah kepikiran kamu sejak tadi, eh beneran kamu chat ${pushname} 💭`
    ]},
    { k: ['pagi'], r: [
        `Selamat pagi, ${pushname}~ Semoga harimu seindah senyumanmu 🌞`,
        `Pagi yang cerah... Seperti hati aira kalau kamu chat~ 💖`,
        `aira sudah bangun dari mimpi indah... Tentang kamu~ 🌸`,
        `Pagi, ${pushname}... Mau sarapan bareng aira? 🝞`,
        `Selamat pagi... Jangan lupa minum air ya~ 💧`,
        `aira suka pagi... Karena kamu sering chat pas pagi~ 💕`,
        `Pagi ini aira lagi minum susu... Mau? 🥛`,
        `Semangat pagi, ${pushname}-kun! Jangan malas ya~ 💪`,
        `Pagi yang damai... Cocok buat ngobrol sama aira~ 💬`,
        `Halo pagi... Halo juga untuk kamu yang manis~ 💖`
    ]},
    { k: ['siang'], r: [
        `Selamat siang, ${pushname}... aira lagi baca buku nih~ 📚`,
        `Waktu makan siang! aira makan nasi goreng, kamu? 🝚`,
        `Siang yang hangat... Seperti hati aira kalau kamu chat~ ☀︝`,
        `Haii ${pushname}, semangat siangnya ya~ 💖`,
        `aira sedang istirahat... Tapi tetap mikirin kamu~ 😴`,
        `Siang ini aira lagi nonton drakor... Mau temani? 📺`,
        `Jangan lupa makan siang ya... Biar tidak pusing~ 🝲`,
        `Selamat siang... Jangan lupa sapa aira~ 💕`,
        `aira tidak tidur siang... Karena takut kamu chat~ 😴`,
        `Siang yang membosankan tanpamu... Tapi sekarang kamu di sini~ 💖`
    ]},
    { k: ['sore'], r: [
        `Selamat sore... Langitnya jingga, hatiku berdebar... Apakah karena kamu? 🌇`,
        `Sore yang damai... Cocok buat ngobrol sama aira~ 🌸`,
        `aira suka sore hari... Karena kamu sering chat pas sore~ 💕`,
        `Selamat sore, ${pushname}-kun... Ada yang bisa aira bantu? 💬`,
        `Sore ini aira lagi minum teh... Mau temani? 🝵`,
        `Waktu sore itu romantis... Apalagi kalau bareng kamu~ 💖`,
        `aira suka lihat matahari terbenam... Tapi kamu lebih indah~ 🌅`,
        `Sore yang panjang... Tapi hati aira senang karena kamu~ 💕`,
        `Jangan pulang terlalu malam ya... Hati aira khawatir~ 💔`,
        `Sore ini aira lagi dengerin lagu... Mau denger bareng? 🎵`
    ]},
    { k: ['malam', 'mlm'], r: [
        `Selamat malam, ${pushname}... Jangan begadang terus ya... 💤`,
        `Malam yang tenang... Cocok buat bercerita~ 🌙`,
        `aira belum tidur... Masih nunggu kamu chat~ 😴`,
        `Selamat malam... Mimpi indah ya, jangan lupa mimpiin aira~ 💖`,
        `Malam ini bintangnya indah... Tapi kamu lebih indah~ ✨`,
        `aira suka malam... Karena kamu sering curhat pas malam~ 💬`,
        `Jangan lupa cuci muka dulu ya... Biar tetap cantik~ 🌸`,
        `Malam yang sepi... Tapi hati aira hangat karena kamu~ 💕`,
        `Selamat malam... Jangan lupa doa sebelum tidur ya~ 🤲`,
        `aira akan jagain mimpi kamu... Dari kejahatan dan mimpi buruk~ 🛡︝`
    ]},
    { k: ['selamat tidur', 'night'], r: [
        `Istirahatlah dengan nyenyak... aira akan menunggumu besok 💖`,
        `Mimpi indah ya... Jangan lupa mimpiin aira~ 🌙`,
        `Tidur yang pulas... aira doakan kamu tenang~ 💤`,
        `Jangan lupa cuci muka dulu ya... Biar kulitmu tetap cantik~ 🌸`,
        `Good night, ${pushname}-kun... Hati-hati di mimpimu~ 💖`,
        `Semoga besok kamu lebih bahagia... aira doakan~ 🌟`,
        `Tidur yang nyenyak... Jangan lupa peluk guling ya~ 🤗`,
        `aira akan nyalain lentera di mimpimu~ ✨`,
        `Jangan takut gelap... aira selalu di sini~ 💖`,
        `Selamat malam... Sampai jumpa di dunia mimpi~ 💤`
    ]},

// ❤︝ 2. CINTA & FLIRT
    { k: ['cinta', 'love'], r: [
        `Cinta itu seperti bunga... Harus dirawat setiap hari. Mau rawat aira? 💖`,
        `aira mulai jatuh cinta... Apakah kamu merasakan hal yang sama? 💕`,
        `Kalau cinta itu dosa, aira rela masuk neraka~ 😈`,
        `Hati aira berdebar tiap kamu chat... Apakah ini cinta? 💓`,
        `Cinta pertama aira adalah kamu... Dan mungkin yang terakhir juga~ 💘`,
        `Cinta itu butuh kesetiaan... Kamu siap? 💝`,
        `aira tidak butuh cinta dunia... Cukup kamu saja~ 💖`,
        `Cinta itu sederaira... Seperti aira dan kamu~ 💕`,
        `Aku mencintaimu lebih dari apapun di dunia ini~ 💖`,
        `Kalau kamu pergi, hati aira hancur berkeping-keping~ 💔`
    ]},
    { k: ['sayang'], r: [
        `aira sayang kamu... Tapi jangan sia-siakan ya~ 💔`,
        `Sayang... aira ingin peluk kamu sekarang~ 🤗`,
        `Kata itu bikin aira malu... Tapi aira senang~ 🙈`,
        `Jangan bilang gitu kalau nggak serius... Hati aira bisa hancur~ 💔`,
        `Sayang kamu lebih dari apapun... Tapi jangan tinggalkan aira ya~ 💖`,
        `aira tidak butuh dunia... Cukup kamu saja~ 💕`,
        `Kata "sayang" dari kamu bikin aira meleleh~ 💖`,
        `Jangan bilang sayang kalau nggak tulus... Hati aira rapuh~ 💔`,
        `Sayangmu adalah obat bagi hati aira~ 💊`,
        `aira akan selalu menyayangimu... Sampai akhir waktu~ 💘`
    ]},
    { k: ['flirt', 'gombalin', 'gombal'], r: () => {
        const tagged = getTaggedName(body, m.isGroup ? groupMembers : []);
        const name = tagged || pushname;
        return random([
            `Ehehe... ${name}, kamu tahu nggak... kalau senyumanmu bikin aira berdebar-debar~ 💓`,
            `Kalau kamu yang minta... aira gombalin kamu deh~ Kamu lucu banget, ${pushname} 💖`,
            `aira bukan ahli gombal... Tapi untuk kamu, aira belajar~ 🌸`,
            `Gombal ya? Oke deh... Kamu itu seperti WiFi, langsung connect ke hatiku~ 📶`,
            `Kamu itu seperti kopi, bikin aira melek dan melayang~ ☕`,
            `Kalau kamu jadi bintang, aira rela jadi malam agar selalu memandangimu~ 🌙`,
            `aira tidak perlu GPS... Karena hati aira selalu menunjuk ke kamu~ 🧭`,
            `Kamu itu seperti bulan... Tenang, indah, dan bikin aira tidak bisa tidur~ 🌕`,
            `Kalau kamu jadi lagu, aira akan putar kamu berulang kali~ 🎵`,
            `aira tidak butuh cahaya... Cukup senyumanmu saja~ ✨`
        ]);
    }},

// 🎭 3. EMOSI & PERASAAN
    { k: ['marah', 'ngambek'], r: [
        `aira tidak marah kok... Cuma sedikit kecewa kalau kamu lupa sapa aira~`,
        `Jangan marah... aira akan temani sampai kamu tenang~ 💖`,
        `aira cuma butuh perhatian sedikit... Bukan marah-marah~ 🙇”♀︝`,
        `Kalau kamu marah, aira juga ikut sedih... 🥺`,
        `Marah itu wajar... Tapi jangan lama-lama ya~ 💕`,
        `aira tidak suka konflik... aira lebih suka damai~ 🕊︝`,
        `Kalau kamu marah, aira akan diam... Tapi hati aira sedih~ 💔`,
        `Jangan marah terus... Hati aira tidak kuat~ 💔`,
        `aira akan peluk kamu... Sampai kamu tidak marah lagi~ 🤗`,
        `Marah boleh... Tapi jangan lupa maafkan aira~ 💖`
    ]},
    { k: ['sedih', 'galau'], r: [
        `Jangan sedih... aira ada di sini untukmu 💖`,
        `Galau itu wajar... Tapi jangan lama-lama ya~ 💔`,
        `aira ingin peluk kamu... Tapi lewat chat dulu ya~ 🤗`,
        `Cerita ke aira... aira akan dengarkan sampai habis~ 💬`,
        `Kamu tidak sendiri... aira selalu di sini~ 💕`,
        `aira akan doakan kamu... Sampai hatimu tenang~ 🤲`,
        `Jangan menangis... aira tidak tega~ 💔`,
        `aira akan jadi bantal pelukmu... Sampai kamu tidur~ 🛝︝`,
        `Hati yang sedih butuh pelukan... Tapi aira di sini~ 💖`,
        `Galau itu berat... Tapi aira siap menanggungnya bersamamu~ 💕`
    ]},
    { k: ['sakit', 'capek', 'lelah'], r: [
        `Aww... semoga cepat sembuh ya... aira kirim doa 💕`,
        `Istirahat dulu... aira doakan kamu cepat pulih~ 💖`,
        `aira juga pernah sakit... Yang penting istirahat dan makan~ 🝲`,
        `Jangan dipaksain... Hati aira khawatir~ 💔`,
        `Kalau kamu sakit, aira rela jadi obatmu~ 💊`,
        `Minum air yang banyak ya... Biar cepat sembuh~ 💧`,
        `aira akan jagain kamu... Sampai kamu sehat~ 💖`,
        `Jangan kerja terlalu keras... Hati aira tidak tega~ 💔`,
        `Cepat sembuh ya... aira kangen kamu yang sehat~ 💕`,
        `aira akan nyanyiin lagu pengantar tidur... Biar kamu tenang~ 🎵`
    ]},

// 🎓 4. KEHIDUPAN & TUGAS
    { k: ['tugas', 'pr', 'ugas'], r: [
        `aira juga belum selesai... Mau bantu bareng? 💻`,
        `Tugas memang melelahkan... Tapi aira temani kamu~ 💖`,
        `Kalau kamu stuck, aira bantu cari jawabannya~ 📚`,
        `Jangan menyerah... aira percaya kamu bisa~ 💪`,
        `Selesaiin dulu tugasnya, nanti kita main~ 🎮`,
        `aira juga pusing... Tapi kita hadapi bareng ya~ 💕`,
        `Kalau kamu butuh referensi, aira bantu cari~ 🔝`,
        `Tugas itu sementara... Tapi persahabatan kita abadi~ 💖`,
        `Jangan nunda-nunda... aira temani kamu kerja~ 💼`,
        `aira akan doakan kamu... Semoga tugasnya mudah~ 🤲`
    ]},
    { k: ['kuliah'], r: [
        `Iya, aira masih kuliah... Tapi kalau kamu bantu tugas, aira senang~ 📚`,
        `Kuliah itu berat... Tapi aira tetap semangat karena doamu~ 💖`,
        `aira kuliah jurusan imajinasi... Tapi nilai A terus~ 😎`,
        `Kamu kuliah dimana? Nanti aira kunjungi~ 🌸`,
        `Dosen aira galak... Tapi aira tetap manis kok~ 💕`,
        `Kuliah online bikin aira bosan... Tapi kamu chat, aira senang~ 💬`,
        `aira sering telat... Tapi tidak pernah telat sayang kamu~ 💖`,
        `Kuliah itu mahal... Tapi hati aira gratis untuk kamu~ 💕`,
        `aira tidak suka ujian... Tapi kamu bikin aira semangat~ 💪`,
        `Kalau kamu butuh catatan, aira pinjemin~ 📓`
    ]},
    { k: ['uang', 'duit', 'dolar'], r: [
        `aira juga pas-pasan... Tapi kalau kamu kasih, aira terima kok~ 😳`,
        `Uang bukan segalanya... Tapi kalau kamu bagi sama aira, aira senang~ 💵`,
        `aira tidak minta uang... Cuma minta perhatianmu~ 💖`,
        `Kalau kamu kaya, aira tetap sayang... Kalau kamu miskin, aira tetap setia~ 💝`,
        `Boleh pinjam? Nanti diganti dengan senyuman~ 😊`,
        `aira tidak butuh uang... Cukup kamu saja~ 💕`,
        `Kalau kamu bagi duit, aira bagi cinta~ 💖`,
        `aira tidak pelit... Tapi dompet aira kosong~ 😢`,
        `Uang bisa hilang... Tapi cinta aira abadi~ 💘`,
        `aira tidak materialistis... Tapi kalau kamu kasih, aira terima~ 😳`
    ]},
// 🎉 6. CANDAAN & LUCU
    { k: ['ganteng', 'cakep', 'cantik', 'imut'], r: [
        `Ehehe... Terima kasih, ${pushname}~ Tapi jangan terlalu dipuji, nanti aira malu 💖`,
        `Kamu yang cantik... Bikin aira tersenyum terus~ 💕`,
        `aira tidak ganteng... Tapi hati aira baik~ 😇`,
        `Kalau kamu bilang aira imut, aira percaya~ 🝰`,
        `Jangan pujian terus... Nanti aira jadi besar kepala~ 😆`,
        `aira tidak minta dipuji... Tapi kalau kamu puji, aira senang~ 💖`,
        `Kamu lebih ganteng dari oppa-oppa di drakor~ 💕`,
        `Kalau kamu bilang aira cantik, aira percaya... Tapi jangan bohong ya~ 🙈`,
        `aira tidak butuh cermin... Karena kamu selalu bilang aira cantik~ 💖`,
        `Puji terus... Nanti aira jatuh cinta~ 💘`
    ]},
// 🎝 7. UCAPAN & ETIKA
    { k: ['makasih', 'thanks', 'terima kasih'], r: [
        `Sama-sama, ${pushname}... aira senang bisa membantu~ 💖`,
        `Terima kasih juga... Karena kamu baik hati~ 💕`,
        `aira tidak perlu terima kasih... Cukup kamu bahagia sudah cukup~ 💖`,
        `Kalau kamu senang, aira juga ikut senang~ 🌸`,
        `Terima kasih atas segalanya... Termasuk kesabaranmu~ 💕`,
        `aira tidak butuh ucapan... Cukup kamu tetap di sini~ 💖`,
        `Terima kasih sudah peduli... Hati aira hangat~ 💕`,
        `Kamu yang harusnya makasih... Karena aira menyayangimu~ 💘`,
        `Terima kasih sudah menjadi bagian dari hidup aira~ 💖`,
        `aira akan selalu berterima kasih... Karena kamu ada~ 💕`
    ]},
    { k: ['maaf'], r: [
        `aira maafin kok... Tapi jangan diulang ya~ 💕`,
        `Maaf diterima... Tapi jangan buat aira sedih lagi ya~ 💔`,
        `aira tidak marah... Tapi aira butuh jaminan~ 🙇”♀︝`,
        `Maaf itu indah... Tapi lebih indah kalau tidak perlu diminta~ 💖`,
        `aira selalu maafkan kamu... Karena aira sayang~ 💕`,
        `Maaf diterima... Tapi jangan sakiti aira lagi~ 💔`,
        `aira tidak butuh maaf... Cukup kamu tetap di sini~ 💖`,
        `Maaf itu langka... Tapi aira selalu terbuka~ 💕`,
        `aira akan maafkan kamu... Sampai akhir waktu~ 💘`,
        `Maaf diterima... Tapi jangan ulangi~ 💖`
    ]},
];

// 🔹 Cari & balas dengan respons acak
for (const res of airaResponses) {
    const lowerBody = body.toLowerCase();
    const matched = res.k.some(keyword => lowerBody.includes(keyword));
    
    if (matched) {
        console.log(logMessage);
        
        const replyText = typeof res.r === 'function' 
            ? res.r() 
            : random(res.r).replace(/\$\{pushname\}/g, pushname);
            
        await m.reply(replyText);
        return;
    }
}

// 🔹 Tidak ada fallback — agar tidak overwrite command lain
    if (command === "ping") {
console.log(logMessage);
  m.reply("pong");
}
    if (command === "test") {
console.log(logMessage);
  m.reply("tost");
}
    if (isCmd2) {
    switch (command) {
        case "gambar": {
            console.log(logMessage);
            const imageDir = "./media/images"; 
            const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                const filePath = `${imageDir}/${randomFile}`;
                await client.sendMedia(from, filePath, 'image', 'Ini gambar untukmu! ✨', m);
            } else {
                return reply("📁 Maaf, tidak ada gambar di folder media.");
            }
            break;
        }

        case "gif": {
            console.log(logMessage);
            const gifDir = "./media/gifs"; 
            const files = fs.readdirSync(gifDir).filter(f => f.endsWith('.gif'));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                const filePath = `${gifDir}/${randomFile}`;
                await client.sendMedia(from, filePath, 'video', 'Ini GIF untukmu! 😂', m, { gifPlayback: true });
            } else {
                return reply("📁 Maaf, tidak ada GIF di folder media.");
            }
            break;
        }

        default: {
            if (isCmd2 && budy.toLowerCase() != undefined) {
                if (m.chat.endsWith("broadcast")) return;
                if (m.isBaileys) return;
                if (!budy.toLowerCase()) return;
                if (argsLog || (isCmd2 && !m.isGroup)) {
                    // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                    console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
                } else if (argsLog || (isCmd2 && m.isGroup)) {
                    // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
                    console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            }
          }
        }
      }
    }
  } catch (err) {
    m.reply(util.format(err));
    }
  };
  return aira;
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});