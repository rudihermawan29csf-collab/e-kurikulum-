import { IDocument, FolderItem, AppConfig } from '../types';

// URL Deployment Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGXiBxmDd4yszugCoudnxbMZNwQKU5P2DEqDxyMxIA0CESEwFc4SUB2Uk0rMyoZTbu3g/exec'; 

// Helper untuk menghandle request standard
const sendRequest = async (action: string, payload: any = {}) => {
  try {
    // 1. Konstruksi URL Manual (Lebih Stabil untuk GAS)
    // Hindari penggunaan new URL() yang kompleks untuk memastikan kompatibilitas redirect GAS
    let url = `${SCRIPT_URL}?action=${action}&t=${Date.now()}`;

    // PENTING: Inject ID ke URL Query String jika ada di payload.
    // Ini memperbaiki masalah di mana script server gagal membaca ID dari JSON body saat update/delete.
    if (payload && payload.id) {
        url += `&id=${encodeURIComponent(payload.id)}`;
    }

    // 2. Kirim Request
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      // Gunakan text/plain untuk menghindari CORS Preflight (OPTIONS request) yang sering gagal di GAS
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, action }) 
    });

    // 3. Handle Response Text
    const text = await response.text();

    // Cek apakah response adalah HTML Error (Biasanya dari Google saat script crash/timeout)
    if (text.trim().startsWith('<')) {
        console.error("GAS HTML Error Response:", text);
        throw new Error("Server Error: Script Google mengalami crash. Cek log server.");
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback jika response text biasa (bukan JSON)
      return { status: 'success', message: text }; 
    }
  } catch (error: any) {
    console.error(`[API ${action}] Error:`, error);
    
    // Translate pesan error browser generik menjadi bahasa manusia
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error("Gagal menghubungi server. Periksa koneksi internet Anda atau coba refresh.");
    }
    throw error;
  }
};

export const api = {
  // 1. Get All Data
  fetchData: async () => {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getData&t=${Date.now()}`);
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

  // 3. Update Document
  updateDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    // Pastikan payload bersih. Jangan kirim null fileBase64 jika tidak ada perubahan file.
    const payload: any = { ...doc, mimeType };
    if (fileBase64) {
        payload.fileBase64 = fileBase64;
    }
    return sendRequest('updateDocument', payload);
  },

  // 4. Delete Document
  deleteDocument: async (id: string) => {
    return sendRequest('deleteDocument', { id: String(id) });
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
    return sendRequest('deleteFolder', { id: String(id) });
  },

  // 8. Update Config
  updateConfig: async (config: AppConfig) => {
    return sendRequest('updateConfig', config);
  }
};