// SSH API Service

const API_URL = process.env.NODE_ENV === 'production' 
  ? `${window.location.origin}/api` 
  : 'http://localhost:3001/api';

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
  try {
    const response = await fetch(`${API_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect');
      } else {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('Error in connectSSH:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while connecting');
    }
  }
};

// List files in a directory
export const listFiles = async (sessionId: string, path: string, showHidden: boolean = false): Promise<Record<string, any>> => {
  try {
    const url = new URL(`${API_URL}/files`);
    url.searchParams.append('sessionId', sessionId);
    url.searchParams.append('path', path);
    url.searchParams.append('showHidden', showHidden.toString());
    
    console.log(`API Request: ${url.toString()}, showHidden=${showHidden}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list files');
      } else {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('Error in listFiles:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while listing files');
    }
  }
};

// Disconnect from SSH server
export const disconnectSSH = async (sessionId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      } else {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.error('Error in disconnectSSH:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while disconnecting');
    }
  }
};

// Get file content
export const getFileContent = async (sessionId: string, filePath: string): Promise<{
  content: string;
  fileName: string;
  fileType: string;
  contentType: string;
}> => {
  try {
    const url = new URL(`${API_URL}/file`);
    url.searchParams.append('sessionId', sessionId);
    url.searchParams.append('path', filePath);

    console.log(`Fetching file content: ${filePath}`);
    
    const response = await fetch(url.toString());

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to read file');
      } else {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('Error in getFileContent:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while reading file');
    }
  }
};

// Save file content
export const saveFileContent = async (sessionId: string, filePath: string, content: string): Promise<void> => {
  console.log(`Saving file content to: ${filePath}`);
  
  try {
    const response = await fetch(`${API_URL}/file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        path: filePath,
        content,
      }),
    });

    if (!response.ok) {
      // Try to parse as JSON first
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save file');
      } else {
        // Not JSON, get the text response
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.error('Error in saveFileContent:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while saving file');
    }
  }
}; 