import { MapPin, Navigation, Battery, Copy, ExternalLink, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface ChargerStatus {
  id: string;
  name: string;
  type: string;
  power: string;
  soc: number;
  status: 'available' | 'charging' | 'maintenance' | 'offline';
}

interface StationDetailViewProps {
  station: {
    id: string;
    name: string;
    address: string;
    longitude: number;
    latitude: number;
    chargers: ChargerStatus[];
  };
}

export default function StationDetailView({ station }: StationDetailViewProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`, {
      description: text
    });
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${station.latitude},${station.longitude}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'charging':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'charging':
        return 'Sedang Mengisi';
      case 'maintenance':
        return 'Maintenance';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  const getSoCColor = (soc: number) => {
    if (soc < 20) return 'text-red-500';
    if (soc < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const availableChargers = station.chargers.filter(c => c.status === 'available').length;
  const chargingChargers = station.chargers.filter(c => c.status === 'charging').length;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header Card */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="mb-2">{station.name}</h2>
            <div className="flex items-start gap-2 text-muted-foreground mb-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>{station.address}</p>
            </div>
          </div>
          <button
            onClick={openInMaps}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Buka Peta
          </button>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Latitude</span>
              <button
                onClick={() => copyToClipboard(station.latitude.toString(), 'Latitude')}
                className="p-1 hover:bg-accent rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="font-mono">{station.latitude.toFixed(6)}°</p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Longitude</span>
              <button
                onClick={() => copyToClipboard(station.longitude.toString(), 'Longitude')}
                className="p-1 hover:bg-accent rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="font-mono">{station.longitude.toFixed(6)}°</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-2xl text-green-600">{availableChargers}</p>
            <p className="text-sm text-muted-foreground">Tersedia</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-2xl text-blue-600">{chargingChargers}</p>
            <p className="text-sm text-muted-foreground">Sedang Mengisi</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl">{station.chargers.length}</p>
            <p className="text-sm text-muted-foreground">Total Charger</p>
          </div>
        </div>
      </div>

      {/* Chargers Status */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3>Status Charger & SoC</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Update
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {station.chargers.map((charger) => (
            <div
              key={charger.id}
              className="p-4 border-2 rounded-lg transition-all hover:shadow-md"
              style={{
                borderColor: charger.status === 'available' ? '#22c55e' :
                            charger.status === 'charging' ? '#3b82f6' :
                            charger.status === 'maintenance' ? '#eab308' : '#ef4444'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="mb-1">{charger.name}</h4>
                  <p className="text-sm text-muted-foreground">{charger.type}</p>
                </div>
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daya</span>
                  <span>{charger.power}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">SoC Baterai</span>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-5 h-5 ${getSoCColor(charger.soc)}`} />
                      <span className={`text-lg ${getSoCColor(charger.soc)}`}>
                        {charger.soc}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        charger.soc < 20 ? 'bg-red-500' :
                        charger.soc < 50 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${charger.soc}%` }}
                    ></div>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-lg border text-center text-sm ${getStatusColor(charger.status)}`}>
                  {getStatusLabel(charger.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Preview */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="mb-4">Lokasi Peta</h3>
        <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps?q=${station.latitude},${station.longitude}&output=embed`}
            allowFullScreen
          ></iframe>
          <button
            onClick={openInMaps}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white text-foreground rounded-lg shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Lihat di Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}
