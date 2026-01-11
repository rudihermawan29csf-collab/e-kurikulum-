import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { IDashboardStat, IDocument, AppConfig } from '../types';

interface DashboardProps {
    documents: IDocument[];
    appConfig: AppConfig;
}

const COLORS = ['#10B981', '#F59E0B', '#6B7280', '#EF4444'];

const StatCard: React.FC<{ stat: IDashboardStat }> = ({ stat }) => {
  const getIcon = () => {
    switch (stat.iconName) {
      case 'file': return <FileText className="text-blue-500" size={24} />;
      case 'check': return <CheckCircle className="text-green-500" size={24} />;
      case 'clock': return <Clock className="text-orange-500" size={24} />;
      default: return <AlertCircle className="text-gray-500" size={24} />;
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{stat.value}</h3>
        {stat.trend && (
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-100 px-2 py-1 rounded-full inline-block">
            {stat.trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-opacity-10 ${stat.color} bg-white`}>
        {getIcon()}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ documents, appConfig }) => {
  
  // Calculate Stats Dynamically
  const stats: IDashboardStat[] = useMemo(() => {
    const total = documents.length;
    const valid = documents.filter(d => d.status === 'Valid').length;
    const draft = documents.filter(d => d.status === 'Draft').length;
    const arsip = documents.filter(d => d.status === 'Arsip').length;
    
    return [
        { label: 'Total Dokumen', value: total, iconName: 'file', color: 'bg-blue-100' },
        { label: 'Dokumen Valid', value: valid, iconName: 'check', color: 'bg-green-100' },
        { label: 'Draft / Proses', value: draft, iconName: 'clock', color: 'bg-orange-100' },
        { label: 'Arsip / Revisi', value: arsip, iconName: 'alert', color: 'bg-red-100' },
    ];
  }, [documents]);

  // Calculate Bar Chart Data (Group by Category)
  const barData = useMemo(() => {
      const catMap: Record<string, { total: number; valid: number }> = {};
      
      documents.forEach(doc => {
          if (!catMap[doc.category]) {
              catMap[doc.category] = { total: 0, valid: 0 };
          }
          catMap[doc.category].total += 1;
          if (doc.status === 'Valid') {
              catMap[doc.category].valid += 1;
          }
      });

      return Object.keys(catMap).map(key => ({
          name: key,
          valid: catMap[key].valid,
          total: catMap[key].total
      })).slice(0, 6); // Limit to top 6 categories for UI cleanliness
  }, [documents]);

  // Calculate Pie Chart Data (Status Distribution)
  const pieData = useMemo(() => {
      const statusCounts = { Valid: 0, Draft: 0, Arsip: 0 };
      documents.forEach(doc => {
          if (doc.status === 'Valid') statusCounts.Valid++;
          else if (doc.status === 'Draft') statusCounts.Draft++;
          else statusCounts.Arsip++;
      });

      return [
          { name: 'Valid', value: statusCounts.Valid },
          { name: 'Draft', value: statusCounts.Draft },
          { name: 'Arsip', value: statusCounts.Arsip },
      ].filter(d => d.value > 0);
  }, [documents]);

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-1">Ringkasan aktivitas kurikulum SMPN 3 Pacet.</p>
        </div>
        <div className="text-right">
           <span className="text-sm font-medium text-gray-500">Tahun Ajaran</span>
           <div className="text-lg font-bold text-gray-800">{appConfig.academicYear}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribusi Dokumen per Kategori</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 10}} 
                  dy={10}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="valid" name="Valid" fill="#10B981" radius={[6, 6, 0, 0]} stackId="a" />
                <Bar dataKey="total" name="Total Upload" fill="#E5E7EB" radius={[6, 6, 0, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 self-start w-full">Status Dokumen</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 justify-center w-full flex-wrap">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;