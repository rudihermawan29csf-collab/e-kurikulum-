import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Settings,
  Database,
  Users,
  CalendarRange
} from 'lucide-react';
import { FolderItem, AppConfig } from '../types';
import { api } from '../services/api';

interface SettingsViewProps {
  folders: FolderItem[];
  onUpdateFolders: (folders: FolderItem[]) => void;
  appConfig: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ folders, onUpdateFolders, appConfig, onUpdateConfig }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Handle Add Folder
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName,
      docCount: 0
    };
    
    // API Call
    await api.addFolder(newFolder);
    
    // UI Update
    onUpdateFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsAdding(false);
  };

  // Handle Delete Folder
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah anda yakin ingin menghapus folder ini?')) {
      await api.deleteFolder(id);
      onUpdateFolders(folders.filter(f => f.id !== id));
    }
  };

  // Handle Edit Folder
  const startEdit = (folder: FolderItem) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    const folderToUpdate = folders.find(f => f.id === editingId);
    if (folderToUpdate) {
        const updatedFolder = { ...folderToUpdate, name: editName };
        await api.updateFolder(updatedFolder);
        onUpdateFolders(folders.map(f => f.id === editingId ? updatedFolder : f));
    }
    setEditingId(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="mb-8 border-b border-gray-200/50 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Pengaturan</h2>
          <p className="text-gray-500 mt-1">Konfigurasi sistem, tahun ajaran, dan manajemen kategori dokumen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Navigation / General Settings */}
        <div className="space-y-6">
            <div className="glass-panel p-4 rounded-xl">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Umum</h3>
                <nav className="space-y-1">
                    <button className="w-full flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        <Folder size={16} className="mr-3"/>
                        Folder Dokumen
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                        <Users size={16} className="mr-3"/>
                        Manajemen User
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                        <Database size={16} className="mr-3"/>
                        Backup & Restore
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                        <Settings size={16} className="mr-3"/>
                        Konfigurasi Aplikasi
                    </button>
                </nav>
            </div>

            <div className="glass-panel p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                <h4 className="font-bold text-lg mb-2">Butuh Bantuan?</h4>
                <p className="text-blue-100 text-sm mb-4">Hubungi tim IT untuk masalah teknis database.</p>
                <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors">
                    Hubungi Admin
                </button>
            </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Academic Year Configuration */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <CalendarRange size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Tahun Pelajaran & Semester</h3>
                        <p className="text-sm text-gray-500">Atur periode aktif sistem saat ini.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
                        <input 
                            type="text" 
                            value={appConfig.academicYear}
                            onChange={(e) => onUpdateConfig({...appConfig, academicYear: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Contoh: 2025/2026"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select 
                            value={appConfig.semester}
                            onChange={(e) => onUpdateConfig({...appConfig, semester: e.target.value as 'Ganjil' | 'Genap'})}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="Ganjil">Ganjil</option>
                            <option value="Genap">Genap</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Folder Management */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Manajemen Folder</h3>
                        <p className="text-sm text-gray-500">Atur kategori dan nama folder penyimpanan.</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-gray-200"
                    >
                        <Plus size={16} />
                        Folder Baru
                    </button>
                </div>

                {/* Add New Input */}
                {isAdding && (
                    <div className="mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 animate-scale-in">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <Folder size={20} />
                        </div>
                        <input 
                            autoFocus
                            type="text" 
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Nama folder baru (misal: Program Tahunan)..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                        />
                        <button onClick={handleAddFolder} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Save size={16} />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Grid of Folders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {folders.map((folder) => (
                        <div key={folder.id} className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${folder.id === editingId ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-blue-500 group-hover:bg-blue-50 group-hover:text-blue-600'} transition-colors`}>
                                        <Folder size={20} fill={folder.id === editingId ? "currentColor" : "none"} />
                                    </div>
                                    
                                    {editingId === folder.id ? (
                                        <div className="flex items-center gap-1">
                                            <input 
                                                className="w-32 text-sm font-semibold border-b border-blue-500 focus:outline-none"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                            />
                                            <button onClick={saveEdit} className="text-green-600 p-1"><Save size={14}/></button>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-sm">{folder.name}</h4>
                                            <p className="text-xs text-gray-400">{folder.docCount} dokumen</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button 
                                            onClick={() => startEdit(folder)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" 
                                            title="Ubah Nama"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        {!folder.isSystem && (
                                            <button 
                                                onClick={() => handleDelete(folder.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" 
                                                title="Hapus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;