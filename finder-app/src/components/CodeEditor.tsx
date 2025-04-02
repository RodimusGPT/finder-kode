import React, { useState, useEffect } from 'react';

// Note: You need to install these packages:
// npm install @codemirror/basic-setup @codemirror/view @codemirror/state @codemirror/language @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-markdown @codemirror/lang-html @codemirror/lang-css

interface CodeEditorProps {
  content: string;
  fileName: string;
  fileType: string;
  contentType: string; // Used for MIME type information
  onSave?: (content: string) => Promise<void>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, fileName, fileType, contentType: _contentType, onSave }) => {
  const [editableContent, setEditableContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Update the content when the prop changes
  useEffect(() => {
    setEditableContent(content);
    setIsEditing(false);
    setSaveError(null);
  }, [content, fileName]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
  };
  
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };
  
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(editableContent);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save file');
      console.error('Error saving file:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Simple fallback until CodeMirror dependencies are installed
  return (
    <div className="code-editor-container" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0'
    }}>
      <div className="code-editor-header" style={{ 
        padding: '8px 12px',
        backgroundColor: '#252526',
        color: '#e0e0e0',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="file-name" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '6px' }}>
            {getFileIcon(fileName)}
          </span>
          <span>{fileName}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onSave && (
            <>
              {isEditing ? (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#2b5797',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              ) : null}
              <button 
                onClick={handleToggleEdit}
                style={{
                  backgroundColor: isEditing ? '#772b2b' : '#3a3a3a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </>
          )}
          <div className="file-type-badge" style={{
            fontSize: '12px',
            backgroundColor: '#383838', 
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {fileType.toUpperCase()}
          </div>
        </div>
      </div>
      
      {saveError && (
        <div style={{ 
          backgroundColor: '#5a1c1c', 
          color: '#ff9999', 
          padding: '8px 12px',
          fontSize: '14px'
        }}>
          Error: {saveError}
        </div>
      )}
      
      {isEditing ? (
        <textarea
          value={editableContent}
          onChange={handleContentChange}
          style={{ 
            flexGrow: 1,
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
            border: 'none',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            resize: 'none'
          }}
        />
      ) : (
        <div 
          className="code-content"
          style={{ 
            flexGrow: 1,
            overflow: 'auto',
            padding: '16px',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          {editableContent}
        </div>
      )}
      
      <div style={{ padding: '8px 12px', backgroundColor: '#252526', borderTop: '1px solid #3a3a3a', fontSize: '12px' }}>
        <p>Note: Install CodeMirror dependencies to enable syntax highlighting and advanced editor features.</p>
      </div>
    </div>
  );
};

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
    case 'html':
    case 'htm':
      return '🌐'; // HTML
    case 'css':
      return '🎨'; // CSS
    case 'py':
      return '🐍'; // Python
    default:
      return '📄'; // Default file
  }
}; 