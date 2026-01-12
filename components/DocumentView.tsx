import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IDocument, Role, FolderItem, AppConfig } from '../types';
import { Search, Download, Plus, FileText, Trash2, X, UploadCloud, Check, Calendar, FolderOpen, ChevronDown, ChevronRight, User, FileImage, FileSpreadsheet, FileType, File as FileIcon, AlertCircle, Files, Edit3, MessageSquareWarning } from 'lucide-react';

interface DocumentViewProps {
  userRole: Role;
  folders: FolderItem[];
  appConfig: AppConfig;
  documents: IDocument[];
  onAddDocument: (doc: IDocument, file: File | null) => Promise<any>;
  onEditDocument: (doc: IDocument, file: File | null) => Promise<any>;
  onDeleteDocument: (id: string) => void;
}

const DocumentView: React.FC<DocumentViewProps> = ({ userRole, folders, appConfig, documents, onAddDocument, onEditDocument, onDeleteDocument }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [adminCommentToShow, setAdminCommentToShow] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number, currentFile: string}>({current: 0, total: 0, currentFile: ''});
  
  const [newDocData, setNewDocData] = useState({
    name: '',
    year: '',
    semester: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    files: [] as File[] 
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
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles: File[] = Array.from(e.target.files);
      
      // VALIDASI: Batasi 100 file
      if (selectedFiles.length > 100) {
          alert("Maksimal upload 100 file sekaligus!");
          e.target.value = ""; 
          return;
      }

      // VALIDASI: Cek ukuran per file
      const oversizedFiles = selectedFiles.filter(f => f.size > 4 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
          alert(`File berikut terlalu besar (>4MB): \n${oversizedFiles.map(f=>f.name).join('\n')}\nMohon kecilkan ukuran file.`);
          e.target.value = "";
          return;
      }

      setNewDocData({ ...newDocData, files: selectedFiles });
      setUploadError(null);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingDocId(null);
    setAdminCommentToShow(null);
    setNewDocData({
      name: '',
      year: appConfig.academicYear,
      semester: appConfig.semester,
      category: folders[0]?.name || '',
      date: new Date().toISOString().split('T')[0],
      files: []
    });
    setUploadError(null);
    setUploadProgress({current: 0, total: 0, currentFile: ''});
    setIsModalOpen(true);
  };

  const openEditModal = (doc: IDocument) => {
      setIsEditMode(true);
      setEditingDocId(doc.id);
      setAdminCommentToShow(doc.adminComment || null);
      
      setNewDocData({
          name: doc.title,
          year: doc.year,
          semester: doc.semester || appConfig.semester,
          category: doc.category,
          date: doc.uploadDate,
          files: [] // Kosongkan file saat edit (opsional upload ulang)
      });
      setUploadError(null);
      setUploadProgress({current: 0, total: 0, currentFile: ''});
      setIsModalOpen(true);
  };

  const handleSaveDocument = async () => {
    setUploadError(null);
    
    // Validasi Basic
    if (!newDocData.category || !newDocData.year || !newDocData.semester) {
      alert('Mohon lengkapi data wajib (Tahun, Semester, Kategori).');
      return;
    }

    // Jika Mode Tambah Baru: Wajib ada File
    if (!isEditMode && newDocData.files.length === 0) {
        alert('Mohon pilih minimal 1 file.');
        return;
    }

    // Jika Mode Edit: Nama wajib diisi
    if (isEditMode && !newDocData.name) {
        alert('Nama dokumen tidak boleh kosong.');
        return;
    }

    setIsUploading(true);
    
    // ----------- MODE EDIT / REVISI -----------
    if (isEditMode && editingDocId) {
        setUploadProgress({ current: 1, total: 1, currentFile: newDocData.name });
        try {
            // Cek apakah ada file baru yang diupload
            const newFile = newDocData.files.length > 0 ? newDocData.files[0] : null;
            
            const updatedDoc: IDocument = {
                id: editingDocId,
                title: newDocData.name,
                category: newDocData.category,
                type: newFile ? (newFile.name.split('.').pop()?.toUpperCase() || 'FILE') : 'UNKNOWN', // Type update if file changes, else backend keeps old
                uploadDate: newDocData.date,
                author: 'Admin', // Atau user login
                size: newFile ? `${(newFile.size / 1024 / 1024).toFixed(2)} MB` : '0 MB', // Placeholder size update
                status: 'Valid', // Reset status to Valid after revision? Or keep as is? Let's say Valid.
                year: newDocData.year,
                semester: newDocData.semester,
                fileUrl: '' // Will be updated by response
            };

            await onEditDocument(updatedDoc, newFile);
            alert("Dokumen berhasil direvisi!");
            setIsModalOpen(false);
        } catch (e: any) {
            setUploadError(e.message);
        } finally {
            setIsUploading(false);
        }
        return;
    }

    // ----------- MODE TAMBAH BARU (SEQUENTIAL) -----------
    setUploadProgress({ current: 0, total: newDocData.files.length, currentFile: '' });

    let successCount = 0;
    let failCount = 0;
    let errors: string[] = [];

    for (let i = 0; i < newDocData.files.length; i++) {
        const file = newDocData.files[i];
        setUploadProgress({ 
            current: i + 1, 
            total: newDocData.files.length, 
            currentFile: file.name 
        });

        try {
            const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
            // Jika single file dan ada nama input, pakai nama input. 
            // Jika multi file, atau single file tapi nama kosong (fallback), pakai filename.
            const docTitle = (newDocData.files.length === 1 && newDocData.name)
                ? newDocData.name 
                : file.name.replace(/\.[^/.]+$/, "");

            const newDoc: IDocument = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                title: docTitle,
                category: newDocData.category,
                type: extension,
                uploadDate: newDocData.date,
                author: 'Admin', 
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                status: 'Valid',
                year: newDocData.year,
                semester: newDocData.semester,
                fileUrl: '' 
            };

            await onAddDocument(newDoc, file);
            successCount++;

            if (i === 0) {
                const newKeys = new Set(expandedKeys);
                newKeys.add(newDoc.year);
                newKeys.add(`${newDoc.year}-${newDoc.semester}`);
                newKeys.add(`${newDoc.year}-${newDoc.semester}-${newDoc.category}`);
                setExpandedKeys(newKeys);
            }

        } catch (e: any) {
            console.error(`Gagal upload ${file.name}:`, e);
            failCount++;
            errors.push(`${file.name}: ${e.message}`);
        }
    }

    setIsUploading(false);

    if (failCount === 0) {
        alert(`Berhasil mengupload ${successCount} dokumen!`);
        setIsModalOpen(false);
    } else {
        setUploadError(`Berhasil: ${successCount}, Gagal: ${failCount}.\nDetail Error:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '...' : ''}`);
    }
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
    return <FileIcon size={20} className="text-gray-500" />;
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
                        {/* INDICATOR KOMENTAR ADMIN */}
                        {doc.adminComment && (
                            <div className="group/comment relative">
                                <MessageSquareWarning size={16} className="text-orange-500 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white text-gray-700 text-xs rounded-lg shadow-xl border border-orange-100 hidden group-hover/comment:block z-20">
                                    <p className="font-bold text-orange-600 mb-1">Catatan Admin:</p>
                                    {doc.adminComment}
                                </div>
                            </div>
                        )}
                    </div>
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
                    doc.status === 'Revisi' ? 'bg-red-100 text-red-700 border-red-200' :
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
                  
                  {/* EDIT BUTTON (Available for Admin OR if doc needs revision) */}
                  {(userRole === 'ADMIN' || doc.status === 'Revisi' || doc.adminComment) && (
                      <button 
                        onClick={() => openEditModal(doc)}
                        className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
                        title="Edit / Revisi"
                      >
                        <Edit3 size={14}/>
                      </button>
                  )}

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
        {/* ... (Existing List Rendering Code) ... */}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !isUploading && setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                  {isEditMode ? 'Edit / Revisi Dokumen' : 'Tambah Dokumen Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isUploading} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Pesan Error di dalam Modal */}
              {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 whitespace-pre-wrap">
                     <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                     <div className="flex-1">
                       <p className="font-bold text-xs">Laporan Error</p>
                       <p className="text-xs opacity-90">{uploadError}</p>
                     </div>
                  </div>
              )}

              {/* TAMPILAN KOMENTAR ADMIN DI MODAL EDIT */}
              {isEditMode && adminCommentToShow && (
                  <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg flex items-start gap-3">
                      <MessageSquareWarning size={20} className="mt-1 shrink-0 text-orange-600"/>
                      <div>
                          <p className="text-xs font-bold text-orange-700 uppercase">Perlu Revisi / Catatan Admin:</p>
                          <p className="text-sm italic">"{adminCommentToShow}"</p>
                      </div>
                  </div>
              )}

              {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                      <div className="text-center">
                          <p className="text-lg font-bold text-gray-800">
                             {isEditMode ? 'Menyimpan Revisi...' : `Mengupload ${uploadProgress.current} dari ${uploadProgress.total}`}
                          </p>
                          <p className="text-xs text-blue-600 truncate max-w-[200px] mx-auto mt-1">
                              {uploadProgress.currentFile}
                          </p>
                      </div>
                      {!isEditMode && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            ></div>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 text-center max-w-[250px]">
                        Mohon jangan tutup halaman.
                      </p>
                  </div>
              ) : (
                <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEditMode ? 'Ganti File (Opsional)' : 'Upload File (Max 100 File)'}
                    </label>
                    <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${newDocData.files.length > 0 ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                    >
                    <input 
                        type="file" 
                        multiple={!isEditMode} // Edit mode hanya single file replacement
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        onChange={handleFileChange}
                    />
                    {newDocData.files.length > 0 ? (
                        <>
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                            <Files size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-800 text-center">{newDocData.files.length} File Dipilih</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {newDocData.files.length === 1 ? newDocData.files[0].name : 'Klik untuk ganti file'}
                        </p>
                        </>
                    ) : (
                        <>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <UploadCloud size={20} />
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            {isEditMode ? 'Klik jika ingin mengganti file lama' : 'Klik untuk upload file'}
                        </p>
                        <p className="text-xs text-gray-400 text-center mt-1">Max 4MB/file</p>
                        </>
                    )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dokumen</label>
                    <input 
                    type="text" 
                    className={`w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm ${(newDocData.files.length > 1 && !isEditMode) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    placeholder={(newDocData.files.length > 1 && !isEditMode) ? "(Otomatis menggunakan nama file asli)" : "Misal: Modul Ajar Matematika"}
                    value={newDocData.name}
                    disabled={(newDocData.files.length > 1 && !isEditMode)}
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
                    {isEditMode 
                        ? 'Simpan Perubahan' 
                        : (newDocData.files.length > 1 ? `Upload ${newDocData.files.length} File` : 'Simpan')}
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