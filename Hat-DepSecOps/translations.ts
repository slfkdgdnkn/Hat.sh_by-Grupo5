
import type { Language } from './types';

type TranslationKey =
  | 'secureFileEncryptor'
  | 'clientSideFileEncryption'
  | 'heroSubtitle'
  | 'copyright'
  | 'donationsAppreciated'
  | 'encrypt'
  | 'decrypt'
  | 'settings'
  | 'language'
  | 'darkMode'
  | 'donations'
  | 'donationsSubtitle'
  | 'redesignedBy'
  | 'addressCopied'
  | 'chooseFilesToEncrypt'
  | 'next'
  | 'chooseEncryptionMethod'
  | 'password'
  | 'publicKey'
  | 'passwordPlaceholder'
  | 'generate'
  | 'strengthVeryWeak'
  | 'strengthWeak'
  | 'strengthOkay'
  | 'strengthGood'
  | 'strengthStrong'
  | 'crackTime'
  | 'recipientPublicKey'
  | 'yourPrivateKeyOptional'
  | 'generateNewKeyPair'
  | 'back'
  | 'encryptFile'
  | 'startingEncryption'
  | 'encryptionSuccessful'
  | 'encryptionSuccessMsg'
  | 'downloadEncryptedFile'
  | 'encryptMoreFiles'
  | 'loadingCrypto'
  | 'passwordMinChars'
  | 'recipientPkRequired'
  | 'keyPairGenerated'
  | 'authEncSkNeeded'
  | 'tempSkGenerated'
  | 'encryptionError'
  | 'chooseFilesToDecrypt'
  | 'analyzing'
  | 'enterDecryptCredentials'
  | 'passwordPlaceholderDecrypt'
  | 'senderPublicKey'
  | 'yourPrivateKey'
  | 'decryptFile'
  | 'startingDecryption'
  | 'decryptionSuccessful'
  | 'decryptionSuccessMsg'
  | 'downloadDecryptedFile'
  | 'decryptMoreFiles'
  | 'detectMethodError'
  | 'fileAnalysisError'
  | 'passwordRequired'
  | 'bothKeysRequired'
  | 'decryptionError'
  | 'uploadFiles'
  | 'dragAndDrop'
  | 'selectFiles'
  | 'sodiumInitError'
  | 'sodiumLoadError'
  | 'sodiumLoadTimeout'
  | 'retry'
  ;

export const translations: Record<TranslationKey, Record<Language, string>> = {
  // Common & App.tsx
  secureFileEncryptor: { en: 'SecureFile Encryptor ', es: 'Cifrador de Archivos Basado en Hat.sh' },
  clientSideFileEncryption: { en: 'Client-Side File Encryption ', es: 'Cifrado de Archivos' },
  heroSubtitle: { en: 'Your files are encrypted in your browser and never leave your machine.', es: 'Tus archivos se cifran en tu navegador y nunca abandonan tu máquina.' },
  copyright: { en: 'SecureFile Encryptor V.1.', es: 'Cifrador de Archivos Seguro V.1.' },
  donationsAppreciated: { en: 'Donations for Creator sh-dv!', es: '¡Donaciones para el Creador sh-dv!' },
  encrypt: { en: 'Encrypt', es: 'Cifrar' },
  decrypt: { en: 'Decrypt', es: 'Descifrar' },
  settings: { en: 'Settings', es: 'Ajustes' },
  language: { en: 'Language', es: 'Idioma' },
  darkMode: { en: 'Dark Mode', es: 'Modo Oscuro' },
  donations: { en: 'Donations', es: 'Donaciones' },
  donationsSubtitle: { en: 'This is an open-source application. Your support is greatly appreciated!', es: 'Esta es una aplicación de código abierto. ¡Tu apoyo es muy apreciado!' },
  redesignedBy: { en: 'Redesigned by Loizzz DevSecOps Class', es: 'Rediseñada por Loizzz Clase DevSecOps' },
  addressCopied: { en: 'Address copied to clipboard!', es: '¡Dirección copiada al portapapeles!' },

  // EncryptionPanel.tsx
  chooseFilesToEncrypt: { en: 'Choose files to encrypt', es: 'Elige archivos para cifrar' },
  next: { en: 'Next', es: 'Siguiente' },
  chooseEncryptionMethod: { en: 'Choose Encryption Method', es: 'Elige el Método de Cifrado' },
  password: { en: 'Password', es: 'Contraseña' },
  publicKey: { en: 'Public Key', es: 'Clave Pública' },
  passwordPlaceholder: { en: 'Enter password (min 12 chars)', es: 'Introduce la contraseña (mínimo 12 caracteres)' },
  generate: { en: 'Generate', es: 'Generar' },
  strengthVeryWeak: { en: 'Very Weak', es: 'Muy Débil' },
  strengthWeak: { en: 'Weak', es: 'Débil' },
  strengthOkay: { en: 'Okay', es: 'Aceptable' },
  strengthGood: { en: 'Good', es: 'Buena' },
  strengthStrong: { en: 'Strong', es: 'Fuerte' },
  crackTime: { en: 'Est. crack time', es: 'Tiempo est. de crackeo' },
  recipientPublicKey: { en: "Recipient's Public Key", es: 'Clave Pública del Destinatario' },
  yourPrivateKeyOptional: { en: 'Your Private Key (optional, for authenticated encryption)', es: 'Tu Clave Privada (opcional, para cifrado autenticado)' },
  generateNewKeyPair: { en: 'Generate New Key Pair', es: 'Generar Nuevo Par de Claves' },
  back: { en: 'Back', es: 'Atrás' },
  encryptFile: { en: 'Encrypt', es: 'Cifrar' },
  startingEncryption: { en: 'Starting encryption...', es: 'Iniciando cifrado...' },
  encryptionSuccessful: { en: 'Encryption Successful!', es: '¡Cifrado Exitoso!' },
  encryptionSuccessMsg: { en: 'Your file is now securely encrypted.', es: 'Tu archivo está ahora cifrado de forma segura.' },
  downloadEncryptedFile: { en: 'Download Encrypted File', es: 'Descargar Archivo Cifrado' },
  encryptMoreFiles: { en: 'Encrypt More Files', es: 'Cifrar Más Archivos' },
  loadingCrypto: { en: 'Loading cryptographic library...', es: 'Cargando librería criptográfica...' },
  passwordMinChars: { en: 'Password must be at least 12 characters.', es: 'La contraseña debe tener al menos 12 caracteres.' },
  recipientPkRequired: { en: "Recipient's public key is required.", es: 'La clave pública del destinatario es obligatoria.' },
  keyPairGenerated: { en: 'Key pair generated! Store it securely.', es: '¡Par de claves generado! Guárdalo de forma segura.' },
  authEncSkNeeded: { en: 'For authenticated encryption, your private key is also needed.', es: 'Para el cifrado autenticado, también se necesita tu clave privada.' },
  tempSkGenerated: { en: 'A temporary private key has been generated for you.', es: 'Se ha generado una clave privada temporal para ti.' },
  encryptionError: { en: 'An unknown error occurred during encryption.', es: 'Ocurrió un error desconocido durante el cifrado.' },

  // DecryptionPanel.tsx
  chooseFilesToDecrypt: { en: 'Choose files to decrypt', es: 'Elige archivos para descifrar' },
  analyzing: { en: 'Analyzing...', es: 'Analizando...' },
  enterDecryptCredentials: { en: 'Enter Decryption Credentials', es: 'Introduce las Credenciales de Descifrado' },
  passwordPlaceholderDecrypt: { en: 'Enter password', es: 'Introduce la contraseña' },
  senderPublicKey: { en: "Sender's Public Key", es: 'Clave Pública del Remitente' },
  yourPrivateKey: { en: 'Your Private Key', es: 'Tu Clave Privada' },
  decryptFile: { en: 'Decrypt', es: 'Descifrar' },
  startingDecryption: { en: 'Starting decryption...', es: 'Iniciando descifrado...' },
  decryptionSuccessful: { en: 'Decryption Successful!', es: '¡Descifrado Exitoso!' },
  decryptionSuccessMsg: { en: 'Your file has been successfully decrypted.', es: 'Tu archivo se ha descifrado correctamente.' },
  downloadDecryptedFile: { en: 'Download Decrypted File', es: 'Descargar Archivo Descifrado' },
  decryptMoreFiles: { en: 'Decrypt More Files', es: 'Descifrar Más Archivos' },
  detectMethodError: { en: 'Could not detect encryption method. File might be invalid or corrupted.', es: 'No se pudo detectar el método de cifrado. El archivo podría ser inválido o estar corrupto.' },
  fileAnalysisError: { en: 'Error analyzing file.', es: 'Error al analizar el archivo.' },
  passwordRequired: { en: 'Password is required.', es: 'La contraseña es obligatoria.' },
  bothKeysRequired: { en: 'Both sender public key and your private key are required.', es: 'Se requieren tanto la clave pública del remitente como tu clave privada.' },
  decryptionError: { en: 'An unknown error occurred during decryption.', es: 'Ocurrió un error desconocido durante el descifrado.' },
  
  // FileDropzone.tsx
  uploadFiles: { en: 'Upload files', es: 'Subir archivos' },
  dragAndDrop: { en: 'or drag and drop', es: 'o arrastra y suelta' },
  selectFiles: { en: 'Select one or more files to process', es: 'Selecciona uno o más archivos para procesar' },

  // useSodium.ts
  sodiumInitError: { en: 'Libsodium failed to initialize. Please refresh the page.', es: 'Error al inicializar Libsodium. Por favor, recarga la página.'},
  sodiumLoadError: { en: 'Could not load cryptographic library. Please check your connection and refresh.', es: 'No se pudo cargar la librería criptográfica. Revisa tu conexión y recarga la página.'},
  sodiumLoadTimeout: { en: 'Cryptographic library loading timeout. Please refresh the page.', es: 'Tiempo de espera agotado al cargar la librería criptográfica. Por favor, recarga la página.'},
  retry: { en: 'Retry', es: 'Reintentar' },
};
