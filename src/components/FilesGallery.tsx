import { useState, useEffect, useMemo } from 'react';
import { PipeClient, PipeFileStorage } from 'firestarter-sdk';
import type { PipeAccount, UploadResult } from 'firestarter-sdk';
import { Download, Share2, Trash2, File as FileIcon, X, Grid3x3, List, Info } from 'lucide-react';

interface FilesGalleryProps {
  account: PipeAccount;
  client: PipeClient;
}

type ViewMode = 'grid' | 'list';

function FilesGallery({ account, client }: FilesGalleryProps) {
  // Create account-specific file storage using the new forAccount helper
  const fileStorage = useMemo(
    () => PipeFileStorage.forAccount(account),
    [account.username]
  );

  const [files, setFiles] = useState<UploadResult[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadResult | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    loadFiles();

    // Listen for new uploads
    const handleFileUploaded = () => {
      loadFiles();
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, []);

  const loadFiles = async () => {
    const storedFiles = fileStorage.listFiles();
    setFiles(storedFiles);

    // Load image previews for image files
    const previews: Record<string, string> = {};
    for (const file of storedFiles) {
      if (isImageFile(file.fileName)) {
        try {
          const uint8Array = await client.downloadFile(account, file.fileName);
          const blob = new Blob([uint8Array as unknown as BlobPart]);
          previews[file.fileId] = URL.createObjectURL(blob);
        } catch (err) {
          console.error('Failed to load preview for', file.fileName, err);
        }
      }
    }
    setImagePreviews(previews);
  };

  const isImageFile = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };

  const handleDownload = async (file: UploadResult) => {
    setDownloading(file.fileId);
    try {
      const uint8Array = await client.downloadFile(account, file.fileName);
      const blob = new Blob([uint8Array as unknown as BlobPart]);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
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
      // Use fileName (not fileId) for the delete API
      await client.deleteFile(account, file.fileName);
      fileStorage.removeFile(file.fileId);

      // Clean up image preview
      if (imagePreviews[file.fileId]) {
        URL.revokeObjectURL(imagePreviews[file.fileId]);
      }

      loadFiles();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const generateShareLink = async (file: UploadResult) => {
    setSelectedFile(file);
    setLinkCopied(false);

    try {
      // Use the real createPublicLink API
      const publicLink = await client.createPublicLink(account, file.fileName);
      setShareLink(publicLink.shareUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to create share link');
      setSelectedFile(null);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-gray-900">Your Files</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="About file tracking"
          >
            <Info className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* View Toggle */}
        {files.length > 0 && (
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${ viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        <div className="p-12 text-center">
          <FileIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No files uploaded yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {files.map((file) => (
            <div
              key={file.fileId}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              style={{ width: '200px', height: '280px', display: 'flex', flexDirection: 'column' }}
            >
              {/* Image container - fixed square */}
              <div style={{ width: '100%', height: '200px', flexShrink: 0, position: 'relative' }} className="group cursor-pointer">
                {imagePreviews[file.fileId] ? (
                  <img
                    src={imagePreviews[file.fileId]}
                    alt={file.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <FileIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>

              {/* File info */}
              <div className="p-2 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate" title={file.fileName}>
                  {file.fileName}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>

              {/* Actions - bottom left corner of card */}
              <div className="flex items-center px-2 pb-2" style={{ gap: '16px' }}>
                <button
                  onClick={() => handleDownload(file)}
                  disabled={downloading === file.fileId}
                  className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download size={14} className="text-gray-600" />
                </button>
                <button
                  onClick={() => generateShareLink(file)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Share"
                >
                  <Share2 size={14} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0">
          {files.map((file, index) => (
            <div
              key={file.fileId}
              className={`flex items-center justify-between py-3 px-4 ${
                index !== files.length - 1 ? 'border-b border-gray-300' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 truncate">{file.fileName}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-gray-500 w-16 text-right">{formatFileSize(file.size)}</span>
                <span className="text-xs text-gray-500 w-32 text-right">{formatDate(file.uploadedAt)}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.fileId}
                    className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                    title="Download"
                  >
                    <Download size={14} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => generateShareLink(file)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Share"
                  >
                    <Share2 size={14} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Link Modal */}
      {selectedFile && shareLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Share File
              </h3>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setShareLink('');
                  setLinkCopied(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4 truncate" title={selectedFile.fileName}>
              {selectedFile.fileName}
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-500 mb-1">Share Link</p>
              <p className="text-sm text-gray-900 break-all font-mono">
                {shareLink}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyShareLink}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setShareLink('');
                  setLinkCopied(false);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Tracking Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  About File Tracking
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-900">Local Storage Only:</strong> File tracking is currently saved locally in your browser due to an API limitation.
              </p>
              <p>
                <strong className="text-gray-900">Your files are safe:</strong> All uploaded files remain securely stored on the Pipe Network and are <em>not</em> lost.
              </p>
              <p>
                <strong className="text-gray-900">Accessing from other devices:</strong> When logging in from another device or browser with the same account, your file list will appear empty. However, your files are still accessible if you know their names.
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                We hope the Pipe Network API will add a file listing endpoint in the future to enable cross-device file tracking.
              </p>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilesGallery;
