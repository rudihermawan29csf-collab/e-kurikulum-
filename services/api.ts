import { IDocument, FolderItem, AppConfig } from '../types';

// URL Deployment Google Apps Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGXiBxmDd4yszugCoudnxbMZNwQKU5P2DEqDxyMxIA0CESEwFc4SUB2Uk0rMyoZTbu3g/exec'; 

// Helper untuk menghandle request standard GAS
const sendRequest = async (action: string, payload: any = {}) => {
  try {
    const url = new URL(SCRIPT_URL);
    
    // Clean action param
    const cleanAction = action.split('&')[0].split('=')[0];
    
    url.searchParams.append('action', cleanAction);
    url.searchParams.append('t', String(new Date().getTime())); // Cache buster

    // Append ID to URL if exists in payload (Dual-send: URL params & Body)
    if (payload && payload.id) {
        url.searchParams.append('id', String(payload.id));
    }

    // Construct final payload
    const finalPayload = { ...payload, action: cleanAction };

    const response = await fetch(url.toString(), {
      method: 'POST',
      redirect: 'follow',
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // Avoid CORS Preflight
      body: JSON.stringify(finalPayload) 
    });

    const text = await response.text();

    if (text.trim().startsWith('<')) {
        console.error("GAS HTML Error:", text);
        throw new Error("Server Error: Script Google mengalami crash atau izin ditolak.");
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      return { status: 'success', message: text }; 
    }
  } catch (error: any) {
    console.error(`[API ${action}] Error:`, error);
    if (error.message === 'Failed to fetch') {
        throw new Error("Gagal terhubung ke server. Cek koneksi internet.");
    }
    throw error;
  }
};

export const api = {
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

  addDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    return sendRequest('addDocument', { ...doc, fileBase64, mimeType });
  },

  updateDocument: async (doc: IDocument, fileBase64: string | null, mimeType: string) => {
    // Only include fileBase64 in payload if it's not null to save bandwidth and prevent script errors
    const payload: any = { ...doc, mimeType };
    if (fileBase64) {
        payload.fileBase64 = fileBase64;
    }
    return sendRequest('updateDocument', payload);
  },

  deleteDocument: async (id: string) => {
    return sendRequest('deleteDocument', { id: String(id) });
  },

  addFolder: async (folder: FolderItem) => {
    return sendRequest('addFolder', folder);
  },

  updateFolder: async (folder: FolderItem) => {
    return sendRequest('updateFolder', folder);
  },

  deleteFolder: async (id: string) => {
    return sendRequest('deleteFolder', { id: String(id) });
  },

  updateConfig: async (config: AppConfig) => {
    return sendRequest('updateConfig', config);
  }
};