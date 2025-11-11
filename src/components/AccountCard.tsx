import { useState, useEffect } from 'react';
import { PipeClient } from 'firestarter-sdk';
import type { PipeAccount, Balance } from 'firestarter-sdk';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';

interface AccountCardProps {
  account: PipeAccount;
  client: PipeClient;
  onLogout: () => void;
}

function AccountCard({ account, client, onLogout }: AccountCardProps) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadBalance();

    // Listen for uploads to refresh balance
    const handleFileUploaded = () => {
      loadBalance();
    };

    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => window.removeEventListener('fileUploaded', handleFileUploaded);
  }, []);

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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const InfoRow = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center py-2 border-b border-gray-100 last:border-0" style={{ gap: '12px' }}>
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}:</span>
      <span className="text-xs font-mono text-gray-900 truncate flex-1" title={value}>{value}</span>
      <button
        onClick={() => copyToClipboard(value, field)}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        title="Copy to clipboard"
      >
        {copiedField === field ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        <button
          onClick={onLogout}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Balance */}
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
          <Wallet className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-1">
        <InfoRow label="Username" value={account.username} field="username" />
        <InfoRow label="Password" value={account.password} field="password" />
        <InfoRow label="User ID" value={account.userId} field="userId" />
        <InfoRow label="User App Key" value={account.userAppKey} field="userAppKey" />
        {balance && (
          <InfoRow label="Pipe Address" value={balance.publicKey} field="publicKey" />
        )}
      </div>
    </div>
  );
}

export default AccountCard;
