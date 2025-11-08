import React, { useState, useCallback } from 'react';
import { useSodium } from '../hooks/useSodium';
import * as cryptoService from '../services/cryptoService';
import type { EncryptionMethod } from '../types';
import { FileDropzone } from './FileDropzone';
import { TrashIcon, DownloadIcon } from './icons';
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

export const DecryptionPanel: React.FC<{ showToast: (message: string) => void }> = ({ showToast }) => {
    const { sodium, isReady, error, retry } = useSodium();
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [detectedMethod, setDetectedMethod] = useState<EncryptionMethod | 'unknown' | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [password, setPassword] = useState('');
    const [senderPublicKey, setSenderPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [decryptedFileName, setDecryptedFileName] = useState('');

    const handleReset = useCallback(() => {
        setCurrentStep(0);
        setFiles([]);
        setDetectedMethod(null);
        setIsAnalyzing(false);
        setPassword('');
        setSenderPublicKey('');
        setPrivateKey('');
        setIsProcessing(false);
        setProgress('');
        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
        }
        setDownloadUrl(null);
        setDecryptedFileName('');
    }, [downloadUrl]);

    const handleFilesAdded = useCallback(async (newFiles: File[]) => {
        if (!isReady || newFiles.length === 0) return;
        // Simple approach: only handle the first file if multiple are dropped.
        const file = newFiles[0]; 
        setFiles([file]);
        setCurrentStep(1);
        setIsAnalyzing(true);
        try {
            const method = await cryptoService.detectEncryptionMethod(sodium, file);
            setDetectedMethod(method);
            if (method === 'unknown') {
                showToast(t('detectMethodError'));
            }
        } catch (e) {
            console.error(e);
            showToast(t('fileAnalysisError'));
            handleReset();
        } finally {
            setIsAnalyzing(false);
        }
    }, [isReady, sodium, showToast, t, handleReset]);

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(currentFiles => {
            const newFiles = currentFiles.filter((_, i) => i !== index);
            if (newFiles.length === 0) {
                handleReset();
            }
            return newFiles;
        });
    }, [handleReset]);

    const handleDecrypt = async () => {
        if (!isReady || files.length === 0 || !detectedMethod || detectedMethod === 'unknown') return;

        if (detectedMethod === 'password' && !password) {
            showToast(t('passwordRequired'));
            return;
        }
        if (detectedMethod === 'publicKey' && (!senderPublicKey || !privateKey)) {
            showToast(t('bothKeysRequired'));
            return;
        }

        setIsProcessing(true);
        setProgress(t('startingDecryption'));

        try {
            const fileToDecrypt = files[0];
            let decryptedBlob: Blob;

            if (detectedMethod === 'password') {
                decryptedBlob = await cryptoService.decryptFileSymmetric(sodium, fileToDecrypt, password, setProgress);
            } else { // publicKey
                decryptedBlob = await cryptoService.decryptFileAsymmetric(sodium, fileToDecrypt, senderPublicKey, privateKey, setProgress);
            }

            const url = URL.createObjectURL(decryptedBlob);
            setDownloadUrl(url);
            setDecryptedFileName(fileToDecrypt.name.replace(/\.enc$/, ''));
            setCurrentStep(2);
        } catch (e) {
            console.error(e);
            showToast(e instanceof Error ? e.message : t('decryptionError'));
        } finally {
            setIsProcessing(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div>
                        <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">{t('chooseFilesToDecrypt')}</h3>
                        <FileDropzone onFilesAdded={handleFilesAdded} />
                        <FileList files={files} onRemoveFile={handleRemoveFile} />
                    </div>
                );
            case 1:
                return (
                    <div>
                        <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">{t('enterDecryptCredentials')}</h3>
                        {isAnalyzing ? (
                             <p className="text-center">{t('analyzing')}</p>
                        ) : detectedMethod === 'password' ? (
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('passwordPlaceholderDecrypt')}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        ) : detectedMethod === 'publicKey' ? (
                            <div className="space-y-4">
                                <textarea
                                    value={senderPublicKey}
                                    onChange={e => setSenderPublicKey(e.target.value)}
                                    placeholder={t('senderPublicKey')}
                                    rows={2}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                />
                                <textarea
                                    value={privateKey}
                                    onChange={e => setPrivateKey(e.target.value)}
                                    placeholder={t('yourPrivateKey')}
                                    rows={2}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                />
                            </div>
                        ) : (
                            <p className="text-center text-red-500">{t('detectMethodError')}</p>
                        )}

                        <div className="mt-6 flex justify-between">
                            <button onClick={handleReset} className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                {t('back')}
                            </button>
                            <button onClick={handleDecrypt} disabled={isProcessing || isAnalyzing || !detectedMethod || detectedMethod === 'unknown'} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400">
                                {isProcessing ? progress : t('decryptFile')}
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-green-500 mb-4">{t('decryptionSuccessful')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('decryptionSuccessMsg')}</p>
                        <a href={downloadUrl!} download={decryptedFileName} className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-600 transition-colors">
                            <DownloadIcon />
                            {t('downloadDecryptedFile')}
                        </a>
                        <div className="mt-8 flex justify-center">
                            <button onClick={handleReset} className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                {t('decryptMoreFiles')}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
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
        return <div className="text-center p-4">{t('loadingCrypto')}</div>;
    }

    return <div>{renderStepContent()}</div>;
};
