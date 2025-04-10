# Node.js for Apache Admins: Building a File Management API

## Course Overview

This hands-on tutorial series will guide you through creating a Node.js application in a Docker container that can interact with files on your Apache server. By the end of this course, you'll have built a working API that lets you manage files through a web interface.

### Prerequisites
- Basic knowledge of HTML/CSS/JavaScript
- Access to a server running Apache
- Administrative privileges to install Docker
- Text editor of your choice

## Lesson 1: Understanding the Architecture

### Learning Objectives
- Understand how Node.js complements Apache
- Learn the basics of REST APIs
- Design our application structure

### Content

#### The Problem We're Solving
Apache is excellent for serving static content, but when you need dynamic operations like file manipulation from the browser, you need a backend that can safely execute those operations. Node.js is perfect for this task.

#### How It Works
1. **Apache Server**: Continues to serve your HTML/JS/CSS files as usual
2. **Node.js API**: Runs in a Docker container and provides endpoints for file operations
3. **Browser Client**: Makes requests to the Node.js API to perform file operations

#### Security Considerations
- The Node.js API needs access to your Apache file directories
- We'll implement path validation to prevent unauthorized access
- API endpoints should be properly secured in a production environment

## Lesson 2: Setting Up Your Development Environment

### Learning Objectives
- Install Docker and Docker Compose
- Set up a project directory structure
- Create basic configuration files

### Content

#### Installing Docker
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# For CentOS/RHEL
sudo yum install docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker-compose --version
```

#### Creating Your Project Structure
```bash
# Create project directory
mkdir apache-file-manager
cd apache-file-manager

# Create subdirectories
mkdir -p src public uploads
```

## Lesson 3: Building Your First Node.js Application

### Learning Objectives
- Understand Node.js and Express basics
- Create a simple web server
- Handle API requests

### Content

#### Creating package.json
This file defines your application and its dependencies.

```json
{
  "name": "apache-file-manager",
  "version": "1.0.0",
  "description": "Node.js backend for manipulating files on Apache server",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "fs-extra": "^11.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### Creating app.js
This is your application's entry point.

```javascript
// Import required modules
const express = require('express');
const cors = require('cors');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Testing Locally
```bash
# Install dependencies
npm install

# Start the server
npm start

# You should see: Server running on port 3000
```

## Lesson 4: Dockerizing Your Node.js Application

### Learning Objectives
- Create a Dockerfile
- Build a Docker image
- Run your application in a container

### Content

#### Creating a Dockerfile
```dockerfile
FROM node:18

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Command to run the application
CMD ["node", "app.js"]
```

#### Creating docker-compose.yml
```yaml
version: '3'

services:
  nodejs-backend:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./:/usr/src/app
      - /path/to/apache/files:/var/www/html
    environment:
      - NODE_ENV=production
      - FILES_DIR=/var/www/html
    restart: unless-stopped
```

#### Building and Running with Docker
```bash
# Build and start the container
docker-compose up -d

# Check if the container is running
docker ps

# View logs
docker-compose logs -f
```

## Lesson 5: Implementing File Operations API

### Learning Objectives
- Create API endpoints for file operations
- Implement file reading and writing
- Add security validations

### Content

#### Expanding app.js with File Operations

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Directory where your Apache files are stored
const FILES_DIR = process.env.FILES_DIR || '/var/www/html';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get list of files in a directory
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path ? path.join(FILES_DIR, req.query.path) : FILES_DIR;
    
    // Security check
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
  // Implementation from previous code
});

// Create or update a file
app.post('/api/files', async (req, res) => {
  // Implementation from previous code
});

// Delete a file or directory
app.delete('/api/files', async (req, res) => {
  // Implementation from previous code
});

// Upload a file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  // Implementation from previous code
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Lesson 6: Building a Frontend Interface

### Learning Objectives
- Create a simple frontend for testing the API
- Implement file listing and viewing
- Add file upload and editing capabilities

### Content

#### Creating a Test Interface (public/index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apache File Manager</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .file-list { border: 1px solid #ddd; padding: 10px; }
        .file-item { padding: 5px; cursor: pointer; }
        .file-item:hover { background-color: #f0f0f0; }
        .folder { font-weight: bold; }
        .editor { margin-top: 20px; }
        textarea { width: 100%; height: 300px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Apache File Manager</h1>
        
        <div class="controls">
            <button id="back-btn">Back</button>
            <button id="upload-btn">Upload File</button>
            <input type="file" id="file-input" style="display: none;">
            <button id="new-file-btn">New File</button>
            <span id="current-path">/</span>
        </div>
        
        <div class="file-list" id="file-list">
            Loading...
        </div>
        
        <div class="editor" id="editor" style="display: none;">
            <h2 id="file-name"></h2>
            <textarea id="file-content"></textarea>
            <button id="save-btn">Save</button>
            <button id="cancel-btn">Cancel</button>
        </div>
    </div>
    
    <script src="js/main.js"></script>
</body>
</html>
```

#### Creating the Frontend JavaScript (public/js/main.js)

```javascript
// API endpoint (adjust based on your deployment)
const API_URL = 'http://localhost:3000/api';

// State
let currentPath = '';
let currentFile = null;

// DOM elements
const fileList = document.getElementById('file-list');
const editor = document.getElementById('editor');
const fileNameElement = document.getElementById('file-name');
const fileContent = document.getElementById('file-content');
const currentPathElement = document.getElementById('current-path');
const backBtn = document.getElementById('back-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const newFileBtn = document.getElementById('new-file-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    
    // Event listeners
    backBtn.addEventListener('click', goBack);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', uploadFile);
    newFileBtn.addEventListener('click', createNewFile);
    saveBtn.addEventListener('click', saveFile);
    cancelBtn.addEventListener('click', cancelEdit);
});

// Load files from current directory
async function loadFiles() {
    try {
        currentPathElement.textContent = '/' + currentPath;
        fileList.innerHTML = 'Loading...';
        
        const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(currentPath)}`);
        if (!response.ok) throw new Error('Failed to fetch files');
        
        const files = await response.json();
        
        if (files.length === 0) {
            fileList.innerHTML = '<div>No files in this directory</div>';
            return;
        }
        
        fileList.innerHTML = '';
        
        // Sort: directories first, then files
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = `file-item ${file.isDirectory ? 'folder' : 'file'}`;
            item.textContent = file.name;
            
            item.addEventListener('click', () => {
                if (file.isDirectory) {
                    navigateTo(file.path);
                } else {
                    openFile(file.path);
                }
            });
            
            fileList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = `<div>Error: ${error.message}</div>`;
    }
}

// Rest of the frontend JavaScript implementation...
```

## Lesson 7: Security and Production Deployment

### Learning Objectives
- Secure your API endpoints
- Configure for production use
- Deploy alongside Apache

### Content

#### Adding Basic Authentication
```javascript
// Middleware for simple authentication
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
});
```

#### Production Configuration
```yaml
# Updated docker-compose.yml for production
version: '3'

services:
  nodejs-backend:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "127.0.0.1:3000:3000"  # Only listen on localhost
    volumes:
      - ./:/usr/src/app
      - /var/www/html:/var/www/html
    environment:
      - NODE_ENV=production
      - FILES_DIR=/var/www/html
      - API_KEY=your_secure_api_key_here
    restart: unless-stopped
    networks:
      - backend_net

networks:
  backend_net:
    driver: bridge
```

## Projects and Exercises

### Project 1: Basic File Browser
Create a simple file browser that can navigate directories and view text files.

### Project 2: Markdown Editor
Build a markdown editor that saves files directly to your Apache server.

### Project 3: Image Gallery
Create an image gallery that can upload, display, and organize images on your server.

### Final Project: Complete File Management System
Build a comprehensive file management system with:
- User authentication
- File permissions
- File versioning
- Preview for different file types
- Search functionality

## Further Learning Resources

### Node.js Resources
- [Official Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Docker Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Security Resources
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
