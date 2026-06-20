import { Menu, User, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export default function Header({ onMenuClick, onProfileClick }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1>SPBKLU</h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={onProfileClick}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
