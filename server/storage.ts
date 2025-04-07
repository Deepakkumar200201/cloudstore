import { users, folders, files, shares } from "@shared/schema";
import type { User, InsertUser, Folder, InsertFolder, File, InsertFile, Share, InsertShare, FileWithPath, FolderWithStats, ShareWithDetails } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Folder operations
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolder(id: number): Promise<Folder | undefined>;
  getFoldersByUserId(userId: number, parentId?: number | null): Promise<FolderWithStats[]>;
  updateFolder(id: number, data: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  getStarredFolders(userId: number): Promise<FolderWithStats[]>;
  getSharedFolders(userId: number): Promise<FolderWithStats[]>;
  getTrashedFolders(userId: number): Promise<FolderWithStats[]>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: number, folderId?: number | null): Promise<FileWithPath[]>;
  updateFile(id: number, data: Partial<File>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
  getRecentFiles(userId: number): Promise<FileWithPath[]>;
  getStarredFiles(userId: number): Promise<FileWithPath[]>;
  getSharedFiles(userId: number): Promise<FileWithPath[]>;
  getTrashedFiles(userId: number): Promise<FileWithPath[]>;
  
  // Share operations
  createShare(share: InsertShare): Promise<Share>;
  getShareByToken(token: string): Promise<ShareWithDetails | undefined>;
  getSharesByUserId(userId: number): Promise<ShareWithDetails[]>;
  deleteShare(id: number): Promise<boolean>;
  
  // Storage usage
  updateUserStorageUsed(userId: number, sizeDelta: number): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private files: Map<number, File>;
  private shares: Map<number, Share>;
  public sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentFolderId: number;
  private currentFileId: number;
  private currentShareId: number;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.files = new Map();
    this.shares = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.currentUserId = 1;
    this.currentFolderId = 1;
    this.currentFileId = 1;
    this.currentShareId = 1;
    
    // Initialize with a demo user
    this.users.set(1, {
      id: 1,
      username: "demo@example.com",
      password: "password-hash.salt",
      name: "Demo User",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      storageLimit: 15 * 1024 * 1024 * 1024,
      storageUsed: 0,
      createdAt: new Date(),
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      storageLimit: 15 * 1024 * 1024 * 1024, // 15GB
      storageUsed: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Folder operations
  async createFolder(folder: InsertFolder): Promise<Folder> {
    const id = this.currentFolderId++;
    const newFolder: Folder = {
      ...folder,
      id,
      createdAt: new Date(),
    };
    this.folders.set(id, newFolder);
    return newFolder;
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getFoldersByUserId(userId: number, parentId?: number | null): Promise<FolderWithStats[]> {
    const userFolders = Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId && folder.parentId === (parentId === undefined ? null : parentId)
    );
    
    return Promise.all(userFolders.map(async (folder) => {
      // Calculate folder stats (file count and total size)
      const folderFiles = Array.from(this.files.values()).filter(
        (file) => file.folderId === folder.id
      );
      
      const fileCount = folderFiles.length;
      const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
      
      return { ...folder, fileCount, totalSize };
    }));
  }

  async updateFolder(id: number, data: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...data };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: number): Promise<boolean> {
    // First, delete all files in this folder and update user storage
    const folderFiles = Array.from(this.files.values()).filter(
      (file) => file.folderId === id
    );
    
    for (const file of folderFiles) {
      await this.deleteFile(file.id);
    }
    
    // Delete all subfolders recursively
    const subfolders = Array.from(this.folders.values()).filter(
      (folder) => folder.parentId === id
    );
    
    for (const subfolder of subfolders) {
      await this.deleteFolder(subfolder.id);
    }
    
    return this.folders.delete(id);
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const newFile: File = {
      ...file,
      id,
      starred: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    this.files.set(id, newFile);
    
    // Update user storage usage
    const user = this.users.get(file.userId);
    if (user) {
      user.storageUsed += file.size;
      this.users.set(user.id, user);
    }
    
    return newFile;
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUserId(userId: number, folderId?: number | null): Promise<FileWithPath[]> {
    return Array.from(this.files.values())
      .filter((file) => 
        file.userId === userId && 
        (folderId === undefined ? true : file.folderId === folderId)
      )
      .map(file => {
        const fileWithPath: FileWithPath = { ...file };
        // In a real implementation, we would generate a secure URL here
        fileWithPath.url = `/api/files/${file.id}/download`;
        return fileWithPath;
      });
  }

  async updateFile(id: number, data: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    // If the size changes, update the user's storage usage
    if (data.size !== undefined && data.size !== file.size) {
      const sizeDelta = data.size - file.size;
      await this.updateUserStorageUsed(file.userId, sizeDelta);
    }
    
    const updatedFile = { ...file, ...data, modifiedAt: new Date() };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    const file = this.files.get(id);
    if (!file) return false;
    
    // Update user storage usage
    await this.updateUserStorageUsed(file.userId, -file.size);
    
    // Delete file shares
    const fileShares = Array.from(this.shares.values()).filter(
      (share) => share.fileId === id
    );
    
    for (const share of fileShares) {
      this.shares.delete(share.id);
    }
    
    return this.files.delete(id);
  }

  // Share operations
  async createShare(share: Omit<InsertShare, 'token'>): Promise<Share> {
    const id = this.currentShareId++;
    const token = randomBytes(16).toString('hex');
    
    const newShare: Share = {
      ...share,
      token,
      id,
      createdAt: new Date(),
    };
    
    this.shares.set(id, newShare);
    return newShare;
  }

  async getShareByToken(token: string): Promise<ShareWithDetails | undefined> {
    const share = Array.from(this.shares.values()).find(s => s.token === token);
    if (!share) return undefined;
    
    const file = share.fileId ? this.files.get(share.fileId) : undefined;
    const folder = share.folderId ? this.folders.get(share.folderId) : undefined;
    const user = this.users.get(share.userId);
    
    const shareWithDetails: ShareWithDetails = {
      ...share,
      file,
      folder,
      sharedBy: user ? {
        name: user.name || user.username,
        avatar: user.avatar || '',
      } : undefined,
    };
    
    return shareWithDetails;
  }

  async getSharesByUserId(userId: number): Promise<ShareWithDetails[]> {
    const userShares = Array.from(this.shares.values()).filter(
      (share) => share.userId === userId
    );
    
    return userShares.map(share => {
      const file = share.fileId ? this.files.get(share.fileId) : undefined;
      const folder = share.folderId ? this.folders.get(share.folderId) : undefined;
      const user = this.users.get(share.userId);
      
      return {
        ...share,
        file,
        folder,
        sharedBy: user ? {
          name: user.name || user.username,
          avatar: user.avatar || '',
        } : undefined,
      };
    });
  }

  async deleteShare(id: number): Promise<boolean> {
    return this.shares.delete(id);
  }
  
  // Special view methods for files
  async getRecentFiles(userId: number): Promise<FileWithPath[]> {
    // Get files accessed in the last 30 days, sorted by lastAccessedAt
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return Array.from(this.files.values())
      .filter(file => 
        file.userId === userId && 
        file.lastAccessedAt && 
        new Date(file.lastAccessedAt) >= thirtyDaysAgo &&
        !file.inTrash
      )
      .sort((a, b) => {
        // Sort by lastAccessedAt in descending order (newest first)
        const dateA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const dateB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return dateB - dateA;
      })
      .map(file => {
        const fileWithPath: FileWithPath = { ...file };
        fileWithPath.url = `/api/files/${file.id}/download`;
        return fileWithPath;
      });
  }
  
  async getStarredFiles(userId: number): Promise<FileWithPath[]> {
    return Array.from(this.files.values())
      .filter(file => 
        file.userId === userId && 
        file.starred === true &&
        !file.inTrash
      )
      .map(file => {
        const fileWithPath: FileWithPath = { ...file };
        fileWithPath.url = `/api/files/${file.id}/download`;
        return fileWithPath;
      });
  }
  
  async getSharedFiles(userId: number): Promise<FileWithPath[]> {
    // Get files that have been shared
    const fileShares = Array.from(this.shares.values())
      .filter(share => share.userId === userId && share.fileId !== undefined)
      .map(share => share.fileId as number);
    
    return Array.from(this.files.values())
      .filter(file => 
        file.userId === userId && 
        (fileShares.includes(file.id) || file.isShared) &&
        !file.inTrash
      )
      .map(file => {
        const fileWithPath: FileWithPath = { ...file };
        fileWithPath.url = `/api/files/${file.id}/download`;
        return fileWithPath;
      });
  }
  
  async getTrashedFiles(userId: number): Promise<FileWithPath[]> {
    return Array.from(this.files.values())
      .filter(file => 
        file.userId === userId && 
        file.inTrash === true
      )
      .map(file => {
        const fileWithPath: FileWithPath = { ...file };
        fileWithPath.url = `/api/files/${file.id}/download`;
        return fileWithPath;
      });
  }
  
  // Special view methods for folders
  async getStarredFolders(userId: number): Promise<FolderWithStats[]> {
    const userFolders = Array.from(this.folders.values())
      .filter(folder => 
        folder.userId === userId && 
        folder.starred === true &&
        !folder.inTrash
      );
    
    return Promise.all(userFolders.map(async (folder) => {
      // Calculate folder stats
      const folderFiles = Array.from(this.files.values()).filter(
        (file) => file.folderId === folder.id
      );
      
      const fileCount = folderFiles.length;
      const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
      
      return { ...folder, fileCount, totalSize };
    }));
  }
  
  async getSharedFolders(userId: number): Promise<FolderWithStats[]> {
    // Get folders that have been shared
    const folderShares = Array.from(this.shares.values())
      .filter(share => share.userId === userId && share.folderId !== undefined)
      .map(share => share.folderId as number);
    
    const userFolders = Array.from(this.folders.values())
      .filter(folder => 
        folder.userId === userId && 
        (folderShares.includes(folder.id) || folder.isShared) &&
        !folder.inTrash
      );
    
    return Promise.all(userFolders.map(async (folder) => {
      // Calculate folder stats
      const folderFiles = Array.from(this.files.values()).filter(
        (file) => file.folderId === folder.id
      );
      
      const fileCount = folderFiles.length;
      const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
      
      return { ...folder, fileCount, totalSize };
    }));
  }
  
  async getTrashedFolders(userId: number): Promise<FolderWithStats[]> {
    const userFolders = Array.from(this.folders.values())
      .filter(folder => 
        folder.userId === userId && 
        folder.inTrash === true
      );
    
    return Promise.all(userFolders.map(async (folder) => {
      // Calculate folder stats
      const folderFiles = Array.from(this.files.values()).filter(
        (file) => file.folderId === folder.id
      );
      
      const fileCount = folderFiles.length;
      const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
      
      return { ...folder, fileCount, totalSize };
    }));
  }

  // Storage management
  async updateUserStorageUsed(userId: number, sizeDelta: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    user.storageUsed += sizeDelta;
    if (user.storageUsed < 0) user.storageUsed = 0;
    
    this.users.set(userId, user);
    return user;
  }
}

export const storage = new MemStorage();
