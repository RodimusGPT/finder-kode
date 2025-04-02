# SSH File Explorer with CodeMirror Integration

A React application that provides a visual file explorer for browsing remote Linux file systems over SSH, using react-complex-tree for the file tree UI and CodeMirror for viewing file contents.

## Features

- SSH connection to remote Linux servers
- Password or private key authentication
- Visual file system explorer with folder navigation
- File type icons for easy identification
- Dark theme with high contrast for readability
- **File content viewing with CodeMirror editor**
- Syntax highlighting for various file types

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Access to a Linux SSH server

### Installation

1. **Clone this repository**

2. **Set up the backend**:
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Set up the frontend**:
   ```bash
   cd finder-app
   npm install
   
   # Install CodeMirror packages
   npm install @codemirror/basic-setup @codemirror/view @codemirror/state @codemirror/language @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-markdown @codemirror/lang-html @codemirror/lang-css
   
   npm run dev
   ```

4. Open the application in your browser (typically http://localhost:5173)

## Usage

1. Enter SSH connection details (host, username, password/key)
2. Connect to the remote server
3. Browse the file system using the tree view
4. Click on a file to view its contents in the CodeMirror editor

## Deployment

For deployment instructions, see the [Deployment Guide](#deployment-guide).

## Project Structure

The project consists of two parts:

1. **Frontend**: React application with TypeScript
   - `FileExplorer.tsx`: Main component with file tree navigation
   - `CodeEditor.tsx`: CodeMirror integration for file viewing
   - `services/sshService.ts`: API client for SSH operations

2. **Backend**: Node.js Express server that handles SSH connections
   - `server.js`: Express server with SSH2 for remote connections
   - API endpoints for listing directories and viewing files

## License

MIT 