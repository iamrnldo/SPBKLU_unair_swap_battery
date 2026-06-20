import { useState } from 'react';
import { Bike, Battery, Zap, Gauge, ChevronRight } from 'lucide-react';

interface VehicleSetupProps {
  onComplete: (vehicleData: VehicleData) => void;
}

export interface VehicleData {
  brand: string;
  model: string;
  batteryType: string;
  batteryCapacity: string;
  soc: string;
  plateNumber: string;
}

const motorcycleBrands = [
  'Gesits',
  'SELIS',
  'Volta',
  'Viar',
  'United E-Motor',
  'Ecgo',
  'BMX',
  'Alva',
  'NIU',
  'Super Soco',
  'Yadea',
  'Sunra',
  'Gogoro',
  'Zero Motorcycles',
  'Energica',
  'Lainnya'
];

const batteryTypes = [
  'Lithium-ion (Li-ion)',
  'Lithium Iron Phosphate (LFP)',
  'Nickel Manganese Cobalt (NMC)',
  'Nickel Cobalt Aluminum (NCA)',
  'Solid State Battery'
];

export default function VehicleSetup({ onComplete }: VehicleSetupProps) {
  const [formData, setFormData] = useState<VehicleData>({
    brand: '',
    model: '',
    batteryType: '',
    batteryCapacity: '',
    soc: '',
    plateNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.brand && formData.plateNumber) {
      onComplete(formData);
    }
  };

  const canProceed = () => {
    return formData.brand && formData.plateNumber;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4">
            <Bike className="w-8 h-8" />
          </div>
          <h1 className="mb-2">Setup Motor Listrik Anda</h1>
          <p className="text-muted-foreground">
            Lengkapi informasi motor listrik untuk pengalaman yang lebih baik
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-lg">
          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <Bike className="w-4 h-4" />
                Merk Motor Listrik
              </label>
              <select
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Pilih merk motor listrik</option>
                {motorcycleBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Bike className="w-4 h-4" />
                Nomor Plat Motor
              </label>
              <input
                type="text"
                required
                placeholder="B 1234 XYZ"
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                className="w-full p-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Informasi ini akan membantu kami memberikan rekomendasi stasiun pengisian yang sesuai dengan motor listrik Anda
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canProceed()}
            className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selesai
          </button>

          <button
            type="button"
            onClick={() => onComplete(formData)}
            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Lewati untuk saat ini
          </button>
        </form>
      </div>
    </div>
  );
}
