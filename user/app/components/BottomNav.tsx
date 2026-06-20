import { Home, LogOut, Undo } from 'lucide-react';

interface BottomNavProps {
  onNavigate: (view: string) => void;
  onExit: () => void;
  onUndo: () => void;
}

export default function BottomNav({ onNavigate, onExit, onUndo }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom shadow-lg">
      <div className="flex items-center justify-around max-w-7xl mx-auto px-4">
        <button
          onClick={onExit}
          className="flex flex-col items-center gap-1 py-4 px-6 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="w-7 h-7" />
          <span className="text-sm font-medium">Exit</span>
        </button>

        <button
          onClick={onUndo}
          className="flex flex-col items-center gap-1 py-4 px-6 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <Undo className="w-7 h-7" />
          <span className="text-sm font-medium">Undo</span>
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center gap-1 py-4 px-6 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Home className="w-7 h-7" />
          <span className="text-sm font-medium">Home</span>
        </button>
      </div>
    </div>
  );
}
