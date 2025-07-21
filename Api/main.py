import math
from flask import Flask, request, jsonify
from flask_cors import CORS # Untuk mengizinkan permintaan dari frontend
import random

app = Flask(__name__)
CORS(app) # Mengaktifkan CORS untuk semua rute

# --- Fungsi Pembantu RSA ---

def is_prime(n):
    """
    Memeriksa apakah sebuah bilangan adalah prima.
    """
    if n < 2:
        return False
    for i in range(2, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

def gcd(a, b):
    """
    Menghitung Greatest Common Divisor (GCD) dari dua bilangan.
    """
    while b:
        a, b = b, a % b
    return a

def mod_inverse(e, phi):
    """
    Menghitung invers modular dari e modulo phi menggunakan Extended Euclidean Algorithm.
    """
    m0 = phi
    y = 0
    x = 1
    if phi == 1:
        return 0
    while e > 1:
        q = e // phi
        t = phi
        phi = e % phi
        e = t
        t = y
        y = x - q * y
        x = t
    if x < 0:
        x = x + m0
    return x

def generate_keypair(p, q):
    """
    Menghasilkan pasangan kunci RSA (publik dan privat).
    """
    if not (is_prime(p) and is_prime(q)):
        raise ValueError("Both numbers must be prime.")
    if p == q:
        raise ValueError("p and q cannot be equal.")

    n = p * q
    phi_n = (p - 1) * (q - 1)

    # Pilih e secara acak dari 1 hingga phi_n, pastikan gcd(e, phi_n) = 1
    e = random.randrange(1, phi_n)
    while gcd(e, phi_n) != 1:
        e = random.randrange(1, phi_n)

    d = mod_inverse(e, phi_n)

    return ((e, n), (d, n))

def encrypt(public_key, plaintext):
    """
    Enkripsi pesan menggunakan kunci publik.
    Pesan diubah menjadi list bilangan integer (berdasarkan ASCII).
    """
    e, n = public_key
    # Ubah setiap karakter menjadi representasi ASCII-nya
    # Kemudian enkripsi setiap nilai ASCII
    cipher = [pow(ord(char), e, n) for char in plaintext]
    return cipher

def decrypt(private_key, ciphertext):
    """
    Dekripsi pesan menggunakan kunci privat.
    """
    d, n = private_key
    # Dekripsi setiap nilai dalam ciphertext
    # Kemudian ubah kembali menjadi karakter
    plain = [chr(pow(char, d, n)) for char in ciphertext]
    return ''.join(plain)

# --- Rute API ---

@app.route('/')
def home():
    return "RSA API is running!"

@app.route('/generate-keys', methods=['POST'])
def api_generate_keys():
    data = request.json
    try:
        p = int(data['p'])
        q = int(data['q'])
        public, private = generate_keypair(p, q)
        return jsonify({
            'success': True,
            'public_key': {'e': public[0], 'n': public[1]},
            'private_key': {'d': private[0], 'n': private[1]}
        })
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except KeyError:
        return jsonify({'success': False, 'message': 'Missing p or q in request.'}), 400

@app.route('/encrypt', methods=['POST'])
def api_encrypt():
    data = request.json
    try:
        e = int(data['e'])
        n = int(data['n'])
        plaintext = data['plaintext']
        public_key = (e, n)
        ciphertext = encrypt(public_key, plaintext)
        return jsonify({
            'success': True,
            'ciphertext': ciphertext
        })
    except KeyError:
        return jsonify({'success': False, 'message': 'Missing public key or plaintext.'}), 400
    except ValueError as e:
        return jsonify({'success': False, 'message': f'Invalid input: {e}'}), 400

@app.route('/decrypt', methods=['POST'])
def api_decrypt():
    data = request.json
    try:
        d = int(data['d'])
        n = int(data['n'])
        # Vercel dan JSON kadang mengubah list menjadi string jika terlalu panjang
        # Pastikan ciphertext adalah list of int
        ciphertext = [int(x) for x in data['ciphertext']] # Konversi setiap elemen ke int
        private_key = (d, n)
        plaintext = decrypt(private_key, ciphertext)
        return jsonify({
            'success': True,
            'plaintext': plaintext
        })
    except KeyError:
        return jsonify({'success': False, 'message': 'Missing private key or ciphertext.'}), 400
    except ValueError as e:
        return jsonify({'success': False, 'message': f'Invalid input: {e}'}), 400


if __name__ == '__main__':
    # Ini hanya untuk pengembangan lokal, Vercel akan menggunakan WSGI
    app.run(debug=True)