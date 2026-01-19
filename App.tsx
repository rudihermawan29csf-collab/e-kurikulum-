import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentView from './components/DocumentView';
import SettingsView from './components/SettingsView';
import SpotlightSearch from './components/SpotlightSearch';
import LoginView from './components/LoginView';
import { ViewState, Role, FolderItem, AppConfig, IDocument } from './types';
import { Bell, Loader2, WifiOff } from 'lucide-react';
import { api } from './services/api';

// Animation styles injected dynamically
const styleTag = document.createElement('style');
styleTag.innerHTML = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}
.animate-scale-in {
  animation: scale-in 0.2s ease-out forwards;
}
`;
document.head.appendChild(styleTag);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DOCUMENTS');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role>('GURU');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Data States
  const [appConfig, setAppConfig] = useState<AppConfig>({
    academicYear: '...',
    semester: 'Ganjil'
  });
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const data = await api.fetchData();
      
      if (data && data.status === 'success') {
        const docs = Array.isArray(data.docs) ? data.docs : [];
        const rawFolders = Array.isArray(data.folders) ? data.folders : [];

        setDocuments(docs);
        
        const cleanFolders = rawFolders.map((f: any) => ({
          ...f,
          docCount: docs.filter((d: any) => d.category === f.name).length
        }));
        setFolders(cleanFolders);
        
        if (data.config) setAppConfig(data.config);
      } else {
        console.warn("Data fetch returned invalid status or structure", data);
        setIsError(true);
      }
    } catch (e) {
      console.error("Critical error loading data:", e);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (role: Role) => {
    setUserRole(role);
    setIsAuthenticated(true);
    setCurrentView('DOCUMENTS');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('GURU');
  };

  const handleAddDocument = async (newDoc: IDocument, file: File | null) => {
    // 1. Prepare File Upload (Convert to Base64)
    let base64String: string | null = null;
    if (file) {
      base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // 2. Send to API
    try {
      const response = await api.addDocument(newDoc, base64String, file?.type || 'application/octet-stream');
      
      if (response && response.status === 'success') {
         const savedDoc = { 
            ...newDoc, 
            fileUrl: response.fileUrl || '', 
            status: 'Valid' as const 
         };

         setDocuments(prev => [savedDoc, ...prev]);
         setFolders(prev => prev.map(f => f.name === newDoc.category ? { ...f, docCount: f.docCount + 1 } : f));
         
         return true;
      } else {
         throw new Error(response?.message || 'Gagal menyimpan data (Unknown reason).');
      }
    } catch (e: any) {
      handleApiError(e);
      throw e; 
    }
  };

  const handleEditDocument = async (updatedDoc: IDocument, file: File | null) => {
    let base64String: string | null = null;
    if (file) {
      base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      // API call to update
      const response = await api.updateDocument(updatedDoc, base64String, file?.type || '');

      if (response && response.status === 'success') {
        // Update local state completely with response data + updated fields
        setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? { ...d, ...updatedDoc, fileUrl: response.fileUrl || d.fileUrl } : d));
        return true;
      } else {
        throw new Error(response?.message || 'Gagal mengupdate data.');
      }
    } catch (e: any) {
        handleApiError(e);
        throw e;
    }
  };

  const handleApiError = (e: any) => {
      console.error("Operation failed:", e);
      const errorMessage = (e.message || "").toLowerCase();
      
      if (errorMessage.includes("driveapp") || errorMessage.includes("permission") || errorMessage.includes("izin")) {
          const solution = 
            "🛑 IZIN AKSES DITOLAK (Google Drive)\n\n" +
            "SOLUSI (Wajib dilakukan Pemilik Script):\n" +
            "1. Buka Editor Google Apps Script.\n" +
            "2. Jalankan fungsi dummy.\n" +
            "3. Authorize/Izinkan.\n" +
            "4. Deploy Ulang (New Version).";
          alert(solution);
          throw new Error("Izin DriveApp belum diberikan.");
      }
  };

  // Change to return boolean (Success/Fail)
  // REMOVED window.confirm from here to avoid double confirmation
  const handleDeleteDocument = async (id: string): Promise<boolean> => {
      try {
        // Optimistic UI Update: Hapus dulu dari tampilan biar cepat
        const originalDocuments = [...documents];
        const docToDelete = documents.find(d => d.id === id);
        
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
        if (docToDelete) {
             setFolders(prev => prev.map(f => f.name === docToDelete.category ? { ...f, docCount: Math.max(0, f.docCount - 1) } : f));
        }

        // Call API
        const response = await api.deleteDocument(id);
        
        // If API explicitly returns error status despite 200 OK
        if (response && response.status === 'error') {
            throw new Error(response.message);
        }

        return true;
      } catch (error: any) {
        console.error("Gagal menghapus:", error);
        alert(`Gagal menghapus dokumen: ${error.message || 'Unknown error'}. Halaman akan direfresh.`);
        loadData(); // Revert/Refresh data jika gagal
        return false;
      }
  };

  const handleUpdateFolders = async (newFolders: FolderItem[]) => {
      setFolders(newFolders);
  };
  
  const handleUpdateConfig = async (newConfig: AppConfig) => {
      setAppConfig(newConfig);
      await api.updateConfig(newConfig);
  };

  // Handle Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading Screen
  if (isLoading && !isAuthenticated) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
            <p>Menghubungkan ke Database Sekolah...</p>
        </div>
     );
  }

  // Error Screen
  if (isError && !isAuthenticated) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <WifiOff size={40} className="text-red-500 mb-4"/>
            <h2 className="text-xl font-bold text-gray-800">Gagal Terhubung</h2>
            <p className="mb-6">Tidak dapat mengambil data dari Spreadsheet.</p>
            <button onClick={loadData} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Coba Lagi</button>
        </div>
     );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen text-gray-800 antialiased selection:bg-blue-200 selection:text-blue-900 bg-transparent animate-fade-in">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={userRole}
        onLogout={handleLogout}
      />

      <main className="relative pt-16">
        <header className="sticky top-16 z-40 h-14 px-4 sm:px-8 flex items-center justify-between glass-panel border-l-0 border-r-0 border-t-0 rounded-none mb-4 backdrop-blur-md bg-white/50">
            <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-800 mr-2">
                    {currentView === 'DOCUMENTS' ? 'Dokumen Kurikulum' : 'Pengaturan'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200 ml-2">
                  {appConfig.academicYear} • {appConfig.semester}
                </span>
                {isLoading && <span className="ml-3 flex items-center text-xs text-blue-600"><Loader2 size={12} className="animate-spin mr-1"/> Sinkronisasi...</span>}
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={loadData}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Refresh Data"
                >
                    <Loader2 size={18} className={isLoading ? "animate-spin" : ""} />
                </button>
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>

        <div className="min-h-[calc(100vh-8rem)]">
          {currentView === 'DOCUMENTS' && (
            <DocumentView 
              userRole={userRole} 
              folders={folders}
              appConfig={appConfig} 
              documents={documents}
              onAddDocument={handleAddDocument}
              onEditDocument={handleEditDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
          {currentView === 'SETTINGS' && userRole === 'ADMIN' && (
            <SettingsView 
              folders={folders} 
              onUpdateFolders={handleUpdateFolders}
              appConfig={appConfig}
              onUpdateConfig={handleUpdateConfig}
            />
          )}
        </div>
      </main>

      <SpotlightSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default App;