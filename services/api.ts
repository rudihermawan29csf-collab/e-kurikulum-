import { IDocument, FolderItem, AppConfig } from '../types';

// PASTIKAN INI ADALAH URL DARI DEPLOYMENT 'WEB APP' ANDA SENDIRI
// Akhirannya harus '/exec', bukan '/edit'
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGXiBxmDd4yszugCoudnxbMZNwQKU5P2DEqDxyMxIA0CESEwFc4SUB2Uk0rMyoZTbu3g/exec'; 

export const api = {
  // 1. Get All Data
  fetchData: async () => {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getData&t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", text);
        return null;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  },

  // 2. Add Document
  addDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    try {
      const payload = {
        ...doc,
        fileBase64,
        mimeType
      };
      
      const response = await fetch(`${SCRIPT_URL}?action=addDocument`, {
        method: 'POST',
        redirect: 'follow',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      console.log("RAW Server Response (Add):", text);

      if (text.trim().startsWith('<')) {
          throw new Error("Google Script Error: Cek Izin atau Deployment.");
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(text.length < 200 ? text : "Respon server tidak valid.");
      }
    } catch (error) {
      console.error("Error adding document:", error);
      throw error;
    }
  },

  // 2.5 Update Document (Revisi)
  updateDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    try {
      const payload = {
        ...doc,
        fileBase64, // Jika null, berarti file tidak diganti
        mimeType
      };
      
      const response = await fetch(`${SCRIPT_URL}?action=updateDocument`, {
        method: 'POST',
        redirect: 'follow',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      console.log("RAW Server Response (Update):", text);

      if (text.trim().startsWith('<')) {
          throw new Error("Google Script Error: Cek Izin atau Deployment.");
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(text.length < 200 ? text : "Respon server tidak valid.");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },

  // 3. Delete Document
  deleteDocument: async (id: string) => {
    try {
      await fetch(`${SCRIPT_URL}?action=deleteDocument&id=${id}`, { 
          method: 'POST',
          redirect: 'follow',
          headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  },

  // 4. Add Folder
  addFolder: async (folder: FolderItem) => {
    try {
        await fetch(`${SCRIPT_URL}?action=addFolder`, {
            method: 'POST',
            redirect: 'follow',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
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
            redirect: 'follow',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(folder)
        });
    } catch (error) {
        console.error("Error updating folder", error);
    }
  },

  // 6. Delete Folder
  deleteFolder: async (id: string) => {
    try {
        await fetch(`${SCRIPT_URL}?action=deleteFolder&id=${id}`, { 
            method: 'POST',
            redirect: 'follow',
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
    } catch (error) {
        console.error("Error deleting folder", error);
    }
  },

  // 7. Update Config
  updateConfig: async (config: AppConfig) => {
    try {
        await fetch(`${SCRIPT_URL}?action=updateConfig`, {
            method: 'POST',
            redirect: 'follow',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(config)
        });
    } catch (error) {
        console.error("Error updating config", error);
    }
  }
};