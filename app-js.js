const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Directory where your Apache files are stored
// This will need to be mounted as a volume in Docker
const FILES_DIR = process.env.FILES_DIR || '/var/www/html';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// API Routes

// Get list of files in a directory
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path ? path.join(FILES_DIR, req.query.path) : FILES_DIR;
    
    // Check if the path exists and is within the allowed directory
    if (!dirPath.startsWith(FILES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const files = await fs.readdir(dirPath);
    
    // Get details for each file
    const fileDetails = await Promise.all(files.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        path: path.relative(FILES_DIR, filePath),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      };
    }));
    
    res.json(fileDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read file content
app.get('/api/files/content', async (req, res) => {
  try {
    if (!req.query.path) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const filePath = path.join(FILES_DIR, req.query.path);
    
    // Security check
    if (!filePath.startsWith(FILES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path points to a directory, not a file' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a file
app.post('/api/files', async (req, res) => {
  try {
    const { filePath, content } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const fullPath = path.join(FILES_DIR, filePath);
    
    // Security check
    if (!fullPath.startsWith(FILES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath));
    
    // Write file
    await fs.writeFile(fullPath, content || '');
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a file or directory
app.delete('/api/files', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const fullPath = path.join(FILES_DIR, filePath);
    
    // Security check
    if (!fullPath.startsWith(FILES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.remove(fullPath);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const targetDir = req.body.path || '';
    const targetPath = path.join(FILES_DIR, targetDir, req.file.originalname);
    
    // Security check
    if (!targetPath.startsWith(FILES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Ensure target directory exists
    await fs.ensureDir(path.dirname(targetPath));
    
    // Move uploaded file to target location
    await fs.move(req.file.path, targetPath, { overwrite: true });
    
    res.json({
      success: true,
      path: path.relative(FILES_DIR, targetPath)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
