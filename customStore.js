// customStore.js - Implementasi Store Custom Berbasis File
const fs = require('fs');
const path = require('path');
const pino = require('pino');

class CustomFileStore {
    constructor({ logger, filePath }) {
        this.logger = logger || pino({ level: 'silent' });
        this.filePath = filePath || './baileys_custom_store.json';
        this.data = {
            chats: {},
            contacts: {},
            messages: {}, // Struktur: { [jid]: { [id]: messageObject } }
            // Tambahkan struktur lain jika diperlukan
        };
        this.loadFromFile();
    }

    loadFromFile() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                this.data = { ...this.data, ...data }; // Gabungkan dengan default
                this.logger.info({ filePath: this.filePath }, 'Custom store loaded from file');
            } else {
                this.logger.info({ filePath: this.filePath }, 'Custom store file not found, starting fresh');
            }
        } catch (err) {
            this.logger.error({ err, filePath: this.filePath }, 'Failed to load custom store from file');
            // Jika file korup, mulai dengan data kosong
            this.data = {
                chats: {},
                contacts: {},
                messages: {},
            };
        }
    }

    writeToFile() {
        try {
            // Tulis ke file sementara dulu, lalu ganti nama, untuk menghindari kerusakan file jika proses terputus
            const tempPath = this.filePath + '.tmp';
            fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2)); // Pretty print
            fs.renameSync(tempPath, this.filePath);
            // this.logger.debug({ filePath: this.filePath }, 'Custom store written to file');
        } catch (err) {
            this.logger.error({ err, filePath: this.filePath }, 'Failed to write custom store to file');
        }
    }

    // Metode untuk mengikat event emitter Baileys
    bind(ev) {
        ev.on('connection.update', update => {
             // Opsional: Log update koneksi jika diperlukan
             // this.logger.debug({ update }, 'Connection update received');
        });

        ev.on('chats.set', ({ chats }) => {
            // this.logger.debug(`Processing chats.set with ${chats.length} chats`);
            for (const chat of chats) {
                if (chat.id) {
                    this.data.chats[chat.id] = chat;
                }
            }
            this.writeToFile(); // Simpan setelah update batch
        });

        ev.on('chats.upsert', (chats) => {
            // this.logger.debug(`Processing chats.upsert with ${chats.length} chats`);
            for (const chat of chats) {
                if (chat.id) {
                    this.data.chats[chat.id] = chat;
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        ev.on('chats.update', (updates) => {
            // this.logger.debug(`Processing chats.update with ${updates.length} updates`);
            for (const update of updates) {
                if (update.id) {
                    const existingChat = this.data.chats[update.id] || {};
                    this.data.chats[update.id] = { ...existingChat, ...update };
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        ev.on('chats.delete', (ids) => {
            // this.logger.debug(`Processing chats.delete with ${ids.length} ids`);
            for (const id of ids) {
                delete this.data.chats[id];
            }
            this.writeToFile();
        });

        ev.on('contacts.upsert', (contacts) => {
            // this.logger.debug(`Processing contacts.upsert with ${contacts.length} contacts`);
            for (const contact of contacts) {
                if (contact.id) {
                    this.data.contacts[contact.id] = contact;
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        ev.on('contacts.update', (updates) => {
            // this.logger.debug(`Processing contacts.update with ${updates.length} updates`);
            for (const update of updates) {
                if (update.id) {
                    const existingContact = this.data.contacts[update.id] || {};
                    this.data.contacts[update.id] = { ...existingContact, ...update };
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        ev.on('messages.upsert', ({ messages, type }) => {
            // this.logger.debug(`Processing messages.upsert with ${messages.length} messages, type: ${type}`);
            if (type !== 'notify') {
                // Hanya simpan pesan 'notify' (pesan baru yang diterima)
                // Anda bisa menyesuaikan logika ini
                return;
            }
            for (const msg of messages) {
                if (msg.key && msg.key.remoteJid && msg.key.id) {
                    const jid = msg.key.remoteJid;
                    const id = msg.key.id;
                    if (!this.data.messages[jid]) {
                        this.data.messages[jid] = {};
                    }
                    // Simpan pesan
                    this.data.messages[jid][id] = msg;
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        ev.on('messages.update', (updates) => {
            // this.logger.debug(`Processing messages.update with ${updates.length} updates`);
            for (const update of updates) {
                if (update.key && update.key.remoteJid && update.key.id) {
                    const jid = update.key.remoteJid;
                    const id = update.key.id;
                    if (this.data.messages[jid] && this.data.messages[jid][id]) {
                        // Update pesan yang ada
                        // Asumsi update.update berisi field yang diubah, atau update berisi key dan update
                        this.data.messages[jid][id] = {
                            ...this.data.messages[jid][id],
                            ...(update.update || update) // Sesuaikan dengan struktur event Baileys
                        };
                    }
                }
            }
            // this.writeToFile(); // Bisa ditunda untuk performa
        });

        // Tambahkan listener untuk event lain jika diperlukan (messages.delete, creds.update, dll.)
        // ev.on('creds.update', ...);
        // ev.on('messages.delete', ...);

        // Simpan secara berkala (opsional, bisa juga menggunakan setInterval di index.js)
        // const saveInterval = setInterval(() => this.writeToFile(), 10_000);
        // Simpan referensi interval jika perlu dihentikan nanti
        // this.saveInterval = saveInterval;
    }

    // Metode yang dibutuhkan oleh Baileys untuk fitur retry & poll decryption
    /**
     * @param {string} jid - Remote JID
     * @param {string} id - Message ID
     * @returns {Promise<import("@whiskeysockets/baileys").WAMessage | undefined>}
     */
    async loadMessage(jid, id) {
        try {
            // this.logger.debug(`Loading message ${id} for jid ${jid}`);
            return this.data.messages[jid]?.[id];
        } catch (err) {
            this.logger.error({ err, jid, id }, 'Error loading message from custom store');
            return undefined;
        }
    }

    // Anda bisa menambahkan metode lain untuk mengakses data store jika diperlukan
    // getChats() { return this.data.chats; }
    // getContacts() { return this.data.contacts; }
    // getMessage(jid, id) { return this.data.messages[jid]?.[id]; } // Alias untuk loadMessage
}

module.exports = CustomFileStore;
