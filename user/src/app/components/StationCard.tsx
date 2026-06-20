import { MapPin, Battery, Clock, Star } from 'lucide-react';

interface StationCardProps {
  id: string;
  name: string;
  address: string;
  distance: string;
  availableChargers: number;
  totalChargers: number;
  pricePerKwh: number;
  rating: number;
  fastCharging: boolean;
  onClick: () => void;
}

export default function StationCard({
  name,
  address,
  distance,
  availableChargers,
  totalChargers,
  pricePerKwh,
  rating,
  fastCharging,
  onClick
}: StationCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="mb-1">{name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{address}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{distance}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm">{rating}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Battery className={`w-5 h-5 ${availableChargers > 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-sm">
            <span className={availableChargers > 0 ? 'text-green-600' : 'text-red-600'}>
              {availableChargers}
            </span>
            /{totalChargers} Tersedia
          </span>
        </div>
        <div className="flex flex-col items-end">
          {fastCharging && (
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded mb-1">
              Fast Charging
            </span>
          )}
          <span className="text-sm">Rp {pricePerKwh.toLocaleString()}/kWh</span>
        </div>
      </div>
    </div>
  );
}
