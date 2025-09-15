// =======================================================================
//   Index.js - File Utama Bot Aira
// =======================================================================
//
// File ini berfungsi sebagai "otak" dari bot. Di sini, koneksi ke WhatsApp
// dibuat, pesan masuk diproses, dan logika utama bot dijalankan.
//
// =======================================================================

// --- [ BAGIAN 1: KONFIGURASI AWAL ] ---
// Bagian ini mendefinisikan konstanta-konstanta penting untuk bot.
// Pengguna harus mengubah nilai di sini sesuai kebutuhan mereka.
// =======================================================================
const sessionName = "Aira"; // Nama sesi bot. Nama ini akan digunakan sebagai nama folder untuk menyimpan data sesi.
const owner = [""]; // Masukkan nomor telepon pemilik bot di sini. Gunakan format "628xxx" tanpa tanda "+".

// --- [ BAGIAN 2: IMPOR MODUL DAN DEPENDENSI ] ---
// Bagian ini mengimpor semua library dan file yang dibutuhkan bot.
// Menggunakan metode yang robust untuk memastikan Baileys terimpor dengan benar.
// =======================================================================
let makeWASocket;
let baileysExports = {};

try {
    // Metode impor utama untuk library Baileys
    const baileys = require('@whiskeysockets/baileys');
    makeWASocket = baileys.default || baileys.makeWASocket;
    baileysExports = {
        useMultiFileAuthState: baileys.useMultiFileAuthState,
        DisconnectReason: baileys.DisconnectReason,
        fetchLatestBaileysVersion: baileys.fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore: baileys.makeCacheableSignalKeyStore,
        Browsers: baileys.Browsers,
        jidDecode: baileys.jidDecode,
        proto: baileys.proto,
        getContentType: baileys.getContentType,
        downloadMediaMessage: baileys.downloadMediaMessage,
    };
} catch (err1) {
    console.error("[IMPOR] Gagal mengimpor Baileys dengan metode 1:", err1.message);
    try {
        // Metode impor alternatif jika yang pertama gagal
        const baileysDefault = require('@whiskeysockets/baileys').default;
        makeWASocket = baileysDefault;
        baileysExports = {
            useMultiFileAuthState: baileysDefault.useMultiFileAuthState,
            DisconnectReason: baileysDefault.DisconnectReason,
            fetchLatestBaileysVersion: baileysDefault.fetchLatestBaileysVersion,
            makeCacheableSignalKeyStore: baileysDefault.makeCacheableSignalKeyStore,
            Browsers: baileysDefault.Browsers,
            jidDecode: baileysDefault.jidDecode,
            proto: baileysDefault.proto,
            getContentType: baileysDefault.getContentType,
            downloadMediaMessage: baileysDefault.downloadMediaMessage,
        };
    } catch (err2) {
        console.error("[IMPOR] Gagal mengimpor Baileys dengan metode 2:", err2.message);
        console.error("❌ [FATAL] Tidak dapat mengimpor @whiskeysockets/baileys.");
        process.exit(1);
    }
}

// Impor modul Node.js dan library tambahan
const pino = require("pino"); // Untuk logging yang efisien
const { Boom } = require("@hapi/boom"); // Untuk menangani kode error HTTP
const fs = require("fs"); // Untuk interaksi dengan sistem file
const qrcode = require("qrcode-terminal"); // Untuk menampilkan QR code di terminal
const axios = require("axios"); // Untuk membuat permintaan HTTP
const chalk = require("chalk"); // Untuk mewarnai teks di konsol
const figlet = require("figlet"); // Untuk membuat teks ASCII art
const _ = require("lodash"); // Library utilitas JavaScript
const PhoneNumber = require("awesome-phonenumber"); // Untuk memformat nomor telepon
const CustomFileStore = require('./customStore'); // Mengimpor file penyimpanan kustom untuk data bot
const airaHandler = require("./aira.js"); // Mengimpor logika bot utama dari file aira.js

// --- [ BAGIAN 3: KONFIGURASI DAN FUNGSI UTAMA ] ---
// Mengatur logger, menyimpan data, dan mendefinisikan fungsi-fungsi inti.
// =======================================================================
const logger = pino({ level: "silent" });

// Menyiapkan penyimpanan data kustom
const storeFileName = `${sessionName ? sessionName : "session"}_custom_store.json`;
const storeFilePath = `./${storeFileName}`;
const customStore = new CustomFileStore({
    logger: logger,
    filePath: storeFilePath
});

// Menyimpan data bot secara berkala ke file
const STORE_INTERVAL_MS = 10_000;
setInterval(() => {
    customStore.writeToFile();
}, STORE_INTERVAL_MS);

// Fungsi pembantu untuk mewarnai teks konsol
const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

// Fungsi untuk mendapatkan pesan dari cache atau file
async function getMessage(key) {
    if (customStore) {
        try {
            const msg = await customStore.loadMessage(key.remoteJid, key.id);
            return msg?.message || undefined;
        } catch (loadErr) {
            return undefined;
        }
    }
    return undefined;
}

// Fungsi untuk membuat objek pesan yang mudah digunakan
function smsg(conn, m, store) {
    if (!m) return m;
    let M = baileysExports.proto.WebMessageInfo;
    if (m.key) {
      m.id = m.key.id;
      m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
      m.chat = m.key.remoteJid;
      m.fromMe = m.key.fromMe;
      m.isGroup = m.chat.endsWith("@g.us");
      m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
      if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
    }
    if (m.message) {
      m.mtype = baileysExports.getContentType(m.message);
      m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[baileysExports.getContentType(m.message[m.mtype].message)] : m.message[m.mtype]) || m.message[m.mtype];
      if (!m.msg && m.mtype === 'viewOnceMessageV2') {
           m.msg = m.message[m.mtype].message?.[baileysExports.getContentType(m.message[m.mtype].message)];
      }
      if (!m.msg && m.mtype === 'documentWithCaptionMessage') {
          m.msg = m.message[m.mtype].message?.[baileysExports.getContentType(m.message[m.mtype].message)];
      }
      if (!m.msg && m.mtype === 'ephemeralMessage') {
          m.msg = m.message[m.mtype].message?.[baileysExports.getContentType(m.message[m.mtype].message)];
      }
  
      m.body = m.message.conversation || m.msg?.caption || m.msg?.text || (m.mtype == 'listResponseMessage') && m.msg?.singleSelectReply?.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg?.selectedButtonId || (m.mtype == 'viewOnceMessage' || m.mtype == 'viewOnceMessageV2') && m.msg?.caption || m.text;
      let quoted = m.quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
      m.mentionedJid = m.msg?.contextInfo ? m.msg.contextInfo.mentionedJid : [];
      if (m.quoted) {
        let type = baileysExports.getContentType(quoted);
        m.quoted = m.quoted[type];
        if (['productMessage'].includes(type)) {
          type = baileysExports.getContentType(m.quoted);
          m.quoted = m.quoted[type];
        }
        if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
        m.quoted.mtype = type;
        m.quoted.id = m.msg.contextInfo.stanzaId;
        m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
        m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
        m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
        m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id);
        m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
        m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
        m.getQuotedObj = m.getQuotedMessage = async () => {
          if (!m.quoted.id) return false;
          let q = await store.loadMessage(m.chat, m.quoted.id);
          return smsg(conn, q, store);
        };
        let vM = m.quoted.fakeObj = M.fromObject({
          key: {
            remoteJid: m.quoted.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id
          },
          message: quoted,
          ...(m.isGroup ? { participant: m.quoted.sender } : {})
        });
        m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
        m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
      }
    }
    if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m);
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || "";
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : conn.sendMessage(chatId, { text: text }, { quoted: m, ...options });
    m.copy = () => smsg(conn, M.fromObject(M.toObject(m)));
    return m;
  }
  
  // --- [ BAGIAN 4: FUNGSI UTAMA BOT - MENGHUBUNGKAN KE WHATSAPP ] ---
  // Fungsi ini mengatur koneksi bot ke server WhatsApp, menangani status,
  // dan mengaktifkan event listener untuk memproses pesan.
  // =======================================================================
  async function startAira() {
      // Menampilkan logo dan judul bot di terminal
      console.log(color(figlet.textSync("aira", { font: "Standard", horizontalLayout: "default", verticalLayout: "default", whitespaceBreak: false, }), "blue"));
      console.log(color(figlet.textSync("Your Personal Assistant", { font: "Small", horizontalLayout: "default", verticalLayout: "default", whitespaceBreak: false, }), "white"));

      // Menggunakan state otentikasi dari file sesi
      const { state, saveCreds } = await baileysExports.useMultiFileAuthState(`./${sessionName ? sessionName : "session"}`);

      // Mendapatkan versi terbaru dari Baileys untuk kompatibilitas
      let version;
      try {
          const versionData = await baileysExports.fetchLatestBaileysVersion();
          version = versionData.version;
          console.log(`Menggunakan WhatsApp Web Version: ${version.join('.')}`);
      } catch (versionErr) {
          console.error("Gagal mengambil versi terbaru, menggunakan default:", versionErr.message);
          version = [2, 3000, 1015822210]; // Versi fallback
          console.log(`Menggunakan versi fallback: ${version.join('.')}`);
      }

      // Membuat instance soket WhatsApp
      const client = makeWASocket({
          auth: {
              creds: state.creds,
              keys: baileysExports.makeCacheableSignalKeyStore(state.keys, logger),
          },
          version: version,
          logger: logger,
          markOnlineOnConnect: true,
          generateHighQualityLinkPreview: true,
          browser: baileysExports.Browsers.macOS('Aira Bot'),
          getMessage: getMessage,
          syncFullHistory: false,
      });

      // Mengaitkan penyimpanan data kustom dengan event Baileys
      customStore.bind(client.ev);

      // --- Perbaikan: Mendefinisikan fungsi-fungsi di dalam scope client ---
      // Ini memastikan fungsi-fungsi ini memiliki akses ke objek 'client'.
      client.sendMedia = async (jid, path, type = 'image', caption = '', quoted = '', options = {}) => {
          let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split(',')[1], 'base64') : /^https?:\/\//.test(path) ? (await axios.get(path, { responseType: 'arraybuffer' })).data : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
      
          let message = {};
          if (type === 'image') {
              message = { image: buffer, caption: caption, ...options };
          } else if (type === 'video') {
              message = { video: buffer, caption: caption, ...options };
          } else {
              throw new Error("Tipe media tidak didukung: " + type);
          }
          
          return await client.sendMessage(jid, message, { quoted: quoted });
      };
      
      client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

      client.cMod = (jid, copy, text = '', sender = client.user.id, options = {}) => {
          let mtype = Object.keys(copy.message)[0];
          let isEphemeral = mtype === 'ephemeralMessage';
          if (isEphemeral) { mtype = Object.keys(copy.message.ephemeralMessage.message)[0]; }
          let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
          let content = msg[mtype];
          if (typeof content === 'string') msg[mtype] = text || content;
          else if (content.caption) content.caption = text || content.caption;
          else if (content.text) content.text = text || content.text;
          if (typeof content !== 'string') msg[mtype] = { ...content, ...options };
          if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
          if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
          else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
          copy.key.remoteJid = jid;
          copy.key.fromMe = sender === client.user.id;
          return baileysExports.proto.WebMessageInfo.fromObject(copy);
      };
      
      client.decodeJid = (jid) => {
          if (!jid) return jid;
          if (/:\d+@/gi.test(jid)) {
              let decode = baileysExports.jidDecode(jid) || {};
              return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
          } else return jid;
      };

      client.ev.on("contacts.update", (update) => {
          for (let contact of update) {
              let id = client.decodeJid(contact.id);
          }
      });

      client.getName = (jid, withoutContact = false) => {
          id = client.decodeJid(jid);
          withoutContact = client.withoutContact || withoutContact;
          let v;
          if (id.endsWith("@g.us")) return (customStore.data.chats[id] || {}).subject || id;
          else v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === client.decodeJid(client.user.id) ? client.user : (customStore.data.contacts[id] || {});
          return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
      };

      client.public = true;
      client.serializeM = (m) => smsg(client, m, customStore);

      // --- [ BAGIAN 5: PENANGANAN EVENT KONEKSI ] ---
      // Bot akan bereaksi terhadap perubahan status koneksi.
      // Termasuk menampilkan QR code, mencoba menghubungkan kembali, atau keluar.
      // =======================================================================
      client.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect, qr } = update;
          if (qr) {
              // Tampilkan QR code saat pertama kali terhubung
              console.log("Scan QR Code ini dengan WhatsApp Anda:");
              qrcode.generate(qr, { small: true });
          }
          if (connection === "close") {
              let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
              console.log(`[KONEKSI] Koneksi ditutup karena: ${reason} (${lastDisconnect?.error?.message || 'Unknown'})`);
              if (reason === baileysExports.DisconnectReason.badSession) {
                  console.log(`Bad Session File, Please Delete Session and Scan Again`);
                  process.exit();
              } else if (reason === baileysExports.DisconnectReason.connectionClosed) {
                  console.log("Connection closed, reconnecting...");
                  startAira();
              } else if (reason === baileysExports.DisconnectReason.connectionLost) {
                  console.log("Connection Lost from Server, reconnecting...");
                  startAira();
              } else if (reason === baileysExports.DisconnectReason.connectionReplaced) {
                  console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
                  process.exit();
              } else if (reason === baileysExports.DisconnectReason.loggedOut) {
                  console.log(`Device Logged Out, Please Delete Folder Session and Scan Again.`);
                  // Hapus juga file store saat logout
                  if (fs.existsSync(storeFilePath)) {
                      fs.unlink(storeFilePath, (err) => {
                          if (err) console.error(`[STORE] Gagal menghapus file store saat logout:`, err.message);
                          else console.log(`[STORE] File store dihapus saat logout.`);
                      });
                  }
                  process.exit();
              } else if (reason === baileysExports.DisconnectReason.restartRequired) {
                  console.log("Restart Required, Restarting...");
                  startAira();
              } else if (reason === baileleysExports.DisconnectReason.timedOut) {
                  console.log("Connection TimedOut, Reconnecting...");
                  startAira();
              } else {
                  console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
                  startAira();
              }
          } else if (connection === "open") {
              const botNumber = await client.decodeJid(client.user.id);
              console.log(color("Bot success connected to server", "blue"));
              console.log(color("Type /menu to see menu"));

              // Kirim notifikasi acak kepada pemilik bot saat bot aktif
              const startupMessages = [
                  `Selamat pagi! Lapor bahwa Aira telah aktif dan siap beraksi! ✨`,
                  `Halo tuan! Aira telah kembali online dan dapat digunakan. 😆`,
                  `Lapor, Aira telah bangun dan siap melayani. Selamat bekerja! 💪`,
                  `Aira sudah terhubung ke server. Ada yang bisa Aira bantu? 😊`
              ];
              
              const randomMessage = startupMessages[Math.floor(Math.random() * startupMessages.length)];

              for (const ownerId of owner) {
                  const ownerJid = `${ownerId}@s.whatsapp.net`;
                  client.sendMessage(ownerJid, { text: randomMessage });
              }
          }
      });

      // Menyimpan kredensial otentikasi saat diperbarui
      client.ev.on("creds.update", saveCreds);

      // --- [ BAGIAN 6: PENANGANAN EVENT PESAN MASUK ] ---
      // Setiap pesan yang masuk akan diproses di sini.
      // =======================================================================
      client.ev.on("messages.upsert", async (chatUpdate) => {
          try {
              mek = chatUpdate.messages[0];
              if (!mek.message) return;
              mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
              
              // Abaikan pesan dari diri sendiri
              if (mek.key?.fromMe) return;
              
              if (mek.key && mek.key.remoteJid === "status@broadcast") return;
              if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;

              // Serialisasi pesan untuk kemudahan penggunaan
              m = smsg(client, mek, customStore);

              // Meneruskan pesan ke handler utama (aira.js)
              if (typeof airaHandler === 'function') {
                  airaHandler(client, m, chatUpdate);
              } else {
                  console.error("Gagal memanggil handler pesan dari aira.js. Pastikan ekspor benar.");
              }

          } catch (err) {
              console.log("Error dalam messages.upsert:", err);
          }
      });

      // --- [ BAGIAN 7: PENANGANAN ERROR DAN SHUTDOWN ] ---
      // Mengatur cara bot menangani error tak terduga dan proses pematian.
      // =======================================================================
      const unhandledRejections = new Map();
      process.on("unhandledRejection", (reason, promise) => {
          unhandledRejections.set(promise, reason);
          console.log("Unhandled Rejection at:", promise, "reason:", reason);
      });
      process.on("rejectionHandled", (promise) => {
          unhandledRejections.delete(promise);
      });
      process.on("Something went wrong", function (err) {
          console.log("Caught exception: ", err);
      });

      return client;
  }

  // Menjalankan fungsi utama untuk memulai bot
  startAira();

  // Menonton perubahan file untuk development (auto-reload)
  let file = require.resolve(__filename);
  fs.watchFile(file, () => {
      fs.unwatchFile(file);
      console.log(chalk.redBright(`Update ${__filename}`));
      delete require.cache[file];
      require(file);
  });

  // Menangani shutdown bot secara rapi (graceful shutdown)
  process.on('SIGINT', async () => {
      console.log(chalk.yellow('Menerima SIGINT. Mematikan dengan anggun...'));
      try {
          customStore.writeToFile();
          console.log(chalk.green('[STORE] Data disimpan saat shutdown.'));
      } catch (saveErr) {
          console.error('[STORE] Gagal menyimpan data saat shutdown:', saveErr);
      }
      process.exit(0);
  });