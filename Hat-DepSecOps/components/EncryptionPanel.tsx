
import React, { useState, useCallback, useMemo } from 'react';
import { useSodium } from '../hooks/useSodium';
import * as cryptoService from '../services/cryptoService';
import type { EncryptionMethod, ZxcvbnResult } from '../types';
import { FileDropzone } from './FileDropzone';
import { TrashIcon, RefreshIcon, DownloadIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';

// Inlined FileList Component
const FileList: React.FC<{ files: File[]; onRemoveFile: (index: number) => void }> = ({ files, onRemoveFile }) => {
    if (files.length === 0) return null;
    
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <div className="mt-4 space-y-2">
            {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                    <button onClick={() => onRemoveFile(index)} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                        <TrashIcon />
                    </button>
                </div>
            ))}
        </div>
    );
};


// Inlined PasswordInput Component
const PasswordInput: React.FC<{ password: string; onPasswordChange: (p: string) => void; onGenerate: () => void; strengthResult: ZxcvbnResult | null;}> = ({ password, onPasswordChange, onGenerate, strengthResult }) => {
    const { t } = useTranslation();
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    const strengthTextKeys = ['strengthVeryWeak', 'strengthWeak', 'strengthOkay', 'strengthGood', 'strengthStrong'];
    
    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full p-3 pr-32 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                    type="button"
                    onClick={onGenerate}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                >
                    <RefreshIcon />
                    <span className="ml-1">{t('generate')}</span>
                </button>
            </div>
            {password.length > 0 && strengthResult && (
                 <div className="space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                         <div
                            className={`h-2 rounded-full ${strengthColors[strengthResult.score]}`}
                            style={{ width: `${(strengthResult.score + 1) * 20}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{t(strengthTextKeys[strengthResult.score] as any)}</span>
                        <span>{t('crackTime')}: {strengthResult.crack_times_display.offline_slow_hashing_1e4_per_second}</span>
                    </div>
                    {strengthResult.feedback.warning && <p className="text-xs text-red-500">{strengthResult.feedback.warning}</p>}
                </div>
            )}
        </div>
    );
};

// Inlined KeyInput Component
const KeyInput: React.FC<{
    publicKey: string; onPublicKeyChange: (k: string) => void;
    privateKey: string; onPrivateKeyChange: (k: string) => void;
    onGenerate: () => void;
}> = ({ publicKey, onPublicKeyChange, privateKey, onPrivateKeyChange, onGenerate }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            <textarea
                value={publicKey}
                onChange={e => onPublicKeyChange(e.target.value)}
                placeholder={t('recipientPublicKey')}
                rows={2}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            />
            <textarea
                value={privateKey}
                onChange={e => onPrivateKeyChange(e.target.value)}
                placeholder={t('yourPrivateKeyOptional')}
                rows={2}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            />
            <button
                type="button"
                onClick={onGenerate}
                className="w-full flex items-center justify-center p-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 border border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700"
            >
                <RefreshIcon />
                <span className="ml-1">{t('generateNewKeyPair')}</span>
            </button>
        </div>
    );
};


export const EncryptionPanel: React.FC<{ showToast: (message: string) => void }> = ({ showToast }) => {
    const { sodium, isReady, error, retry } = useSodium();
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [encryptionMethod, setEncryptionMethod] = useState<EncryptionMethod>('password');
    const [password, setPassword] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [encryptedFileName, setEncryptedFileName] = useState('');

    const passwordStrength = useMemo(() => {
        if (!password || typeof window.zxcvbn !== 'function') return null;
        return window.zxcvbn(password);
    }, [password]);

    const handleFilesAdded = useCallback((newFiles: File[]) => {
        setFiles(f => [...f, ...newFiles]);
    }, []);
    
    const handleRemoveFile = (index: number) => {
        setFiles(f => f.filter((_, i) => i !== index));
    };

    const handleReset = () => {
        setCurrentStep(0);
        setFiles([]);
        setPassword('');
        setPublicKey('');
        setPrivateKey('');
        setIsProcessing(false);
        setProgress('');
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }
        setDownloadUrl(null);
        setEncryptedFileName('');
    };

    const handleGeneratePassword = () => {
        if (!isReady) return;
        setPassword(cryptoService.generatePassword(sodium));
    };

    const handleGenerateKeyPair = () => {
        if (!isReady) return;
        const { publicKey, privateKey } = cryptoService.generateKeyPair(sodium);
        setPublicKey(publicKey);
        setPrivateKey(privateKey);
        showToast(t('keyPairGenerated'));
    };

    const handleEncrypt = async () => {
        if (!isReady || files.length === 0) return;
        
        if (encryptionMethod === 'password' && (!password || password.length < 12)) {
            showToast(t('passwordMinChars'));
            return;
        }
        if (encryptionMethod === 'publicKey' && !publicKey) {
            showToast(t('recipientPkRequired'));
            return;
        }

        setIsProcessing(true);
        setProgress(t('startingEncryption'));
        
        try {
            // For simplicity, we'll encrypt the first file. Multi-file would require zipping.
            const fileToEncrypt = files[0];
            let encryptedBlob: Blob;

            if (encryptionMethod === 'password') {
                encryptedBlob = await cryptoService.encryptFileSymmetric(sodium, fileToEncrypt, password, setProgress);
            } else {
                 if (!privateKey) {
                    showToast(t('authEncSkNeeded'));
                    const { privateKey: newSk } = cryptoService.generateKeyPair(sodium);
                    setPrivateKey(newSk);
                    showToast(t('tempSkGenerated'));
                 }
                encryptedBlob = await cryptoService.encryptFileAsymmetric(sodium, fileToEncrypt, publicKey, privateKey, setProgress);
            }
            
            const url = URL.createObjectURL(encryptedBlob);
            setDownloadUrl(url);
            setEncryptedFileName(`${fileToEncrypt.name}.enc`);
            setCurrentStep(2);

        } catch (e) {
            console.error(e);
            showToast(e instanceof Error ? e.message : t('encryptionError'));
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div>
                        <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">{t('chooseFilesToEncrypt')}</h3>
                        <FileDropzone onFilesAdded={handleFilesAdded} />
                        <FileList files={files} onRemoveFile={handleRemoveFile} />
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setCurrentStep(1)} disabled={files.length === 0} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {t('next')}
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">{t('chooseEncryptionMethod')}</h3>
                        <div className="flex justify-center space-x-4 mb-6">
                            <button onClick={() => setEncryptionMethod('password')} className={`px-4 py-2 rounded-lg font-semibold ${encryptionMethod === 'password' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('password')}</button>
                            <button onClick={() => setEncryptionMethod('publicKey')} className={`px-4 py-2 rounded-lg font-semibold ${encryptionMethod === 'publicKey' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('publicKey')}</button>
                        </div>

                        {encryptionMethod === 'password' ? (
                            <PasswordInput password={password} onPasswordChange={setPassword} onGenerate={handleGeneratePassword} strengthResult={passwordStrength} />
                        ) : (
                            <KeyInput publicKey={publicKey} onPublicKeyChange={setPublicKey} privateKey={privateKey} onPrivateKeyChange={setPrivateKey} onGenerate={handleGenerateKeyPair} />
                        )}
                        
                        <div className="mt-6 flex justify-between">
                            <button onClick={() => setCurrentStep(0)} className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                {t('back')}
                            </button>
                            <button onClick={handleEncrypt} disabled={isProcessing} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400">
                                {isProcessing ? progress : t('encryptFile')}
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-green-500 mb-4">{t('encryptionSuccessful')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('encryptionSuccessMsg')}</p>
                        <a href={downloadUrl!} download={encryptedFileName} className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-600 transition-colors">
                            <DownloadIcon />
                            {t('downloadEncryptedFile')}
                        </a>
                        <div className="mt-8 flex justify-center">
                             <button onClick={handleReset} className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                {t('encryptMoreFiles')}
                            </button>
                        </div>
                    </div>
                );
        }
    };

    if (error) {
        return (
            <div className="text-center p-4 bg-red-700 rounded-lg">
                <p className="text-white mb-4">{t(error as any)}</p>
                <button
                    onClick={retry}
                    className="px-4 py-2 bg-white text-red-700 font-semibold rounded-lg shadow-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-700 focus:ring-white"
                >
                    {t('retry')}
                </button>
            </div>
        );
    }
    if (!isReady) {
        return <div className="text-center p-4">{t('loadingCrypto')}</div>
    }

    return <div>{renderStepContent()}</div>;
};
