import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileSpreadsheet,
  BadgeDollarSign,
  CreditCard,
  UserCheck,
  BarChart3,
  Percent,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  Building2,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storedUser = localStorage.getItem('salesia_user');
  const user = storedUser ? JSON.parse(storedUser) : {
    full_name: 'Administrador General',
    role: 'ADMINISTRADOR',
    roles: ['ADMINISTRADOR'],
    permisos: ['empresas:configurar'],
    email: 'admin@salesia.com'
  };

  const userPermisos: string[] = user.permisos || [];
  const userRoles: string[] = user.roles || (user.role ? [user.role] : []);
  const esAdmin = userRoles.some((r: string) => r.toUpperCase().includes('ADMIN')) || userPermisos.includes('empresas:configurar');

  const tienePermiso = (codigo?: string) => {
    if (!codigo || esAdmin) return true;
    return userPermisos.includes(codigo);
  };

  const handleLogout = () => {
    localStorage.removeItem('salesia_token');
    localStorage.removeItem('salesia_user');
    navigate('/login');
  };

  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    permiso?: string;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const allNavGroups: NavGroup[] = [
    {
      group: 'PRINCIPAL',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },

    {
      group: 'GESTIÓN COMERCIAL',
      items: [
        { label: 'Clientes', path: '/customers', icon: Users, permiso: 'clientes:leer' },
        { label: 'Productos', path: '/products', icon: Package, permiso: 'productos:leer' },
        { label: 'Inventario', path: '/inventory', icon: Boxes, permiso: 'inventario:leer' },
        { label: 'Pedidos', path: '/orders', icon: FileSpreadsheet, permiso: 'pedidos:crear' },
        { label: 'Ventas', path: '/sales', icon: BadgeDollarSign, permiso: 'ventas:crear' },
        { label: 'Pagos', path: '/payments', icon: CreditCard, permiso: 'pagos:registrar' }
      ]
    },
    {
      group: 'PERSONAL',
      items: [
        { label: 'Vendedores', path: '/employees', icon: UserCheck, permiso: 'personal:administrar' }
      ]
    },
    {
      group: 'INTELIGENCIA COMERCIAL',
      items: [
        { label: 'Analytics', path: '/analytics', icon: BarChart3, permiso: 'analytics:ver' },
        { label: 'Probabilidades', path: '/probability', icon: Percent, permiso: 'probabilidad:calcular' },
        { label: 'Insights', path: '/insights', icon: Sparkles, permiso: 'insights:ver' },
        { label: 'Reportes', path: '/reports', icon: FileText, permiso: 'reportes:exportar' }
      ]
    },
    {
      group: 'ADMINISTRACIÓN',
      items: [
        { label: 'Configuración & RBAC', path: '/settings', icon: Settings, permiso: 'empresas:configurar' }
      ]
    }
  ];

  const navGroups = allNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => tienePermiso(item.permiso))
    }))
    .filter(group => group.items.length > 0);


  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/60">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <BadgeDollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              SalesIA <span className="text-[10px] uppercase font-semibold tracking-wider bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/60">Enterprise</span>
            </h1>
            <p className="text-[11px] text-slate-400">Plataforma Comercial & BI</p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.group}>
              <h2 className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
                {group.group}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-sky-600/90 text-white shadow-sm shadow-sky-600/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card in Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user.full_name}</p>
              <p className="text-[10px] text-sky-400 font-medium truncate">
                {user.roles && user.roles.length > 0 ? user.roles.join(' • ') : user.role}
              </p>

            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>SalesIA Tech Solutions S.A.C.</span>
              <span className="text-slate-300">/</span>
              <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-sky-200">
                USD • IGV 18%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>PostgreSQL 18 Activo</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
