// File: src/components/ActionButtons.tsx
import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ActionButtonsProps {
    resetToDefaults: () => void;
    handleShare: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ resetToDefaults, handleShare }) => {
    const [showCopied, setShowCopied] = useState(false);

    const onShare = () => {
        handleShare();
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300"
                title="Reset to Defaults"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
                Reset to Defaults
            </button>

            <button
                onClick={onShare}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Share Calculator Settings"
            >
                {showCopied ? (
                    <>
                        <Check className="w-4 h-4" />
                        Link Copied!
                    </>
                ) : (
                    <>
                        <Share2 className="w-4 h-4" />
                        Share Settings
                    </>
                )}
            </button>
        </div>
    );
};