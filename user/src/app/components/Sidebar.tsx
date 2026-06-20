import { X, Home, MapPin, Clock, User, Settings, HelpCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ isOpen, onClose, activeView, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'stations', label: 'Detail Stasiun', icon: MapPin },
    { id: 'map', label: 'Peta Stasiun', icon: MapPin },
    { id: 'history', label: 'Riwayat', icon: Clock },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
    { id: 'help', label: 'Bantuan', icon: HelpCircle },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`fixed left-0 top-0 h-full w-80 bg-card shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2>SPBKLU</h2>
            <p className="text-sm text-muted-foreground">Charging Station App</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                  activeView === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  );
}
