import { useState, useEffect } from 'react';
import { PipeClient, PipeFileStorage } from 'firestarter-sdk';
import type { PipeAccount, UploadResult, Balance } from 'firestarter-sdk';

interface UploadsCardProps {
  account: PipeAccount;
  client: PipeClient;
  onLogout: () => void;
}

const fileStorage = new PipeFileStorage();

function UploadsCard({ account, client, onLogout }: UploadsCardProps) {
  const [files, setFiles] = useState<UploadResult[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [selectedFile, setSelectedFile] = useState<UploadResult | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string>('');

  useEffect(() => {
    loadFiles();
    loadBalance();

    // Listen for new uploads
    const handleFileUploaded = () => {
      loadFiles();
      loadBalance(); // Refresh balance after upload
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, []);

  const loadFiles = () => {
    const storedFiles = fileStorage.listFiles();
    setFiles(storedFiles);
  };

  const loadBalance = async () => {
    try {
      const bal = await client.getBalance(account);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleDownload = async (file: UploadResult) => {
    setDownloading(file.fileId);
    try {
      const blob = await client.downloadFile(account, file.fileName);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file: UploadResult) => {
    if (!confirm(`Delete ${file.fileName}?`)) return;

    try {
      await client.deleteFile(account, file.fileId);
      fileStorage.removeFile(file.fileId);
      loadFiles();
      loadBalance();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const generateShareLink = (file: UploadResult) => {
    setSelectedFile(file);
    // For demo purposes, creating a simple share link
    // In production, you'd want to implement proper public sharing
    const link = `${window.location.origin}/share/${file.fileId}`;
    setShareLink(link);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with balance and logout */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Files</h2>
          <p className="text-xs text-gray-500 mt-1">
            User: {account.username}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Logout
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">Balance</p>
            {loadingBalance ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : balance ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">
                  {balance.pipe.toFixed(2)} PIPE
                </p>
                <p className="text-xs text-gray-600">
                  {balance.sol.toFixed(4)} SOL
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-600">Failed to load</p>
            )}
          </div>
          <div className="text-3xl">💰</div>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No files uploaded yet</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.fileId}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.fileId}
                  className="flex-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  {downloading === file.fileId ? 'Downloading...' : 'Download'}
                </button>
                <button
                  onClick={() => generateShareLink(file)}
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share Link Modal */}
      {selectedFile && shareLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Share File
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedFile.fileName}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-500 mb-1">Share Link</p>
              <p className="text-sm text-gray-900 break-all font-mono">
                {shareLink}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={copyShareLink}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setShareLink('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadsCard;
