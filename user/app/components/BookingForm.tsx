import { X, Calendar, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

interface BookingFormProps {
  stationName: string;
  onClose: () => void;
  onSubmit: (booking: BookingData) => void;
}

export interface BookingData {
  date: string;
  time: string;
  duration: string;
  chargerType: string;
}

export default function BookingForm({ stationName, onClose, onSubmit }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingData>({
    date: '',
    time: '',
    duration: '1',
    chargerType: 'Type 2'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="mb-1">Booking Charging</h2>
            <p className="text-sm text-muted-foreground">{stationName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Tanggal
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 bg-input-background border border-border rounded-lg"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Waktu
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full p-3 bg-input-background border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Durasi (jam)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full p-3 bg-input-background border border-border rounded-lg"
            >
              <option value="0.5">30 menit</option>
              <option value="1">1 jam</option>
              <option value="1.5">1.5 jam</option>
              <option value="2">2 jam</option>
              <option value="3">3 jam</option>
              <option value="4">4 jam</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              Tipe Charger
            </label>
            <select
              value={formData.chargerType}
              onChange={(e) => setFormData({ ...formData, chargerType: e.target.value })}
              className="w-full p-3 bg-input-background border border-border rounded-lg"
            >
              <option value="Type 2">Type 2 (AC)</option>
              <option value="CCS2">CCS2 (DC Fast)</option>
              <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
              <option value="GB/T">GB/T</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
