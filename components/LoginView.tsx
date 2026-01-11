import React, { useState } from 'react';
import { GraduationCap, ArrowRight, Lock, User, ShieldCheck, ChevronLeft } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: 'ADMIN' | 'GURU') => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'GURU' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (selectedRole === 'ADMIN') {
        if (password === 'admin123') {
          onLogin('ADMIN');
        } else {
          setError('Password admin salah.');
          setIsLoading(false);
        }
      } else if (selectedRole === 'GURU') {
        if (password === 'guru123') {
          onLogin('GURU');
        } else {
           setError('Password guru salah.');
           setIsLoading(false);
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl border border-white/40 animate-scale-in relative overflow-hidden transition-all duration-300" style={{ minHeight: '520px' }}>
        
        {/* Decorative Background Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SMPN 3 Pacet</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem Database Kurikulum</p>
        </div>

        <div className="relative z-10 min-h-[250px] flex flex-col justify-center">
            {!selectedRole ? (
                <div className="space-y-4 animate-fade-in">
                    <p className="text-center text-sm text-gray-500 mb-4">Silahkan pilih peran anda untuk masuk:</p>
                    
                    <button 
                        onClick={() => { setSelectedRole('ADMIN'); setError(''); setPassword(''); }}
                        className="w-full group relative flex items-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Admin Kurikulum</h3>
                            <p className="text-xs text-gray-500">Akses penuh & manajemen dokumen</p>
                        </div>
                        <ArrowRight className="absolute right-4 text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                    </button>

                    <button 
                         onClick={() => { setSelectedRole('GURU'); setError(''); setPassword(''); }}
                         className="w-full group relative flex items-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <User size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">Guru</h3>
                            <p className="text-xs text-gray-500">Lihat & download dokumen</p>
                        </div>
                         <ArrowRight className="absolute right-4 text-gray-300 group-hover:text-green-500 transition-colors" size={20} />
                    </button>
                </div>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4 animate-scale-in">
                    <button 
                        type="button" 
                        onClick={() => setSelectedRole(null)}
                        className="flex items-center text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
                    >
                        <ChevronLeft size={14} className="mr-1" /> Kembali ke pemilihan
                    </button>

                    <div className="text-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">
                            Masuk sebagai {selectedRole === 'ADMIN' ? 'Admin' : 'Guru'}
                        </h3>
                        <p className="text-xs text-gray-500">Masukkan password untuk melanjutkan</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 text-center font-medium animate-fade-in">
                        {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
                            placeholder="Masukkan password"
                            autoFocus
                        />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-xl font-medium shadow-xl transition-all flex items-center justify-center gap-2 mt-6 ${
                            selectedRole === 'ADMIN' 
                                ? 'bg-gray-900 text-white shadow-gray-400/20 hover:bg-black' 
                                : 'bg-green-600 text-white shadow-green-400/20 hover:bg-green-700'
                        } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                        {isLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                        <>
                            Masuk <ArrowRight size={18} />
                        </>
                        )}
                    </button>
                </form>
            )}
        </div>
        
        <div className="mt-8 text-center absolute bottom-6 left-0 right-0">
            <p className="text-[10px] text-gray-400">@2026 by erha</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;