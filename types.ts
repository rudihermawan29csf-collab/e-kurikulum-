export type Role = 'ADMIN' | 'GURU';

export interface AppConfig {
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
}

export interface FolderItem {
  id: string;
  name: string;
  docCount: number;
  isSystem?: boolean;
}

export enum DocCategory {
  PERENCANAAN = 'Perencanaan',
  SK_REGULASI = 'SK & Regulasi',
  PEMBELAJARAN = 'Pembelajaran'
}

export interface IDocument {
  id: string;
  title: string;
  category: string;
  type: string;
  uploadDate: string;
  author: string;
  size: string;
  status: 'Draft' | 'Valid' | 'Arsip' | 'Revisi'; // Added Revisi
  year: string;
  semester?: string;
  fileUrl?: string;
  adminComment?: string; // New field for Admin Comments
}

export interface IDashboardStat {
  label: string;
  value: string | number;
  trend?: string;
  iconName: string;
  color: string;
}

export type ViewState = 'DOCUMENTS' | 'SETTINGS';