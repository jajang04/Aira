// File: games/evil-cultivator.js
// Game Evil Cultivator untuk Aira WhatsApp Bot

// --- PERUBAHAN: Impor events ---
const EventEmitter = require('events');
// --- AKHIR PERUBAHAN ---

class EvilCultivatorGame extends EventEmitter { // --- PERUBAHAN: Extends EventEmitter ---
    constructor() {
        super(); // --- PERUBAHAN: Panggil constructor parent ---
        this.games = new Map();
        this.minPlayers = 1; // Untuk testing
        this.maxPlayers = 20;

        // Updated role names dengan nuansa lebih fantasy
        this.roles = {
            'evil_cultivator': {
                name: 'Shadow Cultivator',
                emoji: '🧛‍♂️',
                description: 'Menyerap qi para cultivator lain',
                team: 'evil',
                ability: 'Bunuh satu cultivator setiap malam'
            },
            'sect_master': {
                name: 'Sect Leader',
                emoji: '🏯',
                description: 'Pemimpin sekte jahat',
                team: 'evil',
                ability: 'Bunuh 2 orang dalam satu malam'
            },
            'righteous_cultivator': {
                name: 'Mortal',
                emoji: '⚔️',
                description: 'Cultivator biasa tanpa kekuatan spesial',
                team: 'good',
                ability: 'Mortal biasa tanpa kekuatan spesial'
            },
            'divination_master': {
                name: 'Fate Seeker',
                emoji: '🔮',
                description: 'Bisa melihat takdir seseorang',
                team: 'good',
                ability: 'Reveal takdir satu pemain setiap malam'
            },
            'protector': {
                name: 'Divine Protector',
                emoji: '🛡️',
                description: 'Melindungi cultivator dari serangan',
                team: 'good',
                ability: 'Lindungi satu pemain setiap malam'
            },
            'alchemy_master': {
                name: 'Immortal Alchemist',
                emoji: '🧪',
                description: 'Bisa menyelamatkan orang yang terbunuh',
                team: 'good',
                ability: 'Hidupkan kembali satu pemain yang terbunuh'
            }
        };
    }

    // Helper untuk menemukan game berdasarkan ID atau nama pemain
    findGameByPlayerFlexible(identifier) { // identifier bisa playerId atau playerName
        console.log(`[DEBUG] findGameByPlayerFlexible called with identifier: '${identifier}'`);

        // 1. Coba cari langsung berdasarkan groupId (jika identifier adalah groupId)
        if (this.games.has(identifier)) {
            console.log(`[DEBUG] Found game directly by groupId: ${identifier}`);
            return { game: this.games.get(identifier), groupId: identifier, player: null };
        }

        // 2. Cari pemain dalam semua game aktif
        console.log("[DEBUG] Searching for player by NAME in all games...");
        for (let [groupId, game] of this.games) {
            if (game.status === 'active') { // Hanya cari di game aktif
                console.log(`[DEBUG] Checking active game in group: ${groupId}`);
                for (let [playerId, player] of game.players) {
                    console.log(`[DEBUG] Comparing with player name: '${player.name}' (ID: ${playerId})`);

                    // UTAMAKAN: Cocokkan berdasarkan nama
                    if (player.name === identifier) {
                        console.log(`[DEBUG] Player FOUND by NAME: '${identifier}' in group ${groupId}`);
                        return { game, groupId, player };
                    }

                    // BACKUP: Cocokkan berdasarkan ID lengkap (jika identifier adalah ID)
                    // Tapi kemungkinan besar tidak akan cocok karena format berbeda
                    if (playerId === identifier) {
                        console.log(`[DEBUG] Player FOUND by full ID: '${identifier}' in group ${groupId}`);
                        return { game, groupId, player };
                    }
                }
            } else {
                console.log(`[DEBUG] Skipping inactive game in group: ${groupId} (Status: ${game.status})`);
            }
        }

        // 3. Tidak ditemukan
        console.log("[DEBUG] Player NOT FOUND in any active game.");
        return { game: null, groupId: null, player: null };
    }

    // Helper untuk mendapatkan pemain hidup
    getAlivePlayers(game) {
        return Array.from(game.players.values()).filter(player => !player.isDead);
    }

    // Helper untuk mendapatkan pemain hidup berdasarkan ID
    getAlivePlayerById(game, playerId) {
        const player = game.players.get(playerId);
        return player && !player.isDead ? player : null;
    }

    // Command: aira start game
    createGame(groupId, playerName, playerId) {
        if (this.games.has(groupId)) {
            return {
                success: false,
                message: '⚔️ Pertarungan sudah dimulai di grup ini!'
            };
        }

        const game = {
            status: 'active', // active, ended
            phase: 'waiting', // waiting, night, day, voting
            day: 1,
            night: 1,
            players: new Map(), // Map(playerId -> playerObject)
            deadPlayers: new Set(),
            actions: {
                kills: [], // Untuk tracking korban malam
                protections: new Map(), // Map(targetId -> protectorId)
                scrys: new Map(), // Map(targetId -> seerId)
                skips: new Set(), // Untuk tracking skip
                skippedKills: new Set(), // Untuk tracking skip
                actedPlayers: new Set() // Track semua pemain yang sudah beraksi
            },
            revivedPlayers: new Set(),
            host: { name: playerName, id: playerId },
            messages: [],
            groupId: groupId, // Simpan groupId untuk referensi
            playerOrder: [], // Untuk menjaga urutan pemain tetap
            accusations: new Map(), // Map(accuserId -> targetId)
            votes: new Map(), // Map(voterId -> targetId)
            // --- PERUBAHAN ---
            // Hapus nightTimer, dayTimer, pendingTimeoutMessage, timeoutOccurred dari sini
            // Karena kita akan menggunakan event emitter dan closure untuk timer
            // --- AKHIR PERUBAHAN ---
        };

        this.addPlayer(game, playerName, playerId);
        this.games.set(groupId, game);

        return {
            success: true,
            message: `🏯 *Pertarungan Cultivation Dimulai!*\n` +
                `👤 Host: ${playerName}\n` +
                `🎯 Ketik *aira join game* untuk bergabung\n` +
                `🎮 Minimal ${this.minPlayers} pemain untuk memulai`
        };
    }

    // Command: aira join game
    joinGame(groupId, playerName, playerId) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'waiting') {
            return {
                success: false,
                message: '⚔️ Pertarungan sudah dimulai!'
            };
        }

        if (game.players.size >= this.maxPlayers) {
            return {
                success: false,
                message: `🏯 Maksimal ${this.maxPlayers} cultivator dalam satu pertarungan!`
            };
        }

        if (this.addPlayer(game, playerName, playerId)) {
            const playerCount = game.players.size;
            let message = `🏯 *${playerName} telah bergabung dalam pertarungan!*\n` +
                `👥 Jumlah cultivator: ${playerCount}/${this.maxPlayers}`;
            if (playerCount >= this.minPlayers) {
                message += `\n🎯 Ketik *aira begin game* untuk memulai pertarungan!`;
            }
            return {
                success: true,
                message: message
            };
        } else {
            return {
                success: false,
                message: '⚔️ Kamu sudah bergabung dalam pertarungan!'
            };
        }
    }

    // Helper untuk menambah pemain
    addPlayer(game, playerName, playerId) {
        if (game.players.has(playerId)) {
            // Cek duplikasi berdasarkan ID dulu
            return false;
        }
        // Cek duplikasi berdasarkan nama (lebih longgar, bisa ditambahkan jika perlu)
        // const existingPlayer = Array.from(game.players.values()).find(p => p.name === playerName);
        // if (existingPlayer) return false;

        const player = {
            id: playerId,
            name: playerName, // Simpan nama
            role: null,
            isDead: false,
            isProtected: false,
            votes: 0 // Untuk voting
        };

        game.players.set(playerId, player);
        game.playerOrder.push(playerId); // Tambahkan ke urutan
        return true;
    }

    // Command: aira begin game
    startBattle(groupId, playerId, client) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.players.size < this.minPlayers) {
            return {
                success: false,
                message: `🏯 Minimal ${this.minPlayers} cultivator untuk memulai pertarungan!`
            };
        }

        if (game.host.id !== playerId) {
            return {
                success: false,
                message: '⚔️ Hanya host yang bisa memulai pertarungan!'
            };
        }

        // Assign roles
        this.assignRoles(game);

        // Kirim role ke masing-masing pemain
        this.sendRolesToPlayers(client, game);

        // Mulai malam pertama
        game.phase = 'night';
        // --- PERUBAHAN ---
        // Mulai timer malam
        this.startNightTimer(game, groupId);
        // --- AKHIR PERUBAHAN ---
        const nightMessage = this.getNightPhaseMessage(game);

        return {
            success: true,
            message: `🏯 *Pertarungan Dimulai!* 🏯\n${nightMessage}`
        };
    }

    // Fungsi untuk assign roles berdasarkan jumlah pemain
    assignRoles(game) {
        const playerIds = Array.from(game.players.keys());
        const playerCount = playerIds.length;
        let roleAssignment = [];

        // Assign roles berdasarkan jumlah pemain
        if (playerCount <= 3) {
            // 2-3 pemain: 1 Shadow Cultivator
            roleAssignment = ['evil_cultivator'];
            const remaining = playerCount - 1;
            for (let i = 0; i < remaining; i++) {
                roleAssignment.push('righteous_cultivator');
            }
        } else if (playerCount <= 5) {
            // 4-5 pemain: 1 Shadow Cultivator
            roleAssignment = ['evil_cultivator'];
            const remaining = playerCount - 1;
            for (let i = 0; i < remaining; i++) {
                roleAssignment.push('righteous_cultivator');
            }
        } else if (playerCount <= 10) {
            // 6-10 pemain: 2 Shadow Cultivators
            roleAssignment = ['evil_cultivator', 'evil_cultivator'];
            const remaining = playerCount - 2;
            for (let i = 0; i < remaining; i++) {
                roleAssignment.push('righteous_cultivator');
            }
        } else {
            // Lebih dari 10 pemain: 2 Shadow Cultivators + 1 Sect Leader
            roleAssignment = ['evil_cultivator', 'evil_cultivator', 'sect_master'];
            const remaining = playerCount - 3;
            for (let i = 0; i < remaining; i++) {
                roleAssignment.push('righteous_cultivator');
            }
        }

        // Tambahkan role spesial good player (maksimal 1 dari setiap role)
        const specialRoles = ['divination_master', 'protector', 'alchemy_master'];
        let specialRoleIndex = 0;

        // Ganti beberapa righteous cultivator dengan role spesial
        for (let i = 0; i < roleAssignment.length && specialRoleIndex < specialRoles.length; i++) {
            if (roleAssignment[i] === 'righteous_cultivator') {
                roleAssignment[i] = specialRoles[specialRoleIndex];
                specialRoleIndex++;
            }
        }

        // Shuffle player IDs
        this.shuffleArray(playerIds);

        // Assign roles to players
        playerIds.forEach((playerId, index) => {
            const roleKey = roleAssignment[index] || 'righteous_cultivator';
            const player = game.players.get(playerId);
            player.role = roleKey;
        });
    }

    // Fungsi untuk kirim role ke masing-masing pemain dengan daftar pemain
    async sendRolesToPlayers(client, game) {
        const alivePlayers = this.getAlivePlayers(game);
        const evilPlayers = alivePlayers.filter(p => this.roles[p.role].team === 'evil');
        const evilPlayerNames = evilPlayers.map(p => p.name).join(', ');

        // Buat daftar pemain untuk ditampilkan
        let playerList = `📋 *Daftar Pemain:*\n`;
        game.playerOrder.forEach((playerId, index) => {
            const player = game.players.get(playerId);
            if (player) {
                const status = player.isDead ? '💀' : '🟢';
                playerList += `${index + 1}. ${player.name} ${status}\n`;
            }
        });

        // Kirim role dan daftar pemain ke setiap pemain
        for (let [playerId, player] of game.players) {
            const roleInfo = this.roles[player.role];
            let roleMessage = `🏯 *Selamat Datang di Pertarungan Cultivation, ${player.name}!*\n\n`;
            roleMessage += `🎭 *Role Kamu:*\n`;
            roleMessage += `${roleInfo.emoji} ${roleInfo.name}\n`;
            roleMessage += `📝 ${roleInfo.description}\n`;
            roleMessage += `⚡ ${roleInfo.ability}\n\n`;

            // Tambahkan info tim
            if (roleInfo.team === 'evil') {
                roleMessage += `🩸 *Rekan Setim:*\n`;
                roleMessage += `${evilPlayerNames}\n\n`;
            }

            // Tambahkan command umum
            roleMessage += `📜 *Command Umum:*\n`;
            roleMessage += `*aira players* - Lihat daftar semua pemain dan nomor urutnya\n`;
            roleMessage += `*aira game status* - Lihat status permainan\n`;
            roleMessage += `*aira roles* - Lihat kembali role kamu (di private chat)\n\n`;

            // Tambahkan command khusus berdasarkan role
            if (player.role === 'evil_cultivator') {
                roleMessage += `🎯 *Command Khusus:*\n`;
                roleMessage += `*aira kill <nomor>* - Bunuh satu cultivator (di private chat)\n`;
                roleMessage += `*aira skip* - Tidak membunuh siapa pun malam ini (di private chat)\n`;
            } else if (player.role === 'sect_master') {
                roleMessage += `🎯 *Command Khusus:*\n`;
                roleMessage += `*aira kill <nomor1> <nomor2>* - Bunuh dua cultivator (di private chat)\n`;
                roleMessage += `*aira skip* - Tidak membunuh siapa pun malam ini (di private chat)\n`;
            } else if (player.role === 'divination_master') {
                roleMessage += `🎯 *Command Khusus:*\n`;
                roleMessage += `*aira scry <nomor>* - Lihat takdir satu pemain (di private chat)\n`;
            } else if (player.role === 'protector') {
                roleMessage += `🎯 *Command Khusus:*\n`;
                roleMessage += `*aira protect <nomor>* - Lindungi satu pemain (di private chat)\n`;
            } else if (player.role === 'alchemy_master') {
                roleMessage += `🎯 *Command Khusus:*\n`;
                roleMessage += `*aira revive <nomor>* - Hidupkan kembali satu pemain (di private chat)\n`;
            }

            roleMessage += `\n🤫 JANGAN BERITAHU SIAPAPUN ROLE KAMU!\n`;
            roleMessage += `<tool_call>kan kekuatanmu saat malam tiba...\n\n`;
            roleMessage += playerList;

            try {
                if (client && typeof client.sendMessage === 'function') {
                    await client.sendMessage(`${player.id}`, { text: roleMessage });
                }
            } catch (error) {
                console.log(`[EVIL CULTIVATOR] Gagal kirim role ke ${player.name}:`, error.message);
            }
        }
    }

    // Helper untuk shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getNightPhaseMessage(game) {
        let message = `🌙 *Malam Hari ke-${game.night}*\n`;
        message += `🏯 Para cultivator memasuki meditasi mendalam\n`;
        // Tidak menampilkan role di pesan publik!
        message += `🎯 *Instruksi untuk Role Khusus:*\n`;
        message += `🧛‍♂️ Shadow Cultivators: *aira kill <nomor>* atau *aira skip* (di private chat)\n`;
        message += `🏯 Sect Leaders: *aira kill <nomor1> <nomor2>* atau *aira skip* (di private chat)\n`;
        message += `🔮 Fate Seekers: *aira scry <nomor>* (di private chat)\n`;
        message += `🛡️ Divine Protectors: *aira protect <nomor>* (di private chat)\n`;
        message += `🧪 Immortal Alchemists: *aira revive <nomor>* (di private chat)\n`;
        // --- PERUBAHAN ---
        // Sesuaikan teks dengan durasi timer yang sebenarnya (3 menit)
        message += `\n🌅 *Aksi malam akan ditutup otomatis dalam 3 menit*`;
        // --- AKHIR PERUBAHAN ---
        return message;
    }

    // --- TAMBAHAN FUNGSI UNTUK TIMER ---
    // Fungsi untuk memulai timer malam
    startNightTimer(game, groupId) {
        // Batalkan timer sebelumnya jika ada (keamanan)
        this.clearNightTimer(game);

        // Tentukan durasi timer (dalam milidetik). Contoh: 3 menit = 180.000 ms
        const DURATION_MS = 3 * 60 * 1000; // 3 menit

        console.log(`[TIMER] Starting night timer for group ${groupId} (${DURATION_MS}ms)`);

        // Gunakan arrow function agar `this` mengacu ke instance kelas dengan benar
        // Ketika timer habis, panggil handleNightTimeout
        const timerId = setTimeout(() => {
            console.log(`[TIMER] Night timer expired for group ${groupId}. Proceeding to day.`);
            this.handleNightTimeout(groupId);
            // Setelah timer habis, bersihkan referensi pembatalnya
            if (game._cancelNightTimer) {
                delete game._cancelNightTimer;
            }
        }, DURATION_MS);

        // Simpan fungsi untuk membatalkan timer ini di objek game
        // Ini menggunakan closure untuk menyimpan `timerId`
        game._cancelNightTimer = () => {
            console.log(`[TIMER] Clearing night timer ${timerId} for group ${groupId}.`);
            clearTimeout(timerId);
            // Bersihkan referensi setelah dibatalkan
            delete game._cancelNightTimer;
        };
    }

    // Fungsi untuk membersihkan/membatalkan timer malam
    clearNightTimer(game) {
        // Jika ada fungsi pembatal yang disimpan, panggil fungsi tersebut
        if (typeof game._cancelNightTimer === 'function') {
            game._cancelNightTimer();
            // Referensi `game._cancelNightTimer` sudah dihapus di dalam fungsi itu sendiri
        } else {
            // Tidak ada timer aktif untuk dibatalkan
            console.log(`[TIMER] No active night timer found to clear.`);
        }
    }

    // Fungsi yang dipanggil saat timer malam habis
    handleNightTimeout(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            console.log(`[TIMER ERROR] Game not found for group ${groupId} on timeout.`);
            return;
        }

        // Pastikan game masih dalam fase 'night'
        if (game.phase !== 'night') {
            console.log(`[TIMER] Game in group ${groupId} is not in 'night' phase anymore. Ignoring timeout.`);
            return;
        }

        // Bersihkan timer (sudah selesai)
        this.clearNightTimer(game);

        // Buat pesan bahwa waktu malam telah habis
        let timeoutMessage = `⏰ *Waktu malam telah habis!*\n`;
        timeoutMessage += `🏯 Para cultivator dengan kekuatan khusus tidak sempat bertindak.\n`;

        // Panggil proceedToDay dengan pesan timeout
        const dayResult = this.proceedToDay(game, groupId, timeoutMessage);
        
        // Emit event untuk mengirim pesan ke grup
        console.log(`[TIMER] Emitting 'nightTimeout' event for group ${groupId}.`);
        this.emit('nightTimeout', { groupId: groupId, message: dayResult.message });
    }
    
    // Fungsi untuk memulai timer siang
    startDayTimer(game, groupId) {
        // Batalkan timer sebelumnya jika ada (keamanan)
        this.clearDayTimer(game);

        // Tentukan durasi timer (dalam milidetik). Contoh: 7 menit = 420.000 ms
        const DURATION_MS = 7 * 60 * 1000; // 7 menit

        console.log(`[DAY TIMER] Starting day timer for group ${groupId} (${DURATION_MS}ms)`);

        // Gunakan arrow function agar `this` mengacu ke instance kelas dengan benar
        const timerId = setTimeout(() => {
            console.log(`[DAY TIMER] Day timer expired for group ${groupId}. Proceeding to automatic action.`);
            this.handleDayTimeout(groupId);
            // Setelah timer habis, bersihkan referensi pembatalnya
            if (game._cancelDayTimer) {
                delete game._cancelDayTimer;
            }
        }, DURATION_MS);

        // Simpan fungsi untuk membatalkan timer ini di objek game
        game._cancelDayTimer = () => {
            console.log(`[DAY TIMER] Clearing day timer ${timerId} for group ${groupId}.`);
            clearTimeout(timerId);
            delete game._cancelDayTimer;
        };
    }

    // Fungsi untuk membersihkan/membatalkan timer siang
    clearDayTimer(game) {
        if (typeof game._cancelDayTimer === 'function') {
            game._cancelDayTimer();
        } else {
            console.log(`[DAY TIMER] No active day timer found to clear.`);
        }
    }

    // Fungsi yang dipanggil saat timer siang habis
    handleDayTimeout(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            console.log(`[DAY TIMER ERROR] Game not found for group ${groupId} on timeout.`);
            return;
        }

        if (game.phase !== 'day') {
            console.log(`[DAY TIMER] Game in group ${groupId} is not in 'day' phase anymore. Ignoring timeout.`);
            return;
        }

        this.clearDayTimer(game);

        const alivePlayers = this.getAlivePlayers(game);

        if (alivePlayers.length < 2) {
            console.log(`[DAY TIMER] Not enough alive players (${alivePlayers.length}) for voting. Proceeding to next night.`);
            game.accusations.clear();
            game.phase = 'night';
            game.night++;
            this.startNightTimer(game, groupId);
            const nightMessage = this.getNightPhaseMessage(game);
            this.emit('dayPhaseTimeout', { groupId: groupId, message: `⏰ *Waktu diskusi siang telah habis!*\nTidak cukup pemain untuk voting.\n${nightMessage}` });
            return;
        }

        console.log(`[DAY TIMER] Enough alive players (${alivePlayers.length}). Initiating automatic voting.`);

        game.accusations.clear();

        // Tuduhkan 2 pemain hidup pertama secara otomatis (misalnya, oleh host)
        const hostId = game.host.id;
        let accuserId = hostId;
        if (!this.getAlivePlayerById(game, hostId)) {
            accuserId = alivePlayers[0]?.id || hostId;
        }

        const maxAccused = Math.min(2, alivePlayers.length);
        for (let i = 0; i < maxAccused; i++) {
            const autoAccuseKey = `auto_${accuserId}_${i}`;
            game.accusations.set(autoAccuseKey, alivePlayers[i].id);
        }

        if (game.accusations.size >= 2) {
            console.log(`[DAY TIMER] Emitting 'dayTimeoutTriggerVoting' event for group ${groupId}.`);
            this.emit('dayTimeoutTriggerVoting', { groupId: groupId, game: game });
        } else {
            console.log(`[DAY TIMER] Still not enough valid accusations (${game.accusations.size}) after auto-accuse. Proceeding to next night.`);
            game.accusations.clear();
            game.phase = 'night';
            game.night++;
            this.startNightTimer(game, groupId);
            const nightMessage = this.getNightPhaseMessage(game);
            this.emit('dayPhaseTimeout', { groupId: groupId, message: `⏰ *Waktu diskusi siang telah habis!*\nTerjadi kesalahan dalam pembuatan voting otomatis.\n${nightMessage}` });
        }
    }
    // --- AKHIR TAMBAHAN FUNGSI UNTUK TIMER ---

    // Command: aira kill <nomor>
    killPlayer(groupId, killerId, targetNumbers) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'night') {
            return {
                success: false,
                message: '⚔️ Aksi hanya bisa dilakukan saat malam!'
            };
        }

        const killer = game.players.get(killerId);
        if (!killer || killer.isDead) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan aksi karena sudah mati!'
            };
        }

        if (killer.role !== 'evil_cultivator' && killer.role !== 'sect_master') {
            return {
                success: false,
                message: '⚔️ Kamu tidak memiliki kekuatan untuk membunuh!'
            };
        }

        if (game.actions.actedPlayers.has(killerId)) {
            return {
                success: false,
                message: '⚔️ Kamu sudah melakukan aksi malam ini!'
            };
        }

        const targets = [];
        for (const targetNumber of targetNumbers) {
            const targetIndex = parseInt(targetNumber) - 1;
            const allPlayers = Array.from(game.players.values());
            if (targetIndex < 0 || targetIndex >= allPlayers.length) {
                return {
                    success: false,
                    message: `⚔️ Nomor target ${targetNumber} tidak valid!`
                };
            }

            const target = allPlayers[targetIndex];
            if (target.isDead) {
                return {
                    success: false,
                    message: `⚔️ Tidak bisa membunuh ${target.name}, dia sudah mati!`
                };
            }

            if (target.id === killerId && killer.role === 'evil_cultivator') {
                return {
                    success: false,
                    message: '⚔️ Shadow Cultivator tidak bisa membunuh diri sendiri!'
                };
            }

            // Sect Leader bisa bunuh diri sendiri
            targets.push(target);
        }

        // Validasi jumlah target
        if (killer.role === 'evil_cultivator' && targets.length !== 1) {
            return {
                success: false,
                message: '⚔️ Shadow Cultivator harus membunuh 1 orang!'
            };
        }

        if (killer.role === 'sect_master' && targets.length !== 2) {
            return {
                success: false,
                message: '⚔️ Sect Leader harus membunuh 2 orang!'
            };
        }

        // Eksekusi pembunuhan
        const killedPlayers = [];
        for (const target of targets) {
            // Cek proteksi
            if (game.actions.protections.has(target.id)) {
                const protectorId = game.actions.protections.get(target.id);
                const protector = game.players.get(protectorId);
                if (protector && !protector.isDead) {
                    // Proteksi berhasil
                    killedPlayers.push({
                        player: target,
                        protected: true,
                        protector: protector
                    });
                    continue;
                }
            }

            // Bunuh pemain
            target.isDead = true;
            game.deadPlayers.add(target.id);
            game.actions.kills.push(target.id);
            killedPlayers.push({
                player: target,
                protected: false
            });
        }

        // Tandai killer sudah beraksi
        game.actions.actedPlayers.add(killerId);

        // Buat pesan hasil
        let message = '';
        if (killedPlayers.length === 0) {
            message = `🕊️ Tidak ada yang terbunuh malam ini.`;
        } else {
            message = `⚔️ *Korban Malam Ini:*\n`;
            for (const killed of killedPlayers) {
                if (killed.protected) {
                    message += `🛡️ ${killed.player.name} berhasil dilindungi oleh ${killed.protector.name}!\n`;
                } else {
                    message += `💀 ${killed.player.name} telah gugur!\n`;
                }
            }
        }

        // Cek kondisi kemenangan
        const winCondition = this.checkWinCondition(game);
        if (winCondition.winner) {
            // Bangun pesan akhir penuh: korban + pesan menang + reveal
            let finalMessage = message; // 'message' sudah berisi info korban
            finalMessage += `\n${winCondition.message}`;
            finalMessage += `\n${this.getFinalRevealMessage(game)}`;
            // Tandai game berakhir
            game.status = 'ended';
            // Hapus game dari Map setelah berakhir
            this.games.delete(groupId);
            // Kembalikan hasil dengan flag gameOver
            return {
                success: true,
                message: finalMessage,
                gameOver: true
            };
        }

        // --- PERUBAHAN ---
        // Cek apakah semua pemain sudah beraksi
        if (this.checkAllPlayersActed(game)) {
            // Jika ya, batalkan timer
            this.clearNightTimer(game);
            // Bersihkan timer siang juga (jaga-jaga)
            this.clearDayTimer(game);
            console.log(`[ACTION] All players acted in group ${groupId}. Clearing timer and proceeding to day.`);
            // Lanjut ke fase siang
            return this.proceedToDay(game, groupId, message);
        }
        // --- AKHIR PERUBAHAN ---

        return {
            success: true,
            message: message
        };
    }

// Command: aira skip (Versi Diperbaiki)
skipKill(groupId, playerId) {
    const game = this.games.get(groupId);
    if (!game) {
        return {
            success: false,
            message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
        };
    }

    if (game.phase !== 'night') {
        return {
            success: false,
            message: '⚔️ Aksi hanya bisa dilakukan saat malam!'
        };
    }

    const player = game.players.get(playerId);
    if (!player || player.isDead) {
        return {
            success: false,
            message: '⚔️ Kamu tidak bisa melakukan aksi karena sudah mati!'
        };
    }

    if (player.role !== 'evil_cultivator' && player.role !== 'sect_master') {
        return {
            success: false,
            message: '⚔️ Kamu tidak memiliki kekuatan untuk membunuh!'
        };
    }

    if (game.actions.actedPlayers.has(playerId)) {
        return {
            success: false,
            message: '⚔️ Kamu sudah melakukan aksi malam ini!'
        };
    }

    game.actions.skippedKills.add(playerId);
    game.actions.actedPlayers.add(playerId);

    // Pesan untuk pemain yang melakukan skip (dikirim ke private chat)
    let privateMessage = `🕊️ ${player.name} memilih untuk tidak membunuh siapa pun malam ini.`;

    // --- PERUBAHAN ---
    // Cek apakah semua pemain sudah beraksi
    if (this.checkAllPlayersActed(game)) {
        // Jika ya, batalkan timer
        this.clearNightTimer(game);
        // Bersihkan timer siang juga (jaga-jaga)
        this.clearDayTimer(game);
        console.log(`[ACTION] All players acted in group ${groupId}. Clearing timer and proceeding to day.`);
        
        // Pesan ringkasan untuk fase siang (bukan pesan pribadi)
        // Bisa dikosongkan atau beri pesan netral
        const summaryMessageForDayPhase = ''; // Atau '_para Shadow Cultivator memilih tidak membunuh siapa pun._'
        
        // Lanjut ke fase siang dengan ringkasan
        const dayResult = this.proceedToDay(game, groupId, summaryMessageForDayPhase);
        
        // Kembalikan pesan untuk private chat dan pesan grup (dari proceedToDay)
        return {
            success: true,
            message: privateMessage, // Pesan untuk private chat
            groupMessage: dayResult.message // Pesan untuk grup (fase siang)
        };
    }
    // --- AKHIR PERUBAHAN ---

    // Jika belum semua beraksi, hanya kirim pesan ke private chat
    return {
        success: true,
        message: privateMessage
    };
}

    // Command: aira protect <nomor>
    protectPlayer(groupId, protectorId, targetNumber) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'night') {
            return {
                success: false,
                message: '⚔️ Aksi hanya bisa dilakukan saat malam!'
            };
        }

        const protector = game.players.get(protectorId);
        if (!protector || protector.isDead) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan aksi karena sudah mati!'
            };
        }

        if (protector.role !== 'protector') {
            return {
                success: false,
                message: '⚔️ Kamu tidak memiliki kekuatan untuk melindungi!'
            };
        }

        if (game.actions.actedPlayers.has(protectorId)) {
            return {
                success: false,
                message: '⚔️ Kamu sudah melakukan aksi malam ini!'
            };
        }

        const targetIndex = parseInt(targetNumber) - 1;
        const allPlayers = Array.from(game.players.values());
        if (targetIndex < 0 || targetIndex >= allPlayers.length) {
            return {
                success: false,
                message: '⚔️ Nomor target tidak valid!'
            };
        }

        const target = allPlayers[targetIndex];
        if (target.isDead) {
            return {
                success: false,
                message: '⚔️ Tidak bisa melindungi pemain yang sudah mati!'
            };
        }

        game.actions.protections.set(target.id, protectorId);
        game.actions.actedPlayers.add(protectorId);

        let message = `🛡️ ${protector.name} memilih untuk melindungi ${target.name} malam ini.`;

        // --- PERUBAHAN ---
        // Cek apakah semua pemain sudah beraksi
        if (this.checkAllPlayersActed(game)) {
            // Jika ya, batalkan timer
            this.clearNightTimer(game);
            // Bersihkan timer siang juga (jaga-jaga)
            this.clearDayTimer(game);
            console.log(`[ACTION] All players acted in group ${groupId}. Clearing timer and proceeding to day.`);
            // Lanjut ke fase siang
            return this.proceedToDay(game, groupId, message);
        }
        // --- AKHIR PERUBAHAN ---

        return {
            success: true,
            message: message
        };
    }

    // Command: aira scry <nomor>
    scryPlayer(groupId, seerId, targetNumber) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'night') {
            return {
                success: false,
                message: '⚔️ Aksi hanya bisa dilakukan saat malam!'
            };
        }

        const seer = game.players.get(seerId);
        if (!seer || seer.isDead) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan aksi karena sudah mati!'
            };
        }

        if (seer.role !== 'divination_master') {
            return {
                success: false,
                message: '⚔️ Kamu tidak memiliki kekuatan untuk melakukan scry!'
            };
        }

        if (game.actions.actedPlayers.has(seerId)) {
            return {
                success: false,
                message: '⚔️ Kamu sudah melakukan aksi malam ini!'
            };
        }

        const targetIndex = parseInt(targetNumber) - 1;
        const allPlayers = Array.from(game.players.values());
        if (targetIndex < 0 || targetIndex >= allPlayers.length) {
            return {
                success: false,
                message: '⚔️ Nomor target tidak valid!'
            };
        }

        const target = allPlayers[targetIndex];
        if (target.isDead) {
            return {
                success: false,
                message: '⚔️ Tidak bisa melakukan scry pada pemain yang sudah mati!'
            };
        }

        const targetRole = this.roles[target.role];
        game.actions.scrys.set(target.id, seerId);
        game.actions.actedPlayers.add(seerId);

        let message = `🔮 ${seer.name} melakukan scry pada ${target.name}.\n`;
        message += `🧩 Takdir ${target.name}: ${targetRole.emoji} ${targetRole.name}\n`;
        message += `🪪 Tim: ${targetRole.team === 'evil' ? 'Kegelapan' : 'Kebenaran'}`;

        // --- PERUBAHAN ---
        // Cek apakah semua pemain sudah beraksi
        if (this.checkAllPlayersActed(game)) {
            // Jika ya, batalkan timer
            this.clearNightTimer(game);
            // Bersihkan timer siang juga (jaga-jaga)
            this.clearDayTimer(game);
            console.log(`[ACTION] All players acted in group ${groupId}. Clearing timer and proceeding to day.`);
            
            const dayResult = this.proceedToDay(game, groupId, ''); // Kirim pesan kosong dulu
            
            // Emit event untuk mengirim pesan transisi hari ke grup
            this.emit('nightTimeout', { groupId: groupId, message: dayResult.message });
            
            return {
                success: true,
                message: message,
                private: true,
            };
        }
        // --- AKHIR PERUBAHAN ---

        return {
            success: true,
            message: message,
            private: true
        };
    }

    // Command: aira revive <nomor>
    revivePlayer(groupId, alchemistId, targetNumber) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'night') {
            return {
                success: false,
                message: '⚔️ Aksi hanya bisa dilakukan saat malam!'
            };
        }

        const alchemist = game.players.get(alchemistId);
        if (!alchemist || alchemist.isDead) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan aksi karena sudah mati!'
            };
        }

        if (alchemist.role !== 'alchemy_master') {
            return {
                success: false,
                message: '⚔️ Kamu tidak memiliki kekuatan untuk menghidupkan kembali!'
            };
        }

        if (game.actions.actedPlayers.has(alchemistId)) {
            return {
                success: false,
                message: '⚔️ Kamu sudah melakukan aksi malam ini!'
            };
        }

        const targetIndex = parseInt(targetNumber) - 1;
        const allPlayers = Array.from(game.players.values());
        if (targetIndex < 0 || targetIndex >= allPlayers.length) {
            return {
                success: false,
                message: '⚔️ Nomor target tidak valid!'
            };
        }

        const target = allPlayers[targetIndex];
        if (!target.isDead) {
            return {
                success: false,
                message: '⚔️ Tidak bisa menghidupkan kembali pemain yang masih hidup!'
            };
        }

        if (game.revivedPlayers.has(target.id)) {
            return {
                success: false,
                message: '⚔️ Pemain ini sudah pernah dihidupkan kembali!'
            };
        }

        // Hidupkan kembali pemain
        target.isDead = false;
        game.deadPlayers.delete(target.id);
        game.revivedPlayers.add(target.id);
        game.actions.actedPlayers.add(alchemistId);

        let message = `🧪 ${alchemist.name} berhasil menghidupkan kembali ${target.name}!`;

        // --- PERUBAHAN ---
        // Cek apakah semua pemain sudah beraksi
        if (this.checkAllPlayersActed(game)) {
            // Jika ya, batalkan timer
            this.clearNightTimer(game);
            // Bersihkan timer siang juga (jaga-jaga)
            this.clearDayTimer(game);
            console.log(`[ACTION] All players acted in group ${groupId}. Clearing timer and proceeding to day.`);
            // Lanjut ke fase siang
            return this.proceedToDay(game, groupId, message);
        }
        // --- AKHIR PERUBAHAN ---

        return {
            success: true,
            message: message
        };
    }

    // Helper untuk cek apakah semua pemain sudah beraksi
    checkAllPlayersActed(game) {
        const alivePlayers = this.getAlivePlayers(game);
        // Pemain dengan role khusus yang harus beraksi
        const specialRoles = ['evil_cultivator', 'sect_master', 'protector', 'divination_master', 'alchemy_master'];
        const playersNeedingAction = alivePlayers.filter(p => specialRoles.includes(p.role));

        return playersNeedingAction.every(p => game.actions.actedPlayers.has(p.id));
    }

    // Helper untuk lanjut ke fase siang
    proceedToDay(game, groupId, actionMessage = '') {
        // --- PERUBAHAN ---
        // Bersihkan timer malam saat berpindah ke siang
        this.clearNightTimer(game);
        // --- AKHIR PERUBAHAN ---

        // Reset aksi malam
        game.actions.kills = [];
        game.actions.protections.clear();
        game.actions.scrys.clear();
        game.actions.skips.clear();
        game.actions.skippedKills.clear();
        game.actions.actedPlayers.clear();

        // Tambah hari
        game.day++;
        game.phase = 'day';

        // --- PERUBAHAN ---
        // Mulai timer siang
        this.startDayTimer(game, groupId);
        // --- AKHIR PERUBAHAN ---

        let message = `🌅 *Fase Siang Hari ke-${game.day}*!\n`;
        message += `🏯 Matahari terbit, para cultivator berkumpul\n`;

        if (actionMessage) {
            message += `${actionMessage}\n`;
        }

        if (game.actions.kills.length > 0) {
            message += `⚔️ *Korban Malam Ini:*\n`;
            game.actions.kills.forEach(playerId => {
                const player = game.players.get(playerId);
                if (player) {
                    message += `💀 ${player.name}\n`;
                }
            });
            message += `\n`;
        } else if (game.actions.skippedKills && game.actions.skippedKills.size > 0) {
            message += `🕊️ *Malam yang damai, para Shadow Cultivator memilih tidak membunuh siapa pun*\n`;
        } else {
            message += `🕊️ *Malam yang damai, tidak ada korban*\n`;
        }

        message += this.getPlayerList(game);
        message += `\n`;
        message += `📢 Gunakan *aira accuse <nomor>* untuk menuduh seseorang sebagai Shadow Cultivator!\n`;
        message += `⚖️ Butuh minimal 2 tuduhan untuk memulai voting.`;
        // --- PERUBAHAN ---
        message += `\n\n⏳ *Diskusi akan berakhir otomatis dalam 7 menit.*`;
        // --- AKHIR PERUBAHAN ---

        return {
            success: true,
            message: message
        };
    }

    // Command: aira accuse <nomor>
    accusePlayer(groupId, accuserId, targetNumber) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'day') {
            return {
                success: false,
                message: '⚔️ Tuduhan hanya bisa dilakukan saat siang hari!'
            };
        }

        const accuser = this.getAlivePlayerById(game, accuserId);
        if (!accuser) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan tuduhan karena sudah mati!'
            };
        }

        const targetIndex = parseInt(targetNumber) - 1;
        const allPlayers = Array.from(game.players.values());
        if (targetIndex < 0 || targetIndex >= allPlayers.length) {
            return {
                success: false,
                message: '⚔️ Nomor target tidak valid!'
            };
        }

        const target = allPlayers[targetIndex];
        if (target.isDead) {
            return {
                success: false,
                message: '⚔️ Tidak bisa menuduh pemain yang sudah mati!'
            };
        }

        if (target.id === accuser.id) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa menuduh diri sendiri!'
            };
        }

        game.accusations.set(accuserId, target.id);

        let accusationMessage = `🏯 ${accuser.name} menuduh ${target.name} sebagai Shadow Cultivator!`;
        if (game.accusations.size >= 2) {
            accusationMessage += `\n⚖️ Sudah ada 2 tuduhan! Gunakan *aira vote* untuk memulai voting.`;
        }

        return {
            success: true,
            message: accusationMessage
        };
    }

    // Command: aira vote
    startVoting(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'day') {
            return {
                success: false,
                message: '⚔️ Voting hanya bisa dimulai saat siang hari!'
            };
        }

        if (game.accusations.size < 2) {
            return {
                success: false,
                message: '⚔️ Butuh minimal 2 tuduhan untuk memulai voting!'
            };
        }

        game.phase = 'voting';
        game.votes.clear();
        // Reset vote count for all players
        game.players.forEach(player => {
            player.votes = 0;
        });

        // --- PERUBAHAN ---
        // Bersihkan timer siang saat voting dimulai
        this.clearDayTimer(game);
        // --- AKHIR PERUBAHAN ---

        let message = `⚖️ *Voting Dimulai!*\n`;
        message += `🏯 Para cultivator berkumpul untuk menentukan nasib yang dituduh.\n\n`;

        // Tampilkan daftar tuduhan
        message += `⚔️ *Daftar Tuduhan:*\n`;
        game.accusations.forEach((targetId, accuserId) => {
             // Sembunyikan accuser jika itu dari sistem auto
             if (accuserId.startsWith('auto_')) {
                 const target = game.players.get(targetId);
                 if (target) {
                     message += `🪧 ${target.name} (Ditentukan oleh waktu)\n`;
                 }
             } else {
                 const accuser = game.players.get(accuserId);
                 const target = game.players.get(targetId);
                 if (accuser && target) {
                     message += `🪧 ${accuser.name} menuduh ${target.name}\n`;
                 }
             }
        });

        message += `\n`;
        message += `🗳️ *Cara Voting:*\n`;
        message += `Ketik *aira vote <nomor>* untuk memilih siapa yang akan dieksekusi.\n`;
        message += `Kamu hanya bisa memilih pemain yang dituduh di atas.\n\n`;
        message += this.getPlayerList(game);

        return {
            success: true,
            message: message
        };
    }

    // Command: aira vote <nomor>
    votePlayer(groupId, voterId, targetNumber) {
        const game = this.games.get(groupId);
        if (!game) {
            return {
                success: false,
                message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!'
            };
        }

        if (game.phase !== 'voting') {
            return {
                success: false,
                message: '⚔️ Voting belum dimulai!'
            };
        }

        const voter = this.getAlivePlayerById(game, voterId);
        if (!voter) {
            return {
                success: false,
                message: '⚔️ Kamu tidak bisa melakukan vote karena sudah mati!'
            };
        }

        // Cek apakah pemilih sudah vote
        if (game.votes.has(voterId)) {
            return {
                success: false,
                message: '⚔️ Kamu sudah memberikan vote!'
            };
        }

        const targetIndex = parseInt(targetNumber) - 1;
        const allPlayers = Array.from(game.players.values());
        if (targetIndex < 0 || targetIndex >= allPlayers.length) {
            return {
                success: false,
                message: '⚔️ Nomor target tidak valid!'
            };
        }

        const targetPlayer = allPlayers[targetIndex];
        if (targetPlayer.isDead) {
            return {
                success: false,
                message: '⚔️ Tidak bisa vote untuk pemain yang sudah mati!'
            };
        }

        // Cek apakah target ada dalam daftar yang dituduh
        const accusedPlayers = new Set();
        game.accusations.forEach(targetId => {
            accusedPlayers.add(targetId);
        });

        if (!accusedPlayers.has(targetPlayer.id)) {
            return {
                success: false,
                message: '⚔️ Kamu hanya bisa vote untuk pemain yang sedang dituduh!'
            };
        }

        // Simpan vote
        game.votes.set(voterId, targetPlayer.id);

        let message = `✅ ${voter.name} telah memberikan vote untuk ${targetPlayer.name}.`;

        return {
            success: true,
            message: message
            // Penanganan apakah semua sudah vote dilakukan di aira.js
            // Karena kita tidak ingin getVotingResults dipanggil dari sini
        };
    }

    // Fungsi untuk mendapatkan hasil voting (dipanggil dari aira.js setelah semua vote)
    getVotingResults(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            return { success: false, message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!' };
        }
        if (game.phase !== 'voting') {
            return { success: false, message: '⚔️ Voting belum dimulai!' };
        }

        const accusedPlayers = new Set();
        game.accusations.forEach(targetId => {
            accusedPlayers.add(targetId);
        });

        // Gunakan urutan tetap
        const allPlayers = game.playerOrder.map(id => game.players.get(id)).filter(p => p);
        const accusedList = allPlayers.filter(player => accusedPlayers.has(player.id));

        if (accusedList.length === 0) {
             // Mungkin kembali ke siang hari atau tampilkan pesan kesalahan?
             game.phase = 'day'; // Atau tangani sesuai logika permainan
             return { success: false, message: '⚖️ Tidak ada pemain yang valid untuk dieksekusi. Voting dibatalkan.' };
        }

        // Hitung vote untuk setiap pemain yang dituduh
        // Reset dulu vote mereka
        accusedList.forEach(player => {
            if (player) player.votes = 0;
        });

        // Hitung ulang berdasarkan game.votes
        game.votes.forEach((targetId, voterId) => {
            const targetPlayer = game.players.get(targetId);
            if (targetPlayer && accusedPlayers.has(targetId)) {
                 targetPlayer.votes = (targetPlayer.votes || 0) + 1;
            }
        });

        const maxVotes = Math.max(...accusedList.map(player => {
            return player ? (player.votes || 0) : 0;
        }));

        const executedPlayers = accusedList.filter(player => {
            return player && (player.votes || 0) === maxVotes && maxVotes > 0;
        });

        let message = `⚖️ *Hasil Voting:*\n`;
        accusedList.forEach(player => {
            message += `${player.name}: ${(player.votes || 0)} suara\n`;
        });

        if (executedPlayers.length === 1) {
            const executed = executedPlayers[0];
            executed.isDead = true;
            game.deadPlayers.add(executed.id);
            message += `\n⚔️ ${executed.name} telah dieksekusi!`;

            // Cek kondisi kemenangan
            const winCondition = this.checkWinCondition(game);
            if (winCondition.winner) {
                message += `\n${winCondition.message}`;
                message += `\n${this.getFinalRevealMessage(game)}`;
                game.status = 'ended';
                // Hapus game dari Map setelah berakhir
                this.games.delete(groupId);
                return { success: true, message: message, gameOver: true };
            }
        } else {
            // Tambahkan pengecekan jika tidak ada yang mendapat vote
            if (maxVotes === 0) {
                 message += `\n⚔️ Tidak ada suara yang diberikan! Tidak ada yang dieksekusi.`;
            } else {
                 message += `\n⚔️ Terjadi seri voting! Tidak ada yang dieksekusi.`;
            }
        }

        // Transisi ke malam berikutnya jika tidak ada kemenangan
        if (game.status !== 'ended') { // Hanya transisi jika game belum berakhir
            game.phase = 'night';
            game.night++;
            game.accusations.clear();
            game.votes.clear();
            // --- PERUBAHAN ---
            // Bersihkan timer siang (jaga-jaga)
            this.clearDayTimer(game);
            // Mulai timer malam untuk malam berikutnya
            this.startNightTimer(game, groupId);
            // --- AKHIR PERUBAHAN ---
            // Transisi ke malam berikutnya
            const nightMessage = this.getNightPhaseMessage(game);
            message += `\n${nightMessage}`;
        }

        return { success: true, message: message };
    }


    // Modifikasi getPlayerList untuk menjaga nomor tetap
    getPlayerList(game) {
        let list = `🏯 *Daftar Cultivators:*\n`;
        // Gunakan urutan yang tetap berdasarkan kapan mereka join
        game.playerOrder.forEach((playerId, index) => {
            const player = game.players.get(playerId);
            if (player) {
                const status = player.isDead ? '💀' : '🟢';
                list += `${index + 1}. ${player.name} ${status}\n`;
            }
        });
        return list;
    }

    // Cek kondisi kemenangan
    checkWinCondition(game) {
        const alivePlayers = this.getAlivePlayers(game);
        const evilPlayers = alivePlayers.filter(p => this.roles[p.role].team === 'evil');
        const goodPlayers = alivePlayers.filter(p => this.roles[p.role].team === 'good');

        console.log(`[DEBUG] Evil players: ${evilPlayers.length}, Good players: ${goodPlayers.length}`);

        if (evilPlayers.length === 0) {
            return {
                winner: 'good',
                message: `🏯 ✨ *KEBENARAN MENANG!*\n` +
                    `Para Mortal berhasil mengungkap kejahatan tersembunyi!\n` +
                    `Sekte kembali damai berkat keberanian mereka!`
            };
        }

        if (evilPlayers.length >= goodPlayers.length) {
            return {
                winner: 'evil',
                message: `🏯 🧛‍♂️ *KEGELAPAN MENANG!*\n` +
                    `Shadow Cultivators telah menguasai sekte!\n` +
                    `Kegelapan menyelimuti kerajaan untuk selamanya...`
            };
        }

        return { winner: null };
    }

    // Reveal semua role saat game selesai
    getFinalRevealMessage(game) {
        let message = `🎭 *Reveal Role Akhir:*\n`;
        game.playerOrder.forEach((playerId, index) => {
            const player = game.players.get(playerId);
            if (player) {
                const status = player.isDead ? '💀' : '🟢';
                const roleInfo = this.roles[player.role];
                message += `${index + 1}. ${player.name} ${status} ${roleInfo.emoji} ${roleInfo.name}\n`;
            }
        });
        return message;
    }

    // Command: aira game status
    getGameStatus(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            return { success: false, message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!' };
        }

        let message = `🏯 *Status Pertarungan Cultivation*\n`;
        message += `📅 Hari: ${game.day}| 🌙 Malam: ${game.night}\n`;
        message += `🎭 Fase: ${game.phase}\n`;
        message += `👥 Total Cultivators: ${game.players.size}\n`;
        message += `💀 Cultivators Gugur: ${game.deadPlayers.size}\n`;
        message += this.getPlayerList(game);
        return { success: true, message };
    }

    // Command: aira end game
    endGame(groupId) {
        const game = this.games.get(groupId);
        if (game) {
            // --- PERUBAHAN ---
            // Bersihkan timer jika game dihentikan
            this.clearNightTimer(game);
            this.clearDayTimer(game); // <--- PERUBAHAN
            // --- AKHIR PERUBAHAN ---
            this.games.delete(groupId);
            return { success: true, message: '🏯 Pertarungan cultivation telah dihentikan.' };
        }
        return { success: false, message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!' };
    }

    // Command: aira players
    getPlayerListCommand(groupId) {
        const game = this.games.get(groupId);
        if (!game) {
            return { success: false, message: '⚔️ Tidak ada pertarungan yang sedang berlangsung!' };
        }
        return { success: true, message: this.getPlayerList(game) };
    }
}

// --- PERUBAHAN ---
// Ekspor instance dari kelas, bukan kelas itu sendiri
module.exports = new EvilCultivatorGame();
// --- AKHIR PERUBAHAN ---