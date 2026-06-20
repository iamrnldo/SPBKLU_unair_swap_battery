import { X, MapPin, Battery, Clock, Zap, CreditCard, Star } from 'lucide-react';

interface StationDetailsProps {
  station: {
    id: string;
    name: string;
    address: string;
    distance: string;
    availableChargers: number;
    totalChargers: number;
    pricePerKwh: number;
    rating: number;
    fastCharging: boolean;
    operatingHours: string;
    chargerTypes: string[];
    maxPower: string;
    facilities: string[];
  };
  onClose: () => void;
  onBook: () => void;
}

export default function StationDetails({ station, onClose, onBook }: StationDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-card w-full max-w-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="mb-2">{station.name}</h2>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm">{station.rating}</span>
              </div>
              {station.fastCharging && (
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-sm">
                  Fast Charging
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm">{station.address}</p>
              <p className="text-sm text-muted-foreground">{station.distance}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="w-5 h-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Ketersediaan</span>
              </div>
              <p>
                <span className="text-green-600">{station.availableChargers}</span>
                /{station.totalChargers} Charger
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Harga</span>
              </div>
              <p>Rp {station.pricePerKwh.toLocaleString()}/kWh</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Jam Operasional</span>
              </div>
              <p className="text-sm">{station.operatingHours}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Daya Maksimal</span>
              </div>
              <p>{station.maxPower}</p>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h4 className="mb-2">Tipe Charger</h4>
            <div className="flex flex-wrap gap-2">
              {station.chargerTypes.map((type, index) => (
                <span key={index} className="bg-accent text-accent-foreground px-3 py-1 rounded text-sm">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <h4 className="mb-2">Fasilitas</h4>
            <div className="grid grid-cols-2 gap-2">
              {station.facilities.map((facility, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{facility}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onBook}
          disabled={station.availableChargers === 0}
          className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {station.availableChargers > 0 ? 'Booking Sekarang' : 'Tidak Tersedia'}
        </button>
      </div>
    </div>
  );
}
