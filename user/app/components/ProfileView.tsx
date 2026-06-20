import { User, Mail, Phone, Bike, CreditCard, Edit } from 'lucide-react';

interface ProfileViewProps {
  onClose: () => void;
  vehicleData?: {
    brand: string;
    model: string;
    batteryType: string;
    batteryCapacity: string;
    soc: string;
    plateNumber: string;
  } | null;
}

export default function ProfileView({ onClose, vehicleData }: ProfileViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-card rounded-lg p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1">Budi Santoso</h2>
            <p className="text-sm text-muted-foreground">Member sejak Jan 2024</p>
          </div>
          <button className="p-2 hover:bg-accent rounded-lg">
            <Edit className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p>budi.santoso@email.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Telepon</p>
              <p>+62 812-3456-7890</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 mb-4">
        <h3 className="mb-4">Motor Listrik</h3>
        {vehicleData && vehicleData.brand ? (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Bike className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p>{vehicleData.brand}</p>
              <p className="text-sm text-muted-foreground">{vehicleData.plateNumber}</p>
            </div>
            <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
              Ubah
            </button>
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground mb-3">Belum ada motor listrik terdaftar</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
              + Tambah Motor Listrik
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg p-6">
        <h3 className="mb-4">Metode Pembayaran</h3>
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-3">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p>•••• •••• •••• 4567</p>
            <p className="text-sm text-muted-foreground">Expires 12/26</p>
          </div>
          <span className="px-2 py-1 text-xs bg-accent rounded">Default</span>
        </div>
        <button className="w-full py-2 border border-border rounded-lg hover:bg-accent transition-colors">
          + Tambah Kartu
        </button>
      </div>
    </div>
  );
}
