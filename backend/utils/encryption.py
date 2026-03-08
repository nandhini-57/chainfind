import os, base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from config import get_settings

settings = get_settings()

def get_key() -> bytes:
    return bytes.fromhex(settings.encryption_key.zfill(64))

def encrypt_message(plaintext: str) -> tuple[str, str]:
    """Returns (encrypted_b64, iv_b64)"""
    key = get_key()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    enc = cipher.encryptor()
    ct = enc.update(plaintext.encode()) + enc.finalize()
    return base64.b64encode(ct).decode(), base64.b64encode(iv).decode()

def decrypt_message(encrypted_b64: str, iv_b64: str) -> str:
    """Returns decrypted plaintext"""
    key = get_key()
    iv = base64.b64decode(iv_b64)
    ct = base64.b64decode(encrypted_b64)
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    dec = cipher.decryptor()
    return (dec.update(ct) + dec.finalize()).decode()
