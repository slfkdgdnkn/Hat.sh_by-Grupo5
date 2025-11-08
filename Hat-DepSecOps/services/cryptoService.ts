
import type { Sodium } from '../types';

const CHUNK_SIZE = 16384; // 16 KB
const SIG_V2_SYMMETRIC = "zDKO6XYXioc";
const SIG_V2_ASYMMETRIC = "hTWKbfoikeg";

// --- Helper Functions ---

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Public API ---

export const generatePassword = (sodium: Sodium): string => {
    return sodium.to_base64(
        sodium.randombytes_buf(16),
        sodium.base64_variants.URLSAFE_NO_PADDING
    );
};

export const generateKeyPair = (sodium: Sodium): { publicKey: string, privateKey: string } => {
    const keypair = sodium.crypto_kx_keypair();
    return {
        publicKey: sodium.to_base64(keypair.publicKey, sodium.base64_variants.URLSAFE_NO_PADDING),
        privateKey: sodium.to_base64(keypair.privateKey, sodium.base64_variants.URLSAFE_NO_PADDING),
    };
};

export const detectEncryptionMethod = async (sodium: Sodium, file: File): Promise<'password' | 'publicKey' | 'unknown'> => {
    if (file.size < 11) return 'unknown';
    const signatureBuffer = await file.slice(0, 11).arrayBuffer();
    const signature = new TextDecoder().decode(signatureBuffer);
    
    if (signature === SIG_V2_SYMMETRIC) {
        return 'password';
    }
    if (signature === SIG_V2_ASYMMETRIC) {
        return 'publicKey';
    }
    return 'unknown';
};

const fileToChunks = (file: File, startOffset = 0) => {
    let offset = startOffset;
    return new ReadableStream({
        async pull(controller) {
            if (offset >= file.size) {
                controller.close();
                return;
            }
            const end = Math.min(offset + CHUNK_SIZE, file.size);
            const chunk = await file.slice(offset, end).arrayBuffer();
            controller.enqueue({ chunk: new Uint8Array(chunk), isLast: end >= file.size });
            offset = end;
        }
    });
};

export const encryptFileSymmetric = async (sodium: Sodium, file: File, password: string, onProgress: (progress: string) => void): Promise<Blob> => {
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const key = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
    );

    const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
    const state = res.state;
    const header = res.header;

    const signature = new TextEncoder().encode(SIG_V2_SYMMETRIC);
    const encryptedChunks: Uint8Array[] = [signature, salt, header];
    
    let processedBytes = 0;
    const reader = fileToChunks(file).getReader();

    while(true) {
        const { value, done } = await reader.read();
        if(done) break;

        const { chunk, isLast } = value;
        const tag = isLast 
            ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL 
            : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;
        
        const encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(state, chunk, null, tag);
        encryptedChunks.push(encryptedChunk);
        
        processedBytes += chunk.length;
        onProgress(`${formatBytes(processedBytes)} / ${formatBytes(file.size)}`);
    }

    return new Blob(encryptedChunks, { type: 'application/octet-stream' });
};


export const encryptFileAsymmetric = async (sodium: Sodium, file: File, recipientPk: string, senderSk: string, onProgress: (progress: string) => void): Promise<Blob> => {
    const senderSkBytes = sodium.from_base64(senderSk, sodium.base64_variants.URLSAFE_NO_PADDING);
    const senderPkBytes = sodium.crypto_scalarmult_base(senderSkBytes);

    const keys = sodium.crypto_kx_client_session_keys(
        senderPkBytes,
        senderSkBytes,
        sodium.from_base64(recipientPk, sodium.base64_variants.URLSAFE_NO_PADDING)
    );

    const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(keys.sharedTx);
    const state = res.state;
    const header = res.header;

    const signature = new TextEncoder().encode(SIG_V2_ASYMMETRIC);
    const encryptedChunks: Uint8Array[] = [signature, senderPkBytes, header];
    
    let processedBytes = 0;
    const reader = fileToChunks(file).getReader();

    while(true) {
        const { value, done } = await reader.read();
        if(done) break;

        const { chunk, isLast } = value;
        const tag = isLast 
            ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL 
            : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;
        
        const encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(state, chunk, null, tag);
        encryptedChunks.push(encryptedChunk);
        
        processedBytes += chunk.length;
        onProgress(`${formatBytes(processedBytes)} / ${formatBytes(file.size)}`);
    }

    return new Blob(encryptedChunks, { type: 'application/octet-stream' });
};

export const decryptFileSymmetric = async (sodium: Sodium, file: File, password: string, onProgress: (progress: string) => void): Promise<Blob> => {
    const saltStart = 11;
    const headerStart = saltStart + sodium.crypto_pwhash_SALTBYTES;
    const contentStart = headerStart + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES;
    
    const salt = new Uint8Array(await file.slice(saltStart, headerStart).arrayBuffer());
    const header = new Uint8Array(await file.slice(headerStart, contentStart).arrayBuffer());

    const key = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
    );

    const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, key);
    if (!state) throw new Error("Invalid password or corrupted file.");

    const decryptedChunks: Uint8Array[] = [];
    let processedBytes = 0;
    const reader = fileToChunks(file, contentStart).getReader();

    while(true) {
        const { value, done } = await reader.read();
        if(done) break;

        const { chunk } = value;
        const result = sodium.crypto_secretstream_xchacha20poly1305_pull(state, chunk);
        if (!result) throw new Error("Decryption failed. File may be corrupted.");
        
        decryptedChunks.push(result.message);
        
        processedBytes += chunk.length;
        onProgress(`${formatBytes(processedBytes)} / ${formatBytes(file.size - contentStart)}`);
    }

    return new Blob(decryptedChunks, { type: 'application/octet-stream' });
};


export const decryptFileAsymmetric = async (sodium: Sodium, file: File, senderPk: string, recipientSk: string, onProgress: (progress: string) => void): Promise<Blob> => {
    const pkStart = 11;
    const headerStart = pkStart + sodium.crypto_kx_PUBLICKEYBYTES;
    const contentStart = headerStart + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES;

    const senderPkBytes = new Uint8Array(await file.slice(pkStart, headerStart).arrayBuffer());
    const header = new Uint8Array(await file.slice(headerStart, contentStart).arrayBuffer());

    const keys = sodium.crypto_kx_server_session_keys(
        sodium.crypto_scalarmult_base(sodium.from_base64(recipientSk, sodium.base64_variants.URLSAFE_NO_PADDING)),
        sodium.from_base64(recipientSk, sodium.base64_variants.URLSAFE_NO_PADDING),
        senderPkBytes
    );

    const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, keys.sharedRx);
    if (!state) throw new Error("Invalid key pair or corrupted file.");
    
    const decryptedChunks: Uint8Array[] = [];
    let processedBytes = 0;
    const reader = fileToChunks(file, contentStart).getReader();

    while(true) {
        const { value, done } = await reader.read();
        if(done) break;

        const { chunk } = value;
        const result = sodium.crypto_secretstream_xchacha20poly1305_pull(state, chunk);
        if (!result) throw new Error("Decryption failed. File may be corrupted.");
        
        decryptedChunks.push(result.message);
        
        processedBytes += chunk.length;
        onProgress(`${formatBytes(processedBytes)} / ${formatBytes(file.size - contentStart)}`);
    }

    return new Blob(decryptedChunks, { type: 'application/octet-stream' });
};
