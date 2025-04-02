# SSH File Explorer

A React application that provides a visual file explorer for browsing remote Linux file systems over SSH, using react-complex-tree for the file tree UI.

## Features

- SSH connection to remote Linux servers
- Password or private key authentication
- Visual file system explorer with folder navigation
- File type icons for easy identification
- Dark theme with high contrast for readability

## Project Structure

The project consists of two parts:

1. **Frontend**: React application with TypeScript
2. **Backend**: Node.js Express server that handles SSH connections

## Setup

### Prerequisites

- Node.js 14+ and npm
- Access to a Linux SSH server

### Backend Setup

```bash
cd server
npm install
npm start
```

The server will start at http://localhost:3001.

### Frontend Setup

```bash
cd finder-app
npm install
npm run dev
```

The frontend will start at http://localhost:5173 (or another port if 5173 is in use).

## Usage

1. Open the application in your browser
2. Enter the SSH connection details:
   - Host (hostname or IP address)
   - Port (default: 22)
   - Username
   - Password or Private Key
3. Click 'Connect'
4. Use the file explorer to navigate the remote file system:
   - Click on folders to expand/collapse them
   - Icons indicate file types

## Technologies Used

- **Frontend**:
  - React with TypeScript
  - react-complex-tree for the file explorer UI
  - CSS for styling
  
- **Backend**:
  - Node.js with Express
  - ssh2 for SSH connectivity

## Security Considerations

- SSH credentials are only stored in memory during the session
- Connections are closed when the user disconnects or the session ends
- For production use, consider adding:
  - HTTPS for secure communication between browser and backend
  - JWT or session-based authentication for the backend API
  - Input validation/sanitization for paths

## License

MIT 