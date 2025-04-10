// File manipulation functions to include in your frontend JavaScript

// API endpoint (adjust based on your deployment)
const API_URL = 'http://your-server-address:3000/api';

// Get list of files
async function getFiles(directory = '') {
  try {
    const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(directory)}`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return await response.json();
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

// Get file content
async function getFileContent(filePath) {
  try {
    const response = await fetch(`${API_URL}/files/content?path=${encodeURIComponent(filePath)}`);
    if (!response.ok) throw new Error('Failed to fetch file content');
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
}

// Save file content
async function saveFile(filePath, content) {
  try {
    const response = await fetch(`${API_URL}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath, content })
    });
    
    if (!response.ok) throw new Error('Failed to save file');
    return await response.json();
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
}

// Delete file or directory
async function deleteFile(filePath) {
  try {
    const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete file');
    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
}

// Upload file
async function uploadFile(file, directory = '') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', directory);
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload file');
    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

// Example usage:
// document.getElementById('file-list-btn').addEventListener('click', async () => {
//   const files = await getFiles();
//   // Display files in your UI
// });
