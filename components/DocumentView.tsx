import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IDocument, Role, FolderItem, AppConfig } from '../types';
import { Search, Download, Plus, FileText, Trash2, X, UploadCloud, Check, Calendar, FolderOpen, ChevronDown, ChevronRight, User, FileImage, FileSpreadsheet, FileType, File } from 'lucide-react';

interface DocumentViewProps {
  userRole: Role;
  folders: FolderItem[];
  appConfig: AppConfig;
  documents: IDocument[];
  onAddDocument: (doc: IDocument, file: File | null) => void;
  onDeleteDocument: (id: string) => void;
}

const DocumentView: React.FC<DocumentViewProps> = ({ userRole, folders, appConfig, documents, onAddDocument, onDeleteDocument }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newDocData, setNewDocData] = useState({
    name: '',
    year: '',
    semester: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    file: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultKeys = new Set<string>();
    defaultKeys.add(appConfig.academicYear);
    defaultKeys.add(`${appConfig.academicYear}-${appConfig.semester}`);
    setExpandedKeys(defaultKeys);
  }, [appConfig]);

  const toggleExpand = (key: string) => {
    const newKeys = new Set(expandedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    setExpandedKeys(newKeys);
  };

  const years = useMemo(() => {
    const uniqueYears = new Set(documents.map(d => d.year));
    uniqueYears.add(appConfig.academicYear);
    return Array.from(uniqueYears).sort().reverse();
  }, [documents, appConfig]);

  const isSearching = searchQuery.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return documents.filter(doc => 
       doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       doc.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery, isSearching]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocData({ ...newDocData, file: e.target.files[0] });
    }
  };

  const openAddModal = () => {
    setNewDocData({
      name: '',
      year: appConfig.academicYear,
      semester: appConfig.semester,
      category: folders[0]?.name || '',
      date: new Date().toISOString().split('T')[0],
      file: null
    });
    setIsModalOpen(true);
  };

  const handleSaveDocument = async () => {
    if (!newDocData.name || !newDocData.category || !newDocData.file || !newDocData.year || !newDocData.semester) {
      alert('Mohon lengkapi semua data.');
      return;
    }

    setIsUploading(true);
    const extension = newDocData.file.name.split('.').pop()?.toUpperCase() || 'FILE';
    // NOTE: File URL logic is now handled in App.tsx via API response
    
    const newDoc: IDocument = {
      id: Date.now().toString(),
      title: newDocData.name,
      category: newDocData.category,
      type: extension,
      uploadDate: newDocData.date,
      author: 'Admin', 
      size: `${(newDocData.file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'Valid',
      year: newDocData.year,
      semester: newDocData.semester,
      fileUrl: '' 
    };

    // Pass the raw File object to App.tsx for uploading
    await onAddDocument(newDoc, newDocData.file);
    
    // Auto expand
    const newKeys = new Set(expandedKeys);
    newKeys.add(newDoc.year);
    newKeys.add(`${newDoc.year}-${newDoc.semester}`);
    newKeys.add(`${newDoc.year}-${newDoc.semester}-${newDoc.category}`);
    setExpandedKeys(newKeys);

    setIsUploading(false);
    setIsModalOpen(false);
  };

  const handleDownload = (doc: IDocument) => {
    if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank');
    } else {
        alert("File belum tersedia atau masih dalam proses upload.");
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toUpperCase();
    if (['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(t)) return <FileImage size={20} className="text-purple-600" />;
    if (['XLS', 'XLSX', 'CSV'].includes(t)) return <FileSpreadsheet size={20} className="text-green-600" />;
    if (['DOC', 'DOCX', 'TXT', 'RTF'].includes(t)) return <FileText size={20} className="text-blue-600" />;
    if (t === 'PDF') return <FileType size={20} className="text-red-600" />;
    return <File size={20} className="text-gray-500" />;
  };

  const renderTable = (docs: IDocument[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-400 font-semibold tracking-wider">
            <th className="px-6 py-3">Dokumen</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Oleh</th>
            <th className="px-6 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <tr key={doc.id} className="hover:bg-blue-50/40 transition-colors group">
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                    {getFileIcon(doc.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-wide">{doc.type}</span>
                        <p className="text-xs text-gray-400">{doc.size} • {doc.uploadDate}</p>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    doc.status === 'Valid' ? 'bg-green-100 text-green-700 border-green-200' : 
                    doc.status === 'Draft' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                    'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 truncate">
                  <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {doc.author}
                  </div>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleDownload(doc)} 
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-700 active:scale-95 transition-all text-xs font-bold tracking-wide"
                  >
                    <Download size={14}/> Download
                  </button>
                  {userRole === 'ADMIN' && (
                    <button 
                        onClick={() => onDeleteDocument(doc.id)}
                        className="bg-red-50 text-red-500 p-1.5 rounded-lg border border-red-100 hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Hapus Dokumen"
                    >
                        <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col pb-20 max-w-7xl mx-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dokumen Kurikulum</h2>
            <p className="text-gray-500 mt-1">Arsip dokumen terstruktur berdasarkan Tahun & Semester.</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
             <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                    type="text" 
                    placeholder="Cari dokumen..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                    />
             </div>
             {userRole === 'ADMIN' && (
                 <button 
                    onClick={openAddModal}
                    className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-gray-400/20 transition-all flex items-center justify-center gap-2 text-sm active:scale-95 shrink-0"
                    title="Tambah"
                 >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Tambah</span>
                </button>
             )}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[500px]">
        {isSearching && (
            <div className="glass-panel rounded-2xl shadow-sm overflow-hidden border border-white/60">
                <div className="p-4 bg-blue-50/50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">Hasil Pencarian: "{searchQuery}"</h3>
                </div>
                {searchResults.length > 0 ? renderTable(searchResults) : (
                    <div className="p-10 text-center text-gray-400">Tidak ada dokumen ditemukan.</div>
                )}
            </div>
        )}

        {!isSearching && (
            <div className="space-y-4">
                {years.map(year => {
                    const isYearOpen = expandedKeys.has(year);
                    return (
                        <div key={year} className="glass-panel rounded-2xl shadow-sm border border-white/60 overflow-hidden transition-all duration-300">
                            <button 
                                onClick={() => toggleExpand(year)}
                                className={`w-full flex items-center justify-between p-4 ${isYearOpen ? 'bg-gray-50/80 border-b border-gray-100' : 'bg-white hover:bg-gray-50'} transition-colors`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isYearOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900">Tahun Pelajaran {year}</h3>
                                        <p className="text-xs text-gray-500">{documents.filter(d => d.year === year).length} Dokumen</p>
                                    </div>
                                </div>
                                {isYearOpen ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                            </button>

                            {isYearOpen && (
                                <div className="p-2 sm:p-4 bg-white/40 space-y-3 animate-fade-in">
                                    {['Ganjil', 'Genap'].map(semester => {
                                        const semKey = `${year}-${semester}`;
                                        const isSemOpen = expandedKeys.has(semKey);
                                        const semesterDocs = documents.filter(d => d.year === year && d.semester === semester);
                                        const shouldRenderSem = semesterDocs.length > 0 || (year === appConfig.academicYear);

                                        if (!shouldRenderSem) return null;

                                        return (
                                            <div key={semKey} className="border border-gray-200/60 rounded-xl bg-white/60 overflow-hidden ml-2 sm:ml-4">
                                                <button 
                                                    onClick={() => toggleExpand(semKey)}
                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${isSemOpen ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                        <span className="font-semibold text-gray-800 text-sm">Semester {semester}</span>
                                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{semesterDocs.length}</span>
                                                    </div>
                                                    {isSemOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                                </button>

                                                {isSemOpen && (
                                                    <div className="px-4 pb-4 pt-1 space-y-2 animate-fade-in">
                                                        {semesterDocs.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 border-t border-gray-100 border-dashed bg-white/30 rounded-lg">
                                                                <FileText size={24} className="mb-2 opacity-20" />
                                                                <p className="text-xs">Belum ada dokumen di semester ini.</p>
                                                                {userRole === 'ADMIN' && (
                                                                    <button onClick={openAddModal} className="text-blue-500 hover:text-blue-600 hover:underline text-xs mt-1 font-medium">
                                                                        + Tambah dokumen baru
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            folders.map(folder => {
                                                                const catDocs = semesterDocs.filter(d => d.category === folder.name);
                                                                if (catDocs.length === 0) return null;
                                                                const catKey = `${year}-${semester}-${folder.name}`;
                                                                const isCatOpen = expandedKeys.has(catKey);

                                                                return (
                                                                    <div key={catKey} className="ml-2 sm:ml-4">
                                                                        <button 
                                                                            onClick={() => toggleExpand(catKey)}
                                                                            className="w-full flex items-center gap-2 py-2 hover:text-blue-600 transition-colors group text-left"
                                                                        >
                                                                            {isCatOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                                                                            <FolderOpen size={16} className={`${catDocs.length > 0 ? 'text-amber-500' : 'text-gray-300'} group-hover:text-amber-500`} />
                                                                            <span className={`text-sm ${isCatOpen ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{folder.name}</span>
                                                                            {catDocs.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">{catDocs.length}</span>}
                                                                        </button>
                                                                        {isCatOpen && (
                                                                            <div className="mt-2 mb-4 border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white animate-fade-in">
                                                                                {renderTable(catDocs)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {isModalOpen && userRole === 'ADMIN' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !isUploading && setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Tambah Dokumen Baru</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isUploading} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-semibold text-gray-700">Mengupload ke Database & Drive...</p>
                      <p className="text-xs text-gray-500">Mohon tunggu sebentar.</p>
                  </div>
              ) : (
                <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dokumen</label>
                    <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Misal: Modul Ajar Matematika"
                    value={newDocData.name}
                    onChange={(e) => setNewDocData({...newDocData, name: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            value={newDocData.year}
                            onChange={(e) => setNewDocData({...newDocData, year: e.target.value})}
                            placeholder="2025/2026"
                        />
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select 
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        value={newDocData.semester}
                        onChange={(e) => setNewDocData({...newDocData, semester: e.target.value})}
                    >
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                    </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Upload</label>
                    <input 
                    type="date" 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    value={newDocData.date}
                    onChange={(e) => setNewDocData({...newDocData, date: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori (Folder)</label>
                    <select 
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm appearance-none"
                    value={newDocData.category}
                    onChange={(e) => setNewDocData({...newDocData, category: e.target.value})}
                    >
                    <option value="" disabled>Pilih Folder Penyimpanan</option>
                    {folders.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                    <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${newDocData.file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                    >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        onChange={handleFileChange}
                    />
                    {newDocData.file ? (
                        <>
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                            <Check size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-800 text-center">{newDocData.file.name}</p>
                        <p className="text-xs text-gray-500">{(newDocData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                    ) : (
                        <>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <UploadCloud size={20} />
                        </div>
                        <p className="text-sm text-gray-600 text-center">Klik untuk upload file</p>
                        <p className="text-xs text-gray-400 text-center mt-1">PDF, Word, Excel, Gambar</p>
                        </>
                    )}
                    </div>
                </div>
                </>
              )}
            </div>

            {!isUploading && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={handleSaveDocument}
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors shadow-lg shadow-gray-200"
                >
                    Simpan
                </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentView;