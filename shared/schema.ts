import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  avatar: text("avatar"),
  storageLimit: integer("storage_limit").default(15 * 1024 * 1024 * 1024), // 15GB in bytes
  storageUsed: integer("storage_used").default(0), // Used storage in bytes
  createdAt: timestamp("created_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(), // Owner of the folder
  parentId: integer("parent_id"), // Parent folder, null for root
  inTrash: boolean("in_trash").default(false),
  deletedAt: timestamp("deleted_at"), // For trash functionality
  starred: boolean("starred").default(false),
  isShared: boolean("is_shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // MIME type
  size: integer("size").notNull(), // Size in bytes
  userId: integer("user_id").notNull(), // Owner of the file
  folderId: integer("folder_id"), // Folder containing the file, null for root
  path: text("path").notNull(), // Path to file in storage
  starred: boolean("starred").default(false),
  isShared: boolean("is_shared").default(false),
  inTrash: boolean("in_trash").default(false),
  deletedAt: timestamp("deleted_at"), // For trash functionality
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(), // For recent files functionality
  createdAt: timestamp("created_at").defaultNow(),
  modifiedAt: timestamp("modified_at").defaultNow(),
});

export const shares = pgTable("shares", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id"), // Can be null if it's a folder
  folderId: integer("folder_id"), // Can be null if it's a file
  userId: integer("user_id").notNull(), // Owner
  accessType: text("access_type").notNull(), // 'public', 'restricted'
  allowDownload: boolean("allow_download").default(true),
  expiryDate: timestamp("expiry_date"), // Null means no expiration
  token: text("token").notNull().unique(), // Unique token for the share
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  userId: true,
  parentId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true, 
  type: true,
  size: true,
  userId: true,
  folderId: true,
  path: true,
});

export const insertShareSchema = createInsertSchema(shares).pick({
  fileId: true,
  folderId: true,
  userId: true,
  accessType: true,
  allowDownload: true,
  expiryDate: true,
  token: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof shares.$inferSelect;

// Extended types with additional information for frontend display
export type FileWithPath = File & {
  url?: string;
};

export type FolderWithStats = Folder & {
  fileCount: number;
  totalSize: number;
};

export type ShareWithDetails = Share & {
  file?: File;
  folder?: Folder;
  sharedBy?: {
    name: string;
    avatar: string;
  };
};
