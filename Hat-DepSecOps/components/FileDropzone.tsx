
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';

interface FileDropzoneProps {
    onFilesAdded: (files: File[]) => void;
    disabled?: boolean;
    accept?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded, disabled = false, accept }) => {
    const { t } = useTranslation();
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFilesAdded(Array.from(e.dataTransfer.files));
        }
    }, [onFilesAdded]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFilesAdded(Array.from(e.target.files));
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'} border-dashed rounded-md transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400 dark:hover:border-primary-500'}`}
        >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} disabled={disabled} accept={accept} />
            <div className="space-y-1 text-center">
                <UploadCloudIcon />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <button
                        type="button"
                        onClick={onButtonClick}
                        disabled={disabled}
                        className="relative bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                        <span>{t('uploadFiles')}</span>
                    </button>
                    <p className="pl-1">{t('dragAndDrop')}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">{t('selectFiles')}</p>
            </div>
        </div>
    );
};
