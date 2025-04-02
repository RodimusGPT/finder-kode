import { useState, useEffect } from 'react';
import './App.css';
import './theme.css';
import { FileExplorer } from './FileExplorer';
import { LoginForm } from './components/LoginForm';
import { disconnectSSH } from './services/sshService';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [homeDir, setHomeDir] = useState<string>('');

  // Clean up SSH connection when component unmounts
  useEffect(() => {
    return () => {
      if (sessionId) {
        disconnectSSH(sessionId).catch(console.error);
      }
    };
  }, [sessionId]);

  const handleConnect = (id: string, homeDirPath: string) => {
    console.log(`Connected with session ID: ${id}, home directory: ${homeDirPath}`);
    setSessionId(id);
    setHomeDir(homeDirPath);
  };

  const handleDisconnect = async () => {
    if (sessionId) {
      try {
        await disconnectSSH(sessionId);
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
      setSessionId(null);
      setHomeDir('');
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Remote File Explorer</h1>
        {sessionId && (
          <button 
            onClick={handleDisconnect}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        )}
      </header>

      <main>
        {!sessionId ? (
          <LoginForm onConnect={handleConnect} />
        ) : (
          <FileExplorer sessionId={sessionId} initialPath={homeDir} />
        )}
      </main>
    </div>
  );
}

export default App;
