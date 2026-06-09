import { Link, useLocation, Form } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import { useAuth } from "~/modules/authentication";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Menus", href: "/menus", icon: UtensilsCrossed },
  { label: "Staff", href: "/staff", icon: Users },
  { label: "Vendors", href: "/vendors", icon: Truck },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { config, loading } = useConfigurables();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const appName = loading ? "CaterFlow" : (config.appName ?? "CaterFlow");
  const logoUrl = config?.logoUrl && !config.logoUrl.startsWith("FILL_") ? config.logoUrl : null;

  return (
    <div className="flex h-screen bg-[#FAF7F0] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#1B5E47] text-white transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={appName} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9932A] text-white font-bold text-sm">
                CF
              </div>
            )}
            <span className="text-lg font-semibold tracking-tight">{appName}</span>
          </Link>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = location.pathname === href || location.pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[#C9932A] flex items-center justify-center text-white text-sm font-semibold">
              {user?.username?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username ?? "User"}</p>
              <p className="text-xs text-white/50 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <Form method="post" action="/auth/logout">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </Form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 lg:hidden">
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900">{appName}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
