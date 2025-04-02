// SSH API Service

const API_URL = 'http://localhost:3001/api';

export interface SSHConnectionParams {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface SSHConnectionResponse {
  sessionId: string;
  homeDir: string;
  message: string;
}

export interface FileSystemEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface APIError {
  error: string;
  stderr?: string;
}

// Connect to SSH server
export const connectSSH = async (params: SSHConnectionParams): Promise<SSHConnectionResponse> => {
  const response = await fetch(`${API_URL}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to connect');
  }

  return response.json();
};

// List files in a directory
export const listFiles = async (sessionId: string, path: string, showHidden: boolean = false): Promise<Record<string, any>> => {
  const url = new URL(`${API_URL}/files`);
  url.searchParams.append('sessionId', sessionId);
  url.searchParams.append('path', path);
  url.searchParams.append('showHidden', showHidden.toString());
  
  console.log(`API Request: ${url.toString()}, showHidden=${showHidden}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to list files');
  }

  return response.json();
};

// Disconnect from SSH server
export const disconnectSSH = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to disconnect');
  }
}; 