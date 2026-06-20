import { Calendar, Clock, Battery, MapPin, CreditCard } from 'lucide-react';

interface HistoryCardProps {
  date: string;
  time: string;
  stationName: string;
  location: string;
  duration: string;
  energy: string;
  cost: string;
  status: 'completed' | 'cancelled' | 'ongoing';
}

export default function HistoryCard({
  date,
  time,
  stationName,
  location,
  duration,
  energy,
  cost,
  status
}: HistoryCardProps) {
  const statusColors = {
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    ongoing: 'bg-blue-100 text-blue-700'
  };

  const statusLabels = {
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    ongoing: 'Sedang Berlangsung'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="mb-1">{stationName}</h4>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded text-sm ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <Battery className="w-4 h-4 text-muted-foreground" />
          <span>{energy} kWh</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{duration}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <span className="text-muted-foreground text-sm">Total Biaya</span>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span>Rp {cost}</span>
        </div>
      </div>
    </div>
  );
}
