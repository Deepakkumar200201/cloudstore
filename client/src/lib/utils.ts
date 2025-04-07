import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getFileTypeIcon(type: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  
  // Document types
  if (type.includes('word') || ext === 'doc' || ext === 'docx') {
    return 'fa-file-word text-blue-600';
  }
  
  if (type.includes('pdf') || ext === 'pdf') {
    return 'fa-file-pdf text-red-600';
  }
  
  if (type.includes('excel') || type.includes('spreadsheet') || ext === 'xls' || ext === 'xlsx') {
    return 'fa-file-excel text-green-600';
  }
  
  if (type.includes('powerpoint') || type.includes('presentation') || ext === 'ppt' || ext === 'pptx') {
    return 'fa-file-powerpoint text-orange-600';
  }
  
  // Image types
  if (type.includes('image')) {
    return 'fa-file-image text-purple-600';
  }
  
  // Video types
  if (type.includes('video')) {
    return 'fa-file-video text-indigo-600';
  }
  
  // Audio types
  if (type.includes('audio')) {
    return 'fa-file-audio text-pink-600';
  }
  
  // Archive types
  if (type.includes('zip') || type.includes('archive') || ext === 'zip' || ext === 'rar' || ext === '7z') {
    return 'fa-file-archive text-amber-600';
  }
  
  // Code types
  if (type.includes('code') || ext === 'js' || ext === 'html' || ext === 'css' || ext === 'py' || ext === 'java') {
    return 'fa-file-code text-teal-600';
  }
  
  // Default
  return 'fa-file text-secondary-600';
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}
