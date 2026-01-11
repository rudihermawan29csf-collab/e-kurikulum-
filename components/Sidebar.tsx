import React from 'react';
import { 
  FolderOpen, 
  Settings, 
  LogOut, 
  GraduationCap
} from 'lucide-react';
import { ViewState, Role } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout }) => {
  
  // Filter menu based on Role
  const menuItems = [
    { id: 'DOCUMENTS', label: 'Dokumen Kurikulum', icon: FolderOpen },
    ...(userRole === 'ADMIN' ? [{ id: 'SETTINGS', label: 'Pengaturan', icon: Settings }] : []),
  ];

  return (
    <div className="h-16 w-full glass-sidebar fixed top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-8 z-50 border-b border-gray-200/50 shadow-sm">
      {/* Header / Logo */}
      <div className="flex items-center md:min-w-[200px]">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md mr-3 text-white transition-transform hover:scale-105 cursor-pointer flex-shrink-0">
          <GraduationCap size={18} />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-gray-800 tracking-tight leading-tight">SMPN 3 Pacet</h1>
          <p className="text-[10px] text-gray-500 font-medium leading-tight">Database Kurikulum</p>
        </div>
      </div>

      {/* Navigation - Center Horizontal (Responsive) */}
      <nav className="flex items-center gap-1 sm:gap-2 absolute left-1/2 transform -translate-x-1/2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex items-center justify-center sm:justify-start px-2.5 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive 
                  ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' 
                  : 'text-gray-500 hover:bg-black/5 hover:text-gray-900'
              }`}
              title={item.label}
            >
              <Icon 
                size={18} 
                className={`${isActive ? 'text-blue-500' : 'text-gray-400'} sm:mr-2`} 
              />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile / Right Actions */}
      <div className="flex items-center justify-end gap-3 md:min-w-[200px]">
        <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">
                {userRole === 'ADMIN' ? 'Administrator' : 'Guru'}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">{userRole}</p>
        </div>
        <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold ${userRole === 'ADMIN' ? 'bg-gray-800' : 'bg-blue-500'}`}>
            {userRole === 'ADMIN' ? 'A' : 'G'}
        </div>
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
        <button 
            onClick={onLogout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-md"
            title="Keluar"
        >
            <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;