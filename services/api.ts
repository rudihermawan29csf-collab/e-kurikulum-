import { IDocument, FolderItem, AppConfig } from '../types';

// GANTI URL INI DENGAN URL DEPLOYMENT APP SCRIPT ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcOYAusWTNh8VrVDE0YCcD6n6iiVyq1-KrRVWRfUrlzbb321U5WhxAxqDVJIKZN74Ncg/exec'; 

export const api = {
  // 1. Get All Data
  fetchData: async () => {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getData`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        return result;
      } catch (e) {
        console.error("Failed to parse JSON:", text);
        return null;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  },

  // 2. Add Document (with File Upload handling)
  addDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    try {
      const payload = {
        ...doc,
        fileBase64, // Kirim string base64 jika ada file
        mimeType
      };
      
      // Menggunakan 'body' string secara langsung tanpa header Content-Type 'application/json'
      // agar browser menganggapnya sebagai 'text/plain' dan TIDAK mengirim preflight OPTIONS
      // yang sering gagal di Google Apps Script.
      const response = await fetch(`${SCRIPT_URL}?action=addDocument`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  },

  // 3. Delete Document
  deleteDocument: async (id: string) => {
    try {
      await fetch(`${SCRIPT_URL}?action=deleteDocument&id=${id}`, { method: 'POST' });
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  },

  // 4. Add Folder
  addFolder: async (folder: FolderItem) => {
    try {
        await fetch(`${SCRIPT_URL}?action=addFolder`, {
            method: 'POST',
            body: JSON.stringify(folder)
        });
    } catch (error) {
        console.error("Error adding folder", error);
    }
  },

  // 5. Update Folder
  updateFolder: async (folder: FolderItem) => {
    try {
        await fetch(`${SCRIPT_URL}?action=updateFolder`, {
            method: 'POST',
            body: JSON.stringify(folder)
        });
    } catch (error) {
        console.error("Error updating folder", error);
    }
  },

  // 6. Delete Folder
  deleteFolder: async (id: string) => {
    try {
        await fetch(`${SCRIPT_URL}?action=deleteFolder&id=${id}`, { method: 'POST' });
    } catch (error) {
        console.error("Error deleting folder", error);
    }
  },

  // 7. Update Config
  updateConfig: async (config: AppConfig) => {
    try {
        await fetch(`${SCRIPT_URL}?action=updateConfig`, {
            method: 'POST',
            body: JSON.stringify(config)
        });
    } catch (error) {
        console.error("Error updating config", error);
    }
  }
};