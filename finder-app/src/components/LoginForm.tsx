import React, { useState } from 'react';
import { SSHConnectionParams, connectSSH } from '../services/sshService';

interface LoginFormProps {
  onConnect: (sessionId: string, homeDir: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onConnect }) => {
  const [formData, setFormData] = useState<SSHConnectionParams>({
    host: '',
    port: 22,
    username: '',
    password: '',
  });
  const [useKey, setUseKey] = useState(true);
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || '' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      // Create connection params
      const connectionParams: SSHConnectionParams = {
        ...formData,
      };

      // Use either password or key
      if (useKey) {
        delete connectionParams.password;
        connectionParams.privateKey = privateKey;
      } else {
        delete connectionParams.privateKey;
      }

      const response = await connectSSH(connectionParams);
      console.log('Connected successfully:', response);
      console.log('Home directory:', response.homeDir);
      onConnect(response.sessionId, response.homeDir);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="login-form-container" style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#1e1e1e',
      borderRadius: '6px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    }}>
      <h2 style={{ marginTop: 0, color: '#e0e0e0', textAlign: 'center' }}>Connect to SSH Server</h2>
      
      {error && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#5a1c1c', 
          color: '#ff9999',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="host" 
            style={{ display: 'block', marginBottom: '6px', color: '#e0e0e0' }}
          >
            Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff'
            }}
            placeholder="e.g., example.com or 192.168.1.1"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="port" 
            style={{ display: 'block', marginBottom: '6px', color: '#e0e0e0' }}
          >
            Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff'
            }}
            placeholder="22"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="username" 
            style={{ display: 'block', marginBottom: '6px', color: '#e0e0e0' }}
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <input
              type="checkbox"
              id="useKey"
              checked={useKey}
              onChange={() => setUseKey(!useKey)}
              style={{ accentColor: '#2b5797' }}
            />
            <label htmlFor="useKey" style={{ color: '#e0e0e0' }}>
              Use Private Key Instead of Password
            </label>
          </div>
          
          {useKey ? (
            <div>
              <label 
                htmlFor="privateKey" 
                style={{ display: 'block', marginBottom: '6px', color: '#e0e0e0' }}
              >
                Private Key
              </label>
              <textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required={useKey}
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '8px 12px',
                  backgroundColor: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
                placeholder="Paste your private key here (including BEGIN and END lines)"
              />
            </div>
          ) : (
            <div>
              <label 
                htmlFor="password" 
                style={{ display: 'block', marginBottom: '6px', color: '#e0e0e0' }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!useKey}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#333',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isConnecting}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2b5797',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnecting ? 'wait' : 'pointer',
            opacity: isConnecting ? 0.7 : 1
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </form>
    </div>
  );
}; 