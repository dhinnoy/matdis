document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const generateKeysBtn = document.getElementById('generateKeysBtn');
    const publicKeyOutput = document.getElementById('publicKey');
    const privateKeyOutput = document.getElementById('privateKey');

    const messageToEncrypt = document.getElementById('messageToEncrypt');
    const publicKeyEncrypt = document.getElementById('publicKeyEncrypt');
    const encryptBtn = document.getElementById('encryptBtn');
    const encryptedMessageOutput = document.getElementById('encryptedMessage');

    const messageToDecrypt = document.getElementById('messageToDecrypt');
    const privateKeyDecrypt = document.getElementById('privateKeyDecrypt');
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptedMessageOutput = document.getElementById('decryptedMessage');

    // --- RSA Core Functions (Ported from Python Logic) ---

    // Function to calculate Greatest Common Divisor (GCD)
    function gcd(a, b) {
        while (b !== 0) {
            [a, b] = [b, a % b];
        }
        return a;
    }

    // Function to calculate modular inverse (d * e) % phi = 1
    function modInverse(e, phi) {
        let m0 = phi;
        let y = 0, x = 1;
        if (phi === 1) return 0;
        while (e > 1) {
            let q = Math.floor(e / m0);
            let t = m0;
            m0 = e % m0;
            e = t;
            t = y;
            y = x - q * y;
            x = t;
        }
        if (x < 0) x += phi;
        return x;
    }

    // Basic primality test (Miller-Rabin for better reliability, or simpler for demonstration)
    // For simplicity and client-side performance, we'll use a basic probabilistic test.
    // NOTE: This is NOT cryptographically secure for real-world prime generation.
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i = i + 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    // Generates a random prime number within a certain range
    function generatePrime(min, max) {
        let p = 0;
        let found = false;
        while (!found) {
            p = Math.floor(Math.random() * (max - min + 1)) + min;
            if (isPrime(p)) {
                found = true;
            }
        }
        return p;
    }

    // Converts string to array of ASCII values
    function stringToNumbers(str) {
        return Array.from(str).map(char => char.charCodeAt(0));
    }

    // Converts array of ASCII values back to string
    function numbersToString(numbers) {
        return String.fromCharCode(...numbers);
    }

    // RSA Key Generation
    function generateRSAKeys() {
        let p, q, n, phi, e, d;

        // Generate two distinct large prime numbers (adjust range for stronger keys)
        // For demonstration, let's keep them relatively small to avoid huge numbers in browser JS.
        // In real RSA, these would be hundreds of digits long.
        p = generatePrime(100, 500); // Example range
        do {
            q = generatePrime(100, 500); // Example range
        } while (q === p);

        n = p * q; // Modulus

        phi = (p - 1) * (q - 1); // Euler's totient function

        // Choose e (public exponent) such that 1 < e < phi and gcd(e, phi) = 1
        e = 0;
        for (let i = 2; i < phi; i++) {
            if (gcd(i, phi) === 1) {
                e = i;
                break;
            }
        }

        // Calculate d (private exponent) such that (d * e) % phi = 1
        d = modInverse(e, phi);

        return {
            publicKey: { e: e, n: n },
            privateKey: { d: d, n: n }
        };
    }

    // RSA Encryption
    function encryptRSA(message, publicKey) {
        const { e, n } = publicKey;
        const messageNumbers = stringToNumbers(message);
        return messageNumbers.map(charNum => {
            // C = M^e mod n
            return bigInt(charNum).modPow(e, n).toString(); // Using big-integer library for large numbers
        }).join(','); // Join with comma for easy parsing later
    }

    // RSA Decryption
    function decryptRSA(encryptedMessage, privateKey) {
        const { d, n } = privateKey;
        const encryptedNumbers = encryptedMessage.split(',').map(Number); // Convert back to array of numbers
        const decryptedNumbers = encryptedNumbers.map(cipherNum => {
            // M = C^d mod n
            return bigInt(cipherNum).modPow(d, n).valueOf(); // Using big-integer library
        });
        return numbersToString(decryptedNumbers);
    }

    // --- Event Listeners ---

    generateKeysBtn.addEventListener('click', () => {
        try {
            const keys = generateRSAKeys();
            publicKeyOutput.value = `${keys.publicKey.e},${keys.publicKey.n}`;
            privateKeyOutput.value = `${keys.privateKey.d},${keys.privateKey.n}`;

            // Also pre-fill for encryption/decryption sections for convenience
            publicKeyEncrypt.value = publicKeyOutput.value;
            privateKeyDecrypt.value = privateKeyOutput.value;
            alert('Kunci RSA berhasil dibuat!');
        } catch (error) {
            console.error('Error generating keys:', error);
            alert('Gagal membuat kunci. Silakan coba lagi. Pastikan angka prima cukup besar dan unik.');
        }
    });

    encryptBtn.addEventListener('click', () => {
        try {
            const message = messageToEncrypt.value;
            const publicKeyParts = publicKeyEncrypt.value.split(',').map(Number);
            if (publicKeyParts.length !== 2 || isNaN(publicKeyParts[0]) || isNaN(publicKeyParts[1])) {
                alert('Format Kunci Publik tidak valid. Harusnya "e,n".');
                return;
            }
            const publicKey = { e: publicKeyParts[0], n: publicKeyParts[1] };

            const encrypted = encryptRSA(message, publicKey);
            encryptedMessageOutput.value = encrypted;
            alert('Pesan berhasil dienkripsi!');

            // Pre-fill for decryption
            messageToDecrypt.value = encrypted;
        } catch (error) {
            console.error('Error encrypting message:', error);
            alert('Gagal mengenkripsi pesan. Pastikan kunci publik dan pesan valid.');
        }
    });

    decryptBtn.addEventListener('click', () => {
        try {
            const encryptedMessage = messageToDecrypt.value;
            const privateKeyParts = privateKeyDecrypt.value.split(',').map(Number);
            if (privateKeyParts.length !== 2 || isNaN(privateKeyParts[0]) || isNaN(privateKeyParts[1])) {
                alert('Format Kunci Privat tidak valid. Harusnya "d,n".');
                return;
            }
            const privateKey = { d: privateKeyParts[0], n: privateKeyParts[1] };

            const decrypted = decryptRSA(encryptedMessage, privateKey);
            decryptedMessageOutput.value = decrypted;
            alert('Pesan berhasil didekripsi!');
        } catch (error) {
            console.error('Error decrypting message:', error);
            alert('Gagal mendekripsi pesan. Pastikan kunci privat dan pesan terenkripsi valid.');
        }
    });
});

// --- Catatan Penting ---
// Untuk menangani bilangan sangat besar yang dibutuhkan RSA, JavaScript standar memiliki batasan.
// Untuk tujuan demonstrasi ini, saya akan menyertakan "big-integer" library sebagai CDN.
// Untuk penggunaan produksi, Anda harus menginstal ini via npm atau memastikan bundler Anda menanganinya.
// Tambahkan baris ini ke index.html Anda, sebelum <script src="script.js"></script>:
// <script src="https://cdn.jsdelivr.net/npm/big-integer@1.6.51/BigInteger.min.js"></script>
// Ini akan membuat objek `bigInt` global yang bisa digunakan untuk perhitungan angka besar.