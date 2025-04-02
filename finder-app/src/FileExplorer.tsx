import React, { useState, useEffect } from 'react';
import {
  Tree,
  ControlledTreeEnvironment,
  TreeItem,
  TreeItemIndex,
  TreeChangeHandlers,
  TreeViewState, 
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import { listFiles, getFileContent, saveFileContent } from './services/sshService';
import { CodeEditor } from './components/CodeEditor';

// Define the shape of our file system items
interface FileSystemItem {
  name: string;
  isDirectory: boolean;
  path: string; 
}

// File content state interface
interface FileContent {
  content: string;
  fileName: string;
  fileType: string;
  contentType: string;
}

// Props interface for the FileExplorer component
interface FileExplorerProps {
  sessionId: string;
  initialPath: string;
}

const TREE_ID = 'file-explorer';

// Helper function to get file extension icon
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Return different symbols based on extension
  switch (extension) {
    case 'txt':
      return '📄'; // Text file
    case 'md':
      return '📝'; // Markdown
    case 'ts':
    case 'js':
      return '📦'; // Code
    case 'json':
      return '🔧'; // Configuration
    case 'jpg':
    case 'png':
    case 'gif':
      return '🖼️'; // Image
    default:
      return '📄'; // Default file
  }
};

// Main component implementation
export function FileExplorer({ sessionId, initialPath }: FileExplorerProps) {
  const [items, setItems] = useState<Record<TreeItemIndex, TreeItem<FileSystemItem>>>({});
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  
  // New state for file content and viewing
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Function to reload the current directory when toggling hidden files
  const reloadCurrentDirectory = async () => {
    if (!items.root) return;
    
    const directoryPath = items.root.data.path;
    try {
      setIsLoading(true);
      console.log(`Reloading directory: ${directoryPath} (showHidden: ${showHidden})`);
      
      const rootChildren = await listFiles(sessionId, directoryPath, showHidden);
      console.log(`Received ${Object.keys(rootChildren).length} items from API`);
      
      // Update the root item's children
      const rootItem: TreeItem<FileSystemItem> = {
        ...items.root,
        children: Object.keys(rootChildren)
      };
      
      // Set all items
      setItems({ ...rootChildren, root: rootItem });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload files');
      console.error('Error reloading files:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle hidden files visibility
  const toggleHiddenFiles = () => {
    const newValue = !showHidden;
    console.log(`Toggling showHidden from ${showHidden} to ${newValue}`);
    setShowHidden(newValue);
  };
  
  // Effect for reloading when showHidden changes
  useEffect(() => {
    if (sessionId && items.root) {
      reloadCurrentDirectory();
    }
  }, [showHidden]);

  // Initial data load for user's home directory
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log(`Loading initial path: "${initialPath}" (showHidden: ${showHidden})`);
        setIsLoading(true);
        setError(null);
        
        // Fetch files from the home directory (or initialPath)
        const directoryPath = initialPath || '/';
        console.log(`Using directory path: "${directoryPath}"`);
        
        const rootChildren = await listFiles(sessionId, directoryPath, showHidden);
        console.log(`Received ${Object.keys(rootChildren).length} items from API`);
        
        // Get a display name for the root directory
        let displayName = '/';
        if (initialPath && initialPath !== '/') {
          const parts = initialPath.split('/').filter(Boolean);
          displayName = parts.length > 0 ? parts[parts.length - 1] : '/';
        }
        console.log(`Using display name: "${displayName}" for root`);
        
        // Create the root item
        const rootItem: TreeItem<FileSystemItem> = {
          index: 'root',
          isFolder: true,
          children: Object.keys(rootChildren),
          data: { 
            name: displayName,
            isDirectory: true, 
            path: directoryPath 
          }
        };
        
        // Set all items
        setItems({ ...rootChildren, root: rootItem });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        console.error('Error loading files:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (sessionId) {
      loadInitialData();
    }
  }, [sessionId, initialPath]);

  // Handlers for tree interactions
  const handleFocusItem: TreeChangeHandlers<FileSystemItem>['onFocusItem'] = (item) => {
    setFocusedItem(item.index);
  };

  const handleExpandItem: TreeChangeHandlers<FileSystemItem>['onExpandItem'] = async (item) => {
    setExpandedItems(prev => [...prev, item.index]);

    if (item.isFolder) {
      const childrenAlreadyFetched = item.children && item.children.length > 0 && item.children.every(childId => items[childId]);

      if (!childrenAlreadyFetched) {
        try {
          setIsLoading(true);
          console.log(`Fetching children for ${item.data.path} (showHidden: ${showHidden})`);
          
          // Fetch children from SSH API with showHidden parameter
          const childrenItems = await listFiles(sessionId, item.data.path, showHidden);
          const childrenIds = Object.keys(childrenItems);

          // Check if there are actually children to add
          if (childrenIds.length > 0) {
            setItems(prevItems => ({
              ...prevItems,
              ...childrenItems,
              [item.index]: { 
                ...prevItems[item.index], 
                children: childrenIds 
              }
            }));
          } else {
            // If no children are found, update the item to show it's empty
            setItems(prevItems => ({
              ...prevItems,
              [item.index]: { 
                ...prevItems[item.index], 
                children: [] 
              }
            }));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load directory contents');
          console.error('Error loading directory contents:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log(`Children for ${item.data.path} already loaded.`);
      }
    }
  };

  const handleCollapseItem: TreeChangeHandlers<FileSystemItem>['onCollapseItem'] = (item) => {
    setExpandedItems(
      expandedItems.filter((expandedItem) => expandedItem !== item.index)
    );
  };

  // Updated selection handler to load file content
  const handleSelectItems: TreeChangeHandlers<FileSystemItem>['onSelectItems'] = async (itemIndices) => {
    setSelectedItems(itemIndices);
    
    // If only one item is selected and it's not a directory, load its content
    if (itemIndices.length === 1) {
      const selectedItemId = itemIndices[0];
      const selectedItem = items[selectedItemId];
      
      if (selectedItem && !selectedItem.isFolder) {
        // It's a file, open it in the editor
        await loadFileContent(selectedItem.data.path);
      } else {
        // It's a directory or multiple selection, close the editor
        setFileViewerOpen(false);
        setSelectedFile(null);
      }
    } else {
      // Multiple or no selection, close the editor
      setFileViewerOpen(false);
      setSelectedFile(null);
    }
  };

  // Function to load file content
  const loadFileContent = async (filePath: string) => {
    setFileLoading(true);
    setFileError(null);
    
    try {
      const fileData = await getFileContent(sessionId, filePath);
      setSelectedFile(fileData);
      setFileViewerOpen(true);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to load file');
      console.error('Error loading file:', err);
    } finally {
      setFileLoading(false);
    }
  };

  // Save file content
  const handleSaveFile = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      // Get the currently selected tree item to find the full path
      const selectedItemId = selectedItems[0];
      const selectedItem = items[selectedItemId];
      
      if (selectedItem && !selectedItem.isFolder) {
        // Use the full path from the selected tree item
        await saveFileContent(sessionId, selectedItem.data.path, content);
      } else {
        // If somehow we don't have the tree item, use the filename
        // (this is a fallback that shouldn't be needed)
        await saveFileContent(sessionId, selectedFile.fileName, content);
      }
      
      // Update the selected file with the new content
      setSelectedFile({
        ...selectedFile,
        content
      });
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error saving file:', err);
      return Promise.reject(err);
    }
  };

  // Close file viewer
  const handleCloseFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
  };

  // Define view state object
  const viewState: TreeViewState<never> = {
      [TREE_ID]: {
          focusedItem,
          expandedItems,
          selectedItems,
      }
  };

  // Simple string function for getItemTitle (needed for accessibility)
  const getItemTitle = (item: TreeItem<FileSystemItem>) => item.data.name;

  if (error) {
    return (
      <div style={{ color: '#ff9999', padding: '16px', backgroundColor: '#5a1c1c', borderRadius: '4px' }}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="explorer-container" 
      style={{ 
        maxWidth: '1200px', // Increased max width for the split view
        margin: '0 auto',
        height: '70vh',
        minHeight: '400px',
        border: '1px solid #444',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        position: 'relative',
        display: 'flex', // Use flexbox for the split view
      }}
    >
      <style>
        {`
          /* Force all backgrounds to be transparent */
          .explorer-container .rct-tree-item-title-container,
          .explorer-container .rct-tree-item--selected,
          .explorer-container .rct-tree-item--focused,
          .explorer-container .rct-tree-item-li,
          .explorer-container .rct-tree-item-li:hover {
            background-color: transparent !important;
            background: none !important;
          }
        `}
      </style>
      
      {/* File tree panel */}
      <div className="file-tree-panel" style={{
        width: fileViewerOpen ? '30%' : '100%',
        borderRight: fileViewerOpen ? '1px solid #444' : 'none',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          display: 'flex',
          gap: '8px'
        }}>
          {/* Toggle button for hidden files */}
          <button
            onClick={toggleHiddenFiles}
            style={{
              backgroundColor: showHidden ? '#2b5797' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{showHidden ? 'Hide' : 'Show'} Hidden Files</span>
          </button>
          
          {/* Loading indicator */}
          {isLoading && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              Loading...
            </div>
          )}
        </div>
        
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
          <ControlledTreeEnvironment<FileSystemItem>
            items={items} 
            viewState={viewState} 
            getItemTitle={getItemTitle}
            onFocusItem={handleFocusItem}
            onExpandItem={handleExpandItem} 
            onCollapseItem={handleCollapseItem}
            onSelectItems={handleSelectItems}
            renderItemArrow={({ item, context }) => (
              <div className="rct-tree-item-arrow">
                {item.isFolder && (context.isExpanded ? '▼' : '►')}
                {!item.isFolder && <span style={{ width: '1em', display: 'inline-block' }}></span>}
              </div>
            )}
            renderItemTitle={({ title, item, context }) => {
              const isSelected = context.isSelected;
              const [isHovered, setIsHovered] = React.useState(false);
              
              const textStyle = {
                color: isSelected 
                  ? '#2b5797' // Blue text for selected 
                  : isHovered 
                    ? '#ffffff' // White text on hover
                    : '#cccccc', // Default light gray
                fontWeight: isSelected ? 500 : 'normal',
              };
              
              return (
                <div
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <span style={{ marginRight: '6px' }}>
                    {item.isFolder ? '📁' : getFileIcon(item.data.name)}
                  </span>
                  <span style={textStyle}>{title}</span>
                </div>
              );
            }}
          >
            {items.root && <Tree treeId={TREE_ID} rootItem="root" treeLabel="Remote File System" />}
          </ControlledTreeEnvironment>
          {Object.keys(items).length === 0 && !isLoading && !error && (
            <div style={{ padding: '20px', color: '#aaa', textAlign: 'center' }}>
              No files loaded yet
            </div>
          )}
        </div>
      </div>
      
      {/* File viewer panel */}
      {fileViewerOpen && (
        <div className="file-viewer-panel" style={{
          width: '70%',
          height: '100%',
          backgroundColor: '#1e1e1e',
          position: 'relative'
        }}>
          {fileLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#e0e0e0',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '8px 16px',
              borderRadius: '4px',
              zIndex: 10
            }}>
              Loading file...
            </div>
          )}
          
          {fileError && (
            <div style={{
              padding: '20px',
              color: '#ff9999',
              backgroundColor: '#5a1c1c',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <h3>Error Loading File</h3>
              <p>{fileError}</p>
              <button
                onClick={handleCloseFileViewer}
                style={{
                  backgroundColor: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  marginTop: '16px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          )}
          
          {selectedFile && !fileLoading && !fileError && (
            <>
              <button
                onClick={handleCloseFileViewer}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'transparent',
                  color: '#cccccc',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              >
                ✕
              </button>
              <CodeEditor
                content={selectedFile.content}
                fileName={selectedFile.fileName}
                fileType={selectedFile.fileType}
                contentType={selectedFile.contentType}
                onSave={handleSaveFile}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
} 