import { IDocument, FolderItem, AppConfig } from '../types';

// URL Deployment Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGXiBxmDd4yszugCoudnxbMZNwQKU5P2DEqDxyMxIA0CESEwFc4SUB2Uk0rMyoZTbu3g/exec'; 

// Helper untuk menghandle request standard GAS
const sendRequest = async (action: string, payload: any = {}) => {
  try {
    // Kita kirim action di URL (untuk routing mudah) DAN di Body (untuk data)
    // Menggunakan 'no-cors' tidak disarankan karena kita butuh response JSON.
    // Kuncinya adalah Content-Type: text/plain untuk menghindari Preflight (OPTIONS) request yang sering gagal di GAS.
    const response = await fetch(`${SCRIPT_URL}?action=${action}`, {
      method: 'POST',
      redirect: 'follow',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, action }) // Sertakan action di body juga untuk keamanan
    });

    const text = await response.text();
    console.log(`[API ${action}] Response:`, text.substring(0, 100) + "...");

    if (text.trim().startsWith('<')) {
        throw new Error("Google Script Error: Terjadi kesalahan pada server (HTML Response).");
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      // Jika response text 'Success' atau plain text lainnya
      return { status: 'success', message: text }; 
    }
  } catch (error) {
    console.error(`[API ${action}] Error:`, error);
    throw error;
  }
};

export const api = {
  // 1. Get All Data (GET request remains same)
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
    return sendRequest('addDocument', {
        ...doc,
        fileBase64,
        mimeType
    });
  },

  // 3. Update Document (Revisi/Edit)
  updateDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    return sendRequest('updateDocument', {
        ...doc,
        fileBase64, // Kirim null jika tidak ada file baru
        mimeType
    });
  },

  // 4. Delete Document
  deleteDocument: async (id: string) => {
    // Perbaikan: Mengirim ID via Body, bukan hanya URL parameter
    return sendRequest('deleteDocument', { id });
  },

  // 5. Add Folder
  addFolder: async (folder: FolderItem) => {
    return sendRequest('addFolder', folder);
  },

  // 6. Update Folder
  updateFolder: async (folder: FolderItem) => {
    return sendRequest('updateFolder', folder);
  },

  // 7. Delete Folder
  deleteFolder: async (id: string) => {
    return sendRequest('deleteFolder', { id });
  },

  // 8. Update Config
  updateConfig: async (config: AppConfig) => {
    return sendRequest('updateConfig', config);
  }
};