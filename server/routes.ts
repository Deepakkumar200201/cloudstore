import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";
import multer from "multer";
import { insertFileSchema, insertFolderSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

// Setup file storage
const uploadDir = path.join(import.meta.dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id;
    const userDir = path.join(uploadDir, `user_${userId}`);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Authorization middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Error handling middleware for Zod validation
  const validateRequest = (schema: z.ZodSchema<any>) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        next(error);
      }
    };
  };

  // ===== Folder Routes =====
  
  // Create a new folder
  app.post('/api/folders', requireAuth, validateRequest(insertFolderSchema), async (req, res) => {
    try {
      const { name, parentId } = req.body;
      const userId = req.user!.id;
      
      // Validate parent folder exists if provided
      if (parentId !== null && parentId !== undefined) {
        const parentFolder = await storage.getFolder(parentId);
        if (!parentFolder) {
          return res.status(404).json({ message: "Parent folder not found" });
        }
        if (parentFolder.userId !== userId) {
          return res.status(403).json({ message: "You don't have access to this parent folder" });
        }
      }
      
      // Check if folder with same name exists in the same location
      const userFolders = await storage.getFoldersByUserId(userId, parentId || null);
      const folderExists = userFolders.some(folder => folder.name.toLowerCase() === name.toLowerCase());
      if (folderExists) {
        return res.status(409).json({ message: "A folder with this name already exists in this location" });
      }
      
      const folder = await storage.createFolder({
        name,
        userId,
        parentId: parentId || null
      });
      
      res.status(201).json(folder);
    } catch (error) {
      console.error("Folder creation error:", error);
      res.status(500).json({ message: "Failed to create folder", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Get folders for current user
  app.get('/api/folders', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const view = req.query.view as string | undefined;
      
      // Handle different views for folders: starred, shared, trash
      if (view) {
        switch (view) {
          case 'starred':
            // Get starred folders
            const starredFolders = await storage.getStarredFolders(userId);
            return res.json(starredFolders);
            
          case 'shared':
            // Get shared folders
            const sharedFolders = await storage.getSharedFolders(userId);
            return res.json(sharedFolders);
            
          case 'trash':
            // Get folders in trash
            const trashedFolders = await storage.getTrashedFolders(userId);
            return res.json(trashedFolders);
            
          default:
            // Unknown view, return empty array
            return res.json([]);
        }
      }
      
      // Regular folder listing
      const folders = await storage.getFoldersByUserId(userId, parentId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders", error });
    }
  });
  
  // Update a folder
  app.patch('/api/folders/:id', requireAuth, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const { name, starred, inTrash } = req.body;
      const userId = req.user!.id;
      
      const folder = await storage.getFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this folder" });
      }
      
      const updateData: Partial<Folder> = {};
      
      if (name !== undefined) {
        updateData.name = name;
      }
      
      if (starred !== undefined) {
        updateData.starred = starred;
      }
      
      // Handle trash operations
      if (inTrash !== undefined && inTrash !== folder.inTrash) {
        updateData.inTrash = inTrash;
        if (inTrash) {
          updateData.deletedAt = new Date();
        } else {
          updateData.deletedAt = null;
        }
      }
      
      // Update modified time
      updateData.modifiedAt = new Date();
      
      const updatedFolder = await storage.updateFolder(folderId, updateData);
      res.json(updatedFolder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update folder", error });
    }
  });
  
  // Delete a folder
  app.delete('/api/folders/:id', requireAuth, async (req, res) => {
    try {
      const folderId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const folder = await storage.getFolder(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      if (folder.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this folder" });
      }
      
      await storage.deleteFolder(folderId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder", error });
    }
  });
  
  // ===== File Routes =====
  
  // Upload a file
  app.post('/api/files/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.user!.id;
      const { originalname, mimetype, size, path: filePath } = req.file;
      const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;
      
      // Check if user has enough storage space
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.storageUsed + size > user.storageLimit) {
        // Remove uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "Not enough storage space" });
      }
      
      // Validate folder if provided
      if (folderId) {
        const folder = await storage.getFolder(folderId);
        if (!folder || folder.userId !== userId) {
          // Remove uploaded file
          fs.unlinkSync(filePath);
          return res.status(400).json({ message: "Invalid folder" });
        }
      }
      
      // Create file record
      const file = await storage.createFile({
        name: originalname,
        type: mimetype,
        size,
        userId,
        folderId,
        path: filePath
      });
      
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file", error });
    }
  });
  
  // Get files for current user
  app.get('/api/files', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : undefined;
      const view = req.query.view as string | undefined;
      
      // Handle different views: recent, starred, shared, trash
      if (view) {
        switch (view) {
          case 'recent':
            // Get recent files (last 30 days, sorted by lastAccessedAt)
            const recentFiles = await storage.getRecentFiles(userId);
            return res.json(recentFiles);
            
          case 'starred':
            // Get starred files
            const starredFiles = await storage.getStarredFiles(userId);
            return res.json(starredFiles);
            
          case 'shared':
            // Get shared files
            const sharedFiles = await storage.getSharedFiles(userId);
            return res.json(sharedFiles);
            
          case 'trash':
            // Get files in trash
            const trashedFiles = await storage.getTrashedFiles(userId);
            return res.json(trashedFiles);
            
          default:
            // Unknown view, return empty array
            return res.json([]);
        }
      }
      
      // Regular file listing for a folder
      const files = await storage.getFilesByUserId(userId, folderId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files", error });
    }
  });
  
  // Download a file
  app.get('/api/files/:id/download', requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to download this file" });
      }
      
      // Check if file exists on disk
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: "File not found on storage" });
      }
      
      res.download(file.path, file.name);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file", error });
    }
  });
  
  // Update a file
  app.patch('/api/files/:id', requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const { name, folderId, starred, inTrash } = req.body;
      const userId = req.user!.id;
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to update this file" });
      }
      
      // If changing folders, validate the target folder
      if (folderId !== undefined && folderId !== file.folderId) {
        if (folderId !== null) {
          const folder = await storage.getFolder(folderId);
          if (!folder || folder.userId !== userId) {
            return res.status(400).json({ message: "Invalid folder" });
          }
        }
      }
      
      const updateData: Partial<File> = { 
        name: name !== undefined ? name : file.name,
        folderId: folderId !== undefined ? folderId : file.folderId,
        starred: starred !== undefined ? starred : file.starred,
      };
      
      // Handle trash operations
      if (inTrash !== undefined && inTrash !== file.inTrash) {
        updateData.inTrash = inTrash;
        if (inTrash) {
          updateData.deletedAt = new Date();
        } else {
          updateData.deletedAt = null;
        }
      }
      
      // Update last accessed time when file is accessed
      if (!inTrash) {
        updateData.lastAccessedAt = new Date();
      }
      
      const updatedFile = await storage.updateFile(fileId, updateData);
      
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file", error });
    }
  });
  
  // Delete a file
  app.delete('/api/files/:id', requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this file" });
      }
      
      // Remove file from disk
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      await storage.deleteFile(fileId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file", error });
    }
  });
  
  // ===== Share Routes =====
  
  // Create a share
  app.post('/api/shares', requireAuth, async (req, res) => {
    try {
      const { fileId, folderId, accessType, allowDownload, expiryDate } = req.body;
      const userId = req.user!.id;
      
      // Validate - must have either fileId or folderId, but not both
      if ((!fileId && !folderId) || (fileId && folderId)) {
        return res.status(400).json({ message: "Must specify either fileId or folderId" });
      }
      
      // Validate file ownership if sharing a file
      if (fileId) {
        const file = await storage.getFile(parseInt(fileId));
        if (!file || file.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized to share this file" });
        }
      }
      
      // Validate folder ownership if sharing a folder
      if (folderId) {
        const folder = await storage.getFolder(parseInt(folderId));
        if (!folder || folder.userId !== userId) {
          return res.status(403).json({ message: "Unauthorized to share this folder" });
        }
      }
      
      const share = await storage.createShare({
        fileId: fileId ? parseInt(fileId) : undefined,
        folderId: folderId ? parseInt(folderId) : undefined,
        userId,
        accessType: accessType || 'public',
        allowDownload: allowDownload === undefined ? true : allowDownload,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      });
      
      res.status(201).json(share);
    } catch (error) {
      res.status(500).json({ message: "Failed to create share", error });
    }
  });
  
  // Get shares for current user
  app.get('/api/shares', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const shares = await storage.getSharesByUserId(userId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shares", error });
    }
  });
  
  // Get share by token (public endpoint)
  app.get('/api/shares/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const share = await storage.getShareByToken(token);
      
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      
      // Check if share has expired
      if (share.expiryDate && new Date(share.expiryDate) < new Date()) {
        return res.status(403).json({ message: "Share has expired" });
      }
      
      res.json(share);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch share", error });
    }
  });
  
  // Delete a share
  app.delete('/api/shares/:id', requireAuth, async (req, res) => {
    try {
      const shareId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const shares = await storage.getSharesByUserId(userId);
      const share = shares.find(s => s.id === shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      
      await storage.deleteShare(shareId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete share", error });
    }
  });
  
  // ===== User Routes =====
  
  // Get user storage info
  app.get('/api/user/storage', requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storagePercentage: (user.storageUsed / user.storageLimit) * 100
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage info", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
