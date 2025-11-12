import { useState, useEffect } from 'react';
import { PipeClient, PipeAccountStorage } from 'firestarter-sdk';
import type { PipeAccount } from 'firestarter-sdk';
import AuthCard from './components/AuthCard';
import UploadCard from './components/UploadCard';
import AccountCard from './components/AccountCard';
import FilesGallery from './components/FilesGallery';

// Use /api proxy on Vercel, direct API on localhost
const baseUrl = window.location.hostname === 'localhost'
  ? 'https://us-west-01-firestarter.pipenetwork.com'
  : '/api';

const client = new PipeClient({ baseUrl });
const storage = new PipeAccountStorage();

function App() {
  const [account, setAccount] = useState<PipeAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load saved account
    const savedAccount = storage.load();
    if (savedAccount) {
      setAccount(savedAccount);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const acc = await client.login(username, password);
    setAccount(acc);
    storage.save(acc);
  };

  const handleCreateAccount = async (username: string, password: string) => {
    const acc = await client.createAccount(username, password);
    setAccount(acc);
    storage.save(acc);
  };

  const handleLogout = () => {
    setAccount(null);
    storage.clear();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img src="/firestarter-logo.png" alt="Firestarter" className="h-20" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Firestarter Demo</h1>
          <p className="text-gray-600">
            Experience next-generation decentralized storage powered by{' '}
            <a
              href="https://pipe.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-medium underline"
            >
              Pipe Network
            </a>
          </p>
        </div>

        {!account ? (
          <div className="flex justify-center">
            <AuthCard onLogin={handleLogin} onCreate={handleCreateAccount} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top row: Upload and Account */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UploadCard account={account} client={client} />
              <AccountCard account={account} client={client} onLogout={handleLogout} />
            </div>

            {/* Bottom row: Files Gallery */}
            <FilesGallery account={account} client={client} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
