const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the frontend
app.use(cors());
app.use(express.json());

// Store SSH connections
const sshSessions = new Map();

// Connect to SSH server
app.post('/api/connect', async (req, res) => {
  const { host, port, username, password, privateKey } = req.body;
  
  if (!host || !username || (!password && !privateKey)) {
    return res.status(400).json({ error: 'Missing required connection parameters' });
  }
  
  const conn = new Client();
  const sessionId = Date.now().toString();
  
  try {
    // Create a promise to handle the connection
    const connectionPromise = new Promise((resolve, reject) => {
      conn.on('ready', () => {
        console.log(`SSH connection established to ${host}`);
        resolve();
      });
      
      conn.on('error', (err) => {
        console.error('SSH connection error:', err);
        reject(err);
      });
    });
    
    // Connect with either password or private key
    const connectConfig = {
      host,
      port: port || 22,
      username,
    };
    
    if (password) {
      connectConfig.password = password;
    } else if (privateKey) {
      connectConfig.privateKey = privateKey;
    }
    
    conn.connect(connectConfig);
    
    // Wait for connection to establish
    await connectionPromise;
    
    // Get the home directory
    let homeDir = '';
    try {
      await new Promise((resolve, reject) => {
        conn.exec('echo $HOME', (err, stream) => {
          if (err) {
            return reject(err);
          }
          
          let data = '';
          stream.on('data', (chunk) => {
            data += chunk;
          });
          
          stream.on('close', () => {
            homeDir = data.trim();
            console.log(`Retrieved home directory: ${homeDir}`);
            resolve();
          });
          
          stream.stderr.on('data', (chunk) => {
            reject(new Error(chunk.toString()));
          });
        });
      });
    } catch (err) {
      console.warn('Could not determine home directory:', err);
      homeDir = '/'; // Fallback to root
    }
    
    // Store the connection
    sshSessions.set(sessionId, {
      conn,
      homeDir
    });
    
    console.log(`Connected to ${host} as ${username}, home directory: ${homeDir}`);
    
    res.status(200).json({ 
      sessionId, 
      homeDir,
      message: 'Connected successfully'
    });
  } catch (error) {
    console.error('Failed to connect:', error);
    res.status(500).json({ error: error.message || 'Failed to connect' });
  }
});

// List files in a directory
app.get('/api/files', async (req, res) => {
  const { sessionId, path, showHidden } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  const session = sshSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  
  const conn = session.conn;
  const remotePath = path || session.homeDir || '/';
  const shouldShowHidden = showHidden === 'true';
  
  try {
    // Use different ls command based on whether we want to show hidden files
    const lsCommand = shouldShowHidden ? `ls -la "${remotePath}"` : `ls -l "${remotePath}"`;
    console.log(`Executing: ${lsCommand} (showHidden: ${shouldShowHidden})`);
    
    // Execute a command to list files
    conn.exec(lsCommand, (err, stream) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let data = '';
      let errorData = '';
      
      stream.on('data', (chunk) => {
        data += chunk;
      });
      
      stream.stderr.on('data', (chunk) => {
        errorData += chunk;
      });
      
      stream.on('close', (code) => {
        if (code !== 0) {
          return res.status(500).json({ 
            error: 'Command failed', 
            stderr: errorData 
          });
        }
        
        // Format the data into a structure for react-complex-tree
        const lines = data.split('\n').filter(line => line.trim() !== '');
        // Skip total and . / .. entries
        const entries = lines.slice(1)
          .filter(line => !line.match(/^total/) && !line.match(/\s+\.\.?$/))
          .map(line => {
            // Parse ls output
            const match = line.match(/^([d-]).*?\s+\d+\s+\w+\s+\w+\s+\d+\s+\w+\s+\d+\s+[\d:]+\s+(.+)$/);
            if (match) {
              const isDirectory = match[1] === 'd';
              const name = match[2];
              
              // We no longer need this check since we're using the right ls command
              // if (!shouldShowHidden && name.startsWith('.')) {
              //   return null;
              // }
              
              return {
                name,
                isDirectory,
                path: `${remotePath}/${name}`.replace(/\/\//g, '/')
              };
            }
            return null;
          })
          .filter(entry => entry !== null);
        
        console.log(`Found ${entries.length} entries in ${remotePath}`);
          
        // Convert to the format expected by react-complex-tree
        const result = {};
        entries.forEach(entry => {
          const itemPath = entry.path;
          const itemId = itemPath; // Use path as ID
          
          result[itemId] = {
            index: itemId,
            isFolder: entry.isDirectory,
            data: {
              name: entry.name,
              isDirectory: entry.isDirectory,
              path: itemPath
            }
          };
          
          // For directories, we need to include a children array
          // But we'll only fill it when the directory is actually expanded
          if (entry.isDirectory) {
            result[itemId].children = [];
          }
        });
        
        res.json(result);
      });
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message || 'Failed to list files' });
  }
});

// Get file content
app.get('/api/file', async (req, res) => {
  const { sessionId, path } = req.query;
  
  if (!sessionId || !path) {
    return res.status(400).json({ error: 'Session ID and file path are required' });
  }
  
  const session = sshSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  
  const conn = session.conn;
  
  try {
    // Execute a command to read the file
    conn.exec(`cat "${path}"`, (err, stream) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let data = '';
      let errorData = '';
      
      stream.on('data', (chunk) => {
        data += chunk;
      });
      
      stream.stderr.on('data', (chunk) => {
        errorData += chunk;
      });
      
      stream.on('close', (code) => {
        if (code !== 0) {
          return res.status(500).json({ 
            error: 'Failed to read file', 
            stderr: errorData 
          });
        }
        
        // Attempt to determine file type from extension
        const fileExt = path.split('.').pop().toLowerCase();
        const mimeTypes = {
          'js': 'application/javascript',
          'ts': 'application/typescript',
          'html': 'text/html',
          'css': 'text/css',
          'json': 'application/json',
          'md': 'text/markdown',
          'txt': 'text/plain',
          'py': 'text/x-python',
          'sh': 'text/x-sh',
          'php': 'text/x-php',
        };
        
        const contentType = mimeTypes[fileExt] || 'text/plain';
        
        // Return the file content
        res.json({
          content: data,
          fileName: path.split('/').pop(),
          fileType: fileExt,
          contentType,
        });
      });
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: error.message || 'Failed to read file' });
  }
});

// Save file content
app.post('/api/file', async (req, res) => {
  const { sessionId, path, content } = req.body;
  
  if (!sessionId || !path || content === undefined) {
    return res.status(400).json({ error: 'Session ID, file path, and content are required' });
  }
  
  const session = sshSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  
  const conn = session.conn;
  
  try {
    // Create a temporary file with the content
    const tempFile = `/tmp/temp_edit_${Date.now()}.txt`;
    const writeCommand = `cat > "${tempFile}" << 'EOL'\n${content}\nEOL`;
    
    // Execute command to write to temp file
    await new Promise((resolve, reject) => {
      conn.exec(writeCommand, (err, stream) => {
        if (err) return reject(err);
        
        let errorData = '';
        
        stream.stderr.on('data', (chunk) => {
          errorData += chunk;
        });
        
        stream.on('close', (code) => {
          if (code !== 0) {
            return reject(new Error(`Failed to create temp file: ${errorData}`));
          }
          resolve();
        });
      });
    });
    
    // Move the temp file to the target location
    await new Promise((resolve, reject) => {
      conn.exec(`mv "${tempFile}" "${path}"`, (err, stream) => {
        if (err) return reject(err);
        
        let errorData = '';
        
        stream.stderr.on('data', (chunk) => {
          errorData += chunk;
        });
        
        stream.on('close', (code) => {
          if (code !== 0) {
            return reject(new Error(`Failed to save file: ${errorData}`));
          }
          resolve();
        });
      });
    });
    
    res.status(200).json({ message: 'File saved successfully' });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: error.message || 'Failed to save file' });
  }
});

// Close SSH connection
app.post('/api/disconnect', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  const session = sshSessions.get(sessionId);
  if (session) {
    session.conn.end();
    sshSessions.delete(sessionId);
    console.log(`Closed SSH connection for session ${sessionId}`);
  }
  
  res.status(200).json({ message: 'Disconnected successfully' });
});

// Clean up connections when server shuts down
process.on('SIGINT', () => {
  console.log('Closing all SSH connections...');
  for (const [sessionId, session] of sshSessions.entries()) {
    session.conn.end();
    sshSessions.delete(sessionId);
  }
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 