// =======================================================================
// badwall.js - Filter dan Respons untuk Kata-Kata Tidak Pantas
// =======================================================================
//
// File ini berfungsi untuk mendeteksi pesan yang mengandung kata "aira"
// diikuti oleh kata-kata tidak pantas (badword). Jika terdeteksi, bot
// akan mengirimkan respons acak yang telah disiapkan.
//
// =======================================================================

// --- [ BAGIAN 1: DAFTAR KATA-KATA TIDAK PANTAS ] ---
// Kumpulan kata-kata yang dianggap tidak pantas dari berbagai sumber.
// Array 2D digunakan untuk mengelompokkan kata-kata berdasarkan bahasa
// atau varian, kemudian diratakan menjadi satu array tunggal untuk
// memudahkan proses pencarian.
// =======================================================================
const badwordLists = [
    // Varian Bahasa Indonesia dan singkatan umum
    [
      "kontol", "kntol", "k*ntol", "k0ntol", "kntl", "kont*l", "kontool", "kontolmu",
      "memek", "m*m*k", "mem3k", "mmk", "memeg", "memec", "memekmu", "memeks",
      "pepek", "pep3k", "pep*k", "ppek",
      "peler", "pler", "p3ler", "pl3r", "plr", "pelerr", "pelert",
      "titit", "titid", "t1tit", "t1t1d", "titik", "tittid", "titeet",
      "ngentot", "ngentod", "ngent0t", "ng3ntot", "ngntot", "ngentod", "ngentott", "ngntd",
      "ngocok", "ngocok kontol", "ngocok memek", "ngocok peler", "ngocok titit", "ngocok sendiri",
      "coli", "colai", "colly", "c0li", "colik", "c0lly", "colli",
      "jembut", "jemb*t", "jmbut", "j3mbut", "jemboot", "jembootmu",
      "bencong", "banci", "waria", "homo", "gay lo", "lesbi", "bencong lo", "banci lo",
      "pantat", "pantad", "pantet", "pantetmu", "pantadmu", "pantet lo",
      "dubur", "bokongmu", "pantatmu", "anal", "d4bur",
      "tolol bego", "idiot bangsat", "goblok kontol", "babi lu", "anjing lu", "makan tai",
      "tai", "taik", "taey", "taie", "taek", "t4i", "t4ek", "tai kucing", "tai anjing",
      "mampus", "mati lo", "mati aja", "mampus lu", "mampus kau", "modar",
      "pukimak", "puki", "pukima", "pukimakk", "pukim4k", "pookimak",
      "kimak", "kima", "kemaq", "kemak", "kiemak",
      "brengsek", "brengsek lu", "brengsek lo", "brngsek", "brensek",
      "bangsadd", "b4ngs4t", "bangkek", "bangshatt", "bangke kontol",
      "anjing goblok", "anjing lu", "anjing lo", "anying goblog",
      "fuckyou", "fcky0u", "fuck u", "fck u", "fcuk u", "fuck off", "fuckoff",
      "dick", "d1ck", "dik", "dikmu", "dikhead",
      "pussy", "pussi", "pusy", "pussee", "pusc", "puscy",
      "bastard", "bstrd", "bastart", "bastred",
      "motherfucker", "mthrfcuker", "m*therf*cker", "matherfucker", "mothafucka",
      "titfuck", "dickfuck", "assfuck", "assraped", "assrape", "assrap3",
      "raped", "rape", "rap3", "r4pe", "rapist", "rapisst",
      "sange", "sang3", "sanget", "horny", "ngaceng", "onani", "masturbasi",
      "open bo", "openbo", "bokep", "bok3p", "bok3ep", "bokebb", "bokeb", "jav", "hentai"
    ],
    // Kata-kata makian dengan ejaan bervariasi
    [
      "anjrit", "anjir", "anying", "anjg", "anyir", "anyink", "anjer",
      "babi", "beby", "b4bi", "b@bi", "bebek lo", "bbi",
      "monyet", "mony3t", "monyetlu", "monyetloe",
      "tolol", "t*l*l", "tollol", "t0l0l", "tolo", "toll", "tll",
      "idiot", "idiet", "idiyot", "idyot", "idiott", "idot",
      "isiot", "isiottt", "isioth",
      "goblok", "goblog", "goblek", "goblogg", "gobloq", "goblokkk", "gblk", "gblg", "gblx",
      "goblox", "gobloxx", "goblos", "goblow",
      "dobol", "d0b0l", "dobboll", "doboll",
      "dodol", "dodoll", "dodool", "d0d0l", "ddol",
      "gada otak", "gk ada otak", "gak ada otak", "gaada otak", "gda otak", "ga punya otak",
      "takda otak", "tdk ada otak", "xda otak",
      "sakit", "sicko", "skit jiwa", "sakit mental", "sakit otak",
      "bego", "bgo", "bg0", "begok", "begox", "begooo", "begog",
      "egek", "ejek", "egeg",
      "ego", "egow", "egox", "egok",
      "bangsat", "bangsattt", "bangsatt", "b4ngsat", "bangxat", "bangshat",
      "bajingan", "b4jingan", "bajiingan", "bajingaan", "b@jingan", "bajingn",
      "buajingan", "buwajingan", "bajirgan",
      "bangke", "bangkai", "bangkeee", "bangkek", "bangkai lo",
      "bodoh", "bodohh", "b0d0h", "bodoo", "boddoh", "bodok", "bodol",
      "bodo", "bodoo", "bodo amat", "bodoh amat", "bodor",
      "jancok", "jancoek", "jancoq", "jancuk", "jankok", "j4ncok", "jencok",
      "fuck", "fck", "f*ck", "fuk", "fukk", "fcku", "fckoff", "fckyou",
      "shit", "sh1t", "shet", "shiet", "shett", "shittt",
      "dumbass", "dumb", "dumbaz", "dumass", "dumazz", "dambes",
      "fuckface", "fckface", "fukface", "fckfce",
      "asshole", "assh0le", "assol", "as$hole", "4sshole",
      "dumdum", "dumdumm", "dummdum", "dumdumz", "dumdumzz"
    ],
    // Kata-kata dari berbagai bahasa daerah
    [
      "asu", "asu raimu", "asu kowe", "jancok", "jancoek", "jancuk", "jancokmu", "matamu", "raimu", 
      "taikmu", "ndasmu", "mbokmu", "kontolmu", "memekmu", "ngentotmu", "ndlogok", "ndasmu asu",
      "anjing", "bangsat", "kehed", "kabogoh", "goblog", "bedegong", "tolol", "siah", "sialan", "sinting", "goblong",
      "bangke", "setan", "kontol", "memek", "tai lo", "gila lu", "bego banget", "ngentot lu", "lu anjing",
      "jancok", "bajingan", "nyet", "sundel", "bangsat", "bhedhe", "pantek", "pantekk", "panteq", "pantekmu",
      "lanjiao", "lanjiau", "lan jiao", "lanjio", "k*n ni ma", "kanina", "kan ni lao bu", "chibai", 
      "chi bai", "ci bai", "cbai", "cibaikk", "kannasai", "kanasai", "kanase", "kanna sai", 
      "nia seng", "niama", "ka ni neng", "ta ma de", "tama de", "tamade", "nmsl", "ni ma si le",
    ],
    // Kata-kata yang lebih sederhana
    [
    "njing", "babi", "monyet", "tolol", "idiot", "isiot", "goblok", "goblox", "dobol", "dodol", 
    "gada otak", "takda otak", "sakit", "bego", "egek", "ego", "bangsat", "bajingan", "buajingan",
    "bangke", "bodoh", "bodo", "jancok", "fuck", "shit", "dumbass", "fuckface", "asshole",
    "dumdum", "Lanciau", "Pukimakajg",
    ],
];

// Gabungkan semua array di atas menjadi satu array tunggal untuk pencarian yang efisien.
const allBadwords = badwordLists.flat();

// --- [ BAGIAN 2: FUNGSI UTAMA ] ---
/**
 * Memeriksa apakah pesan mengandung "aira" yang diikuti oleh kata-kata tidak pantas
 * dan mengembalikan respons acak jika ditemukan.
 *
 * @param {string} messageBody - Isi teks dari pesan yang diterima.
 * @param {string} pushname - Nama pengguna yang mengirim pesan.
 * @returns {string|null} - Mengembalikan string respons jika ditemukan badword, atau null jika tidak.
 */
function checkAndRespond(messageBody, pushname) {
    // Pastikan input adalah string yang valid
    if (!messageBody || typeof messageBody !== 'string') {
        return null;
    }

    const lowerBody = messageBody.toLowerCase().trim();
    const containsAira = lowerBody.includes('aira');

    // Jika "aira" tidak disebut dalam pesan, tidak perlu memproses lebih lanjut.
    if (!containsAira) {
        return null;
    }

    // Iterasi melalui setiap badword yang telah diratakan
    for (const badword of allBadwords) {
        // Buat ekspresi reguler (regex) untuk pencocokan yang fleksibel.
        // Regex ini mencari pola "aira" diikuti badword, dengan jarak karakter
        // atau kata lain di antaranya. `\b` memastikan pencocokan kata utuh.
        const escapedBadword = badword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\baira\\b[^\\w\\n]{0,10}\\b${escapedBadword}\\b`, 'i');
        
        // Jika badword cocok dengan pola regex
        if (regex.test(lowerBody)) {
            // --- Daftar Respons Acak ---
            // Kumpulan respons yang akan dipilih secara acak.
            // Placeholder ${badword} dan ${pushname} akan diganti secara otomatis.
            const responses = [
                `"${badword}"? Itu sih definisi hidup lo, ${pushname}.`,
                `Kata "${badword}" cocok banget buat ditulis di batu nisanmu ntar.`,
                `Mungkin kamu pikir kamu menghina, padahal kamu cuma deskripsiin diri sendiri. 😂`,
                `Wih, nyebut "${badword}"? Biasa latihan depan kaca ya?`,
                `${pushname}, kamu tuh walking example dari kata "${badword}".`,
                `Kasar doang gede, otak tetap kayak batu bata. "${badword}", indeed.`,
                `Kalau "${badword}" ada wajah, ya itu kamu, ${pushname}.`,
                `Ngomong "${badword}" tuh kayak ngakuin IQ minus sendiri.`,
                `${pushname}, kamu tuh kayak WiFi publik: banyak omong, gak aman, sinyal lemah.`,
                `Mikir dulu sebelum buka mulut, ${pushname}. Atau minimal isi dulu otaknya.`,
                `Sayangnya, vaksin gak ada buat orang sebodoh "${badword}".`,
                `Kata "${badword}" keluar dari kamu tuh kayak kentut—bau, gak penting, dan gak ditunggu siapa-siapa.`,
                `Kamu nyebut "${badword}" tapi lupa liat KTP sendiri ya?`,
                `Wah, ${pushname} udah makan belum? Soalnya kata kasarnya tadi kayak kelaparan IQ.`,
                `${pushname}, kalau aku punya 1 rupiah tiap kamu nyebut "${badword}", aku udah kaya dari penghinaanmu sendiri.`,
                `Ngomong "${badword}" gak bikin kamu keren. Malah makin keliatan gagal.`,
                `${pushname}, kadang aku bingung... itu mulut atau tempat sampah? Bau busuk isinya.`,
                `Kamu nyebut "${badword}" dengan pede banget. Bangga ya jadi contoh hidupnya?`,
                `Tenang, ${pushname}, semua orang pernah bodoh. Tapi kamu ngotot banget langganan.`,
                `Wah, ${pushname} lagi kesambet ya? Kok bisa-bisanya ngomong "${badword}" ke aira?`,
                `${pushname}, mulutmu itu pintu rezeki... sayangnya rezekinya lewat dari lubang sampah, isinya "${badword}".`,
                `Aduh, ${pushname}... Kayaknya otakmu perlu di-*update*. Soalnya isinya cuma "${badword}" terus.`,
                `Kalau "${badword}" itu olahraga, ${pushname} pasti atletnya. Tapi sayang, cabang olahraganya "meludah dari gunung".`,
                `${pushname}, kamu tuh kayak paket internet: kuota banyak, tapi isinya cuma buat download bom "${badword}".`,
                `Tahu gak, ${pushname}? Kamu itu kayak bintang jatuh... cahayanya cuma sebentar, habis itu tinggal debu "${badword}".`,
                `Kamu ngomong "${badword}" segitu yakinnya, ${pushname}. Jangan-jangan itu kata favoritmu pas lagi nonton kaca?`,
                `${pushname}, kamu tuh kayak alarm jam: bunyinya keras, tapi isinya cuma ganggu orang. Dan sekarang kamu ganggu aira dengan "${badword}".`,
                `Kalau ada turnamen "${badword}", ${pushname} pasti juara. Sayangnya, medali "Raja Kasar" gak bisa dipamerin di pajangan.`,
                `${pushname}, kamu nyebut "${badword}" sambil senyum? Wah, toxic positivity banget. Tapi sinismu balik ke dirimu sendiri, lho.`,
                `Kamu pikir "${badword}" itu senjata, ${pushname}? Padahal itu bom bunuh diri yang efek ledakannya ngeri ke dirimu sendiri.`,
                `${pushname}, kamu tuh kayak meme: lucu pas pertama kali, tapi kalau diulang terus jadi gangguan. Apalagi pas isinya "${badword}".`,
                `Kalau "${badword}" bisa bikin kaya, ${pushname}, kamu pasti triliuner dari hinaan sendiri. Tapi kocek tetap kering, ya?`,
                `Mulutmu kompor, ${pushname}, api "${badword}"nya nyala terus. Tapi dapurnya kosong, gak ada masak-masak apa-apa.`,
                `${pushname}, kamu tuh kayak bublewrap: mudah meledak dan isinya cuma "${badword}" doang.`,
                `Kayaknya kamu butuh kamus, ${pushname}. Soalnya "${badword}" itu artinya "tolol" dalam bahasa kamukamu.`,
                `${pushname}, kamu tuh kayak GPS rusak: arah hidupmu cuma muter-muter di "${badword}".`,
                `Kamu nyebut "${badword}" kayak lagi baca mantra, ${pushname}. Tapi mantranya balik ke diri sendiri, lho.`,
                `Kalau "${badword}" bisa dijual, ${pushname}, kamu pasti supplier terbesar di pasar dunia. Sayangnya, permintaannya cuma dari dirimu sendiri.`,
                `${pushname}, kamu tuh kayak virus: cepet menyebar dan isinya cuma "${badword}". Tapi antivirusnya belum ditemukan, ya. Karena emang gak ada obat untuk sombong.`
            ];

            // Pilih satu respons secara acak
            const selectedResponseTemplate = responses[Math.floor(Math.random() * responses.length)];

            // Ganti placeholder dengan nilai yang sesuai
            const finalResponse = selectedResponseTemplate
                .replace(/\$\{badword\}/g, badword || '***')
                .replace(/\$\{pushname\}/g, pushname || 'Pengguna');
            
            return finalResponse;
        }
    }

    // Jika tidak ada badword yang cocok setelah pemeriksaan
    return null;
}

// --- [ BAGIAN 3: EKSPOR MODUL ] ---
// Mengekspor fungsi utama agar bisa digunakan di file lain (misalnya aira.js).
// =======================================================================
module.exports = {
    checkAndRespond
};