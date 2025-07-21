document.addEventListener('DOMContentLoaded', () => {
    // URL API Anda. Saat di-deploy ke Vercel, ini akan menjadi URL proyek Vercel Anda.
    // Selama pengembangan lokal, Anda bisa menggunakan 'http://127.0.0.1:5000'
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : 'https://matdis-xi.vercel.app/'; // Ganti dengan nama proyek Vercel Anda

    // Elemen DOM
    const primePInput = document.getElementById('primeP');
    const primeQInput = document.getElementById('primeQ');
    const generateKeysBtn = document.getElementById('generateKeysBtn');
    const publicKeyE = document.getElementById('publicKey_e');
    const publicKeyN = document.getElementById('publicKey_n');
    const privateKeyD = document.getElementById('privateKey_d');
    const privateKeyN = document.getElementById('privateKey_n');

    const encryptPublicKeyE = document.getElementById('encryptPublicKeyE');
    const encryptPublicKeyN = document.getElementById('encryptPublicKeyN');
    const plaintextInput = document.getElementById('plaintext');
    const encryptBtn = document.getElementById('encryptBtn');
    const ciphertextOutput = document.getElementById('ciphertextOutput');

    const decryptPrivateKeyD = document.getElementById('decryptPrivateKeyD');
    const decryptPrivateKeyN = document.getElementById('decryptPrivateKeyN');
    const ciphertextInput = document.getElementById('ciphertextInput');
    const decryptBtn = document.getElementById('decryptBtn');
    const plaintextOutput = document.getElementById('plaintextOutput');

    // Fungsi untuk menampilkan pesan kesalahan
    function showNotification(message, type = 'error') {
        alert(message); // Ganti dengan notifikasi yang lebih bagus jika ingin
    }

    // Fungsi untuk memanggil API
    async function callApi(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                showNotification(`API Error: ${result.message || 'Something went wrong.'}`);
                return null;
            }
            return result;
        } catch (error) {
            console.error('Fetch error:', error);
            showNotification('Gagal terhubung ke API. Pastikan server berjalan.');
            return null;
        }
    }

    // Event Listener untuk Generate Kunci
    generateKeysBtn.addEventListener('click', async () => {
        const p = parseInt(primePInput.value);
        const q = parseInt(primeQInput.value);

        if (isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
            showNotification('Masukkan bilangan prima positif yang valid untuk p dan q.');
            return;
        }

        const data = { p: p, q: q };
        const result = await callApi('generate-keys', data);

        if (result && result.success) {
            publicKeyE.textContent = result.public_key.e;
            publicKeyN.textContent = result.public_key.n;
            privateKeyD.textContent = result.private_key.d;
            privateKeyN.textContent = result.private_key.n;

            // Otomatis isi kolom enkripsi/dekripsi
            encryptPublicKeyE.value = result.public_key.e;
            encryptPublicKeyN.value = result.public_key.n;
            decryptPrivateKeyD.value = result.private_key.d;
            decryptPrivateKeyN.value = result.private_key.n;
        } else {
            // Error sudah ditangani di callApi
        }
    });

    // Event Listener untuk Enkripsi
    encryptBtn.addEventListener('click', async () => {
        const e = parseInt(encryptPublicKeyE.value);
        const n = parseInt(encryptPublicKeyN.value);
        const plaintext = plaintextInput.value;

        if (isNaN(e) || isNaN(n) || !plaintext) {
            showNotification('Pastikan kunci publik dan pesan plaintext sudah terisi.');
            return;
        }

        const data = { e: e, n: n, plaintext: plaintext };
        const result = await callApi('encrypt', data);

        if (result && result.success) {
            ciphertextOutput.value = JSON.stringify(result.ciphertext); // Simpan sebagai string JSON
            ciphertextInput.value = JSON.stringify(result.ciphertext); // Otomatis isi untuk dekripsi
        } else {
            // Error sudah ditangani di callApi
        }
    });

    // Event Listener untuk Dekripsi
    decryptBtn.addEventListener('click', async () => {
        const d = parseInt(decryptPrivateKeyD.value);
        const n = parseInt(decryptPrivateKeyN.value);
        let ciphertextString = ciphertextInput.value;

        if (isNaN(d) || isNaN(n) || !ciphertextString) {
            showNotification('Pastikan kunci privat dan ciphertext sudah terisi.');
            return;
        }

        let ciphertext;
        try {
            ciphertext = JSON.parse(ciphertextString);
            if (!Array.isArray(ciphertext)) {
                throw new Error("Ciphertext bukan format array.");
            }
        } catch (error) {
            showNotification('Format ciphertext tidak valid. Harap masukkan array JSON.');
            return;
        }
        
        const data = { d: d, n: n, ciphertext: ciphertext };
        const result = await callApi('decrypt', data);

        if (result && result.success) {
            plaintextOutput.value = result.plaintext;
        } else {
            // Error sudah ditangani di callApi
        }
    });

    // Isi nilai default saat halaman dimuat
    generateKeysBtn.click(); // Otomatis generate kunci saat pertama kali load
});