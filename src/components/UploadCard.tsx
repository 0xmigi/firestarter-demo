import { useState, useRef, useMemo } from 'react';
import { PipeClient, PipeFileStorage } from 'firestarter-sdk';
import type { PipeAccount, UploadResult } from 'firestarter-sdk';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadCardProps {
  account: PipeAccount;
  client: PipeClient;
}

function UploadCard({ account, client }: UploadCardProps) {
  // Create account-specific file storage using username as key
  const fileStorage = useMemo(
    () => new PipeFileStorage(`firestarter_files_${account.username}`),
    [account.username]
  );

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(0);
    setUploadedFile(null);

    try {
      const result = await client.uploadFile(account, file, file.name, {
        onProgress: (percent) => setProgress(percent),
      });

      // Save to local storage for tracking
      fileStorage.addFile(result);
      setUploadedFile(result);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Dispatch event to notify FilesGallery
      window.dispatchEvent(new Event('fileUploaded'));
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
          >
            <div className="space-y-2">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-900">
                Click to select a file
              </div>
              <div className="text-xs text-gray-500">
                or drag and drop
              </div>
            </div>
          </label>
        </div>

        {/* Permanent Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {uploading ? 'Uploading...' : uploadedFile ? 'Upload complete' : 'Ready to upload'}
            </span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                uploadedFile ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {uploadedFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Upload successful!
                </p>
                <p className="text-xs text-green-700 truncate">
                  {uploadedFile.fileName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-900">How it works</h3>
          <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
            <li>Files are uploaded to Pipe Network's decentralized storage</li>
            <li>Using UDP++ protocol for optimal performance</li>
            <li>P1 routing automatically selects best paths</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadCard;
