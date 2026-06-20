import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StationCard from './components/StationCard';
import StationDetails from './components/StationDetails';
import BookingForm, { BookingData } from './components/BookingForm';
import HistoryCard from './components/HistoryCard';
import ProfileView from './components/ProfileView';
import LoginPage, { UserData } from './components/LoginPage';
import VehicleSetup, { VehicleData } from './components/VehicleSetup';
import StationDetailView from './components/StationDetailView';
import BottomNav from './components/BottomNav';
import SettingsView from './components/SettingsView';
import QRISPayment from './components/QRISPayment';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Mock data - SPBKLU Surabaya
const stations = [
  {
    id: '1',
    name: 'SPBKLU Tunjungan Plaza',
    address: 'Jl. Basuki Rahmat No.8-12, Embong Kaliasin, Genteng, Surabaya',
    distance: '2.5 km dari Anda',
    availableChargers: 3,
    totalChargers: 8,
    pricePerKwh: 2500,
    rating: 4.8,
    fastCharging: true,
    operatingHours: '24 Jam',
    chargerTypes: ['Type 2', 'CCS2', 'CHAdeMO'],
    maxPower: '150 kW',
    facilities: ['Toilet', 'Musholla', 'Cafe', 'WiFi', 'Ruang Tunggu'],
    longitude: 112.738571,
    latitude: -7.263068,
    chargers: [
      { id: 'CH-01', name: 'Charger 01', type: 'Type 2 (AC)', power: '22 kW', soc: 85, status: 'charging' as const },
      { id: 'CH-02', name: 'Charger 02', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-03', name: 'Charger 03', type: 'CCS2 (DC)', power: '150 kW', soc: 62, status: 'charging' as const },
      { id: 'CH-04', name: 'Charger 04', type: 'CCS2 (DC)', power: '150 kW', soc: 0, status: 'available' as const },
      { id: 'CH-05', name: 'Charger 05', type: 'CHAdeMO (DC)', power: '100 kW', soc: 95, status: 'charging' as const },
      { id: 'CH-06', name: 'Charger 06', type: 'CHAdeMO (DC)', power: '100 kW', soc: 0, status: 'available' as const },
      { id: 'CH-07', name: 'Charger 07', type: 'Type 2 (AC)', power: '22 kW', soc: 45, status: 'maintenance' as const },
      { id: 'CH-08', name: 'Charger 08', type: 'CCS2 (DC)', power: '150 kW', soc: 0, status: 'offline' as const }
    ]
  },
  {
    id: '2',
    name: 'SPBKLU Pakuwon Mall',
    address: 'Jl. Puncak Indah Lontar No.2, Babatan, Wiyung, Surabaya',
    distance: '3.8 km dari Anda',
    availableChargers: 5,
    totalChargers: 10,
    pricePerKwh: 2800,
    rating: 4.9,
    fastCharging: true,
    operatingHours: '06:00 - 22:00',
    chargerTypes: ['Type 2', 'CCS2', 'GB/T'],
    maxPower: '180 kW',
    facilities: ['Toilet', 'Food Court', 'Mall Access', 'WiFi', 'Valet Parking'],
    longitude: 112.606445,
    latitude: -7.308889,
    chargers: [
      { id: 'CH-01', name: 'Charger 01', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-02', name: 'Charger 02', type: 'Type 2 (AC)', power: '22 kW', soc: 73, status: 'charging' as const },
      { id: 'CH-03', name: 'Charger 03', type: 'CCS2 (DC)', power: '180 kW', soc: 0, status: 'available' as const },
      { id: 'CH-04', name: 'Charger 04', type: 'CCS2 (DC)', power: '180 kW', soc: 88, status: 'charging' as const },
      { id: 'CH-05', name: 'Charger 05', type: 'CCS2 (DC)', power: '180 kW', soc: 0, status: 'available' as const },
      { id: 'CH-06', name: 'Charger 06', type: 'GB/T (DC)', power: '120 kW', soc: 56, status: 'charging' as const },
      { id: 'CH-07', name: 'Charger 07', type: 'GB/T (DC)', power: '120 kW', soc: 0, status: 'available' as const },
      { id: 'CH-08', name: 'Charger 08', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-09', name: 'Charger 09', type: 'CCS2 (DC)', power: '180 kW', soc: 92, status: 'charging' as const },
      { id: 'CH-10', name: 'Charger 10', type: 'Type 2 (AC)', power: '22 kW', soc: 18, status: 'maintenance' as const }
    ]
  },
  {
    id: '3',
    name: 'SPBKLU Galaxy Mall',
    address: 'Jl. Dharmahusada Indah Tim. No.37-39, Mojo, Gubeng, Surabaya',
    distance: '1.2 km dari Anda',
    availableChargers: 2,
    totalChargers: 6,
    pricePerKwh: 2300,
    rating: 4.6,
    fastCharging: true,
    operatingHours: '24 Jam',
    chargerTypes: ['Type 2', 'CHAdeMO'],
    maxPower: '100 kW',
    facilities: ['Toilet', 'Convenience Store', 'ATM', 'Security'],
    longitude: 112.753776,
    latitude: -7.272775,
    chargers: [
      { id: 'CH-01', name: 'Charger 01', type: 'Type 2 (AC)', power: '22 kW', soc: 67, status: 'charging' as const },
      { id: 'CH-02', name: 'Charger 02', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-03', name: 'Charger 03', type: 'CHAdeMO (DC)', power: '100 kW', soc: 91, status: 'charging' as const },
      { id: 'CH-04', name: 'Charger 04', type: 'CHAdeMO (DC)', power: '100 kW', soc: 0, status: 'available' as const },
      { id: 'CH-05', name: 'Charger 05', type: 'Type 2 (AC)', power: '22 kW', soc: 78, status: 'charging' as const },
      { id: 'CH-06', name: 'Charger 06', type: 'CHAdeMO (DC)', power: '100 kW', soc: 43, status: 'charging' as const }
    ]
  },
  {
    id: '4',
    name: 'SPBKLU Ciputra World',
    address: 'Jl. Mayjend Sungkono No.89, Pakis, Sawahan, Surabaya',
    distance: '4.5 km dari Anda',
    availableChargers: 7,
    totalChargers: 12,
    pricePerKwh: 2600,
    rating: 4.7,
    fastCharging: true,
    operatingHours: '24 Jam',
    chargerTypes: ['Type 2', 'CCS2', 'CHAdeMO', 'GB/T'],
    maxPower: '200 kW',
    facilities: ['Toilet', 'Musholla', 'Restaurant', 'WiFi', 'Lounge', 'Car Wash'],
    longitude: 112.729034,
    latitude: -7.283439,
    chargers: [
      { id: 'CH-01', name: 'Charger 01', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-02', name: 'Charger 02', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-03', name: 'Charger 03', type: 'CCS2 (DC)', power: '200 kW', soc: 0, status: 'available' as const },
      { id: 'CH-04', name: 'Charger 04', type: 'CCS2 (DC)', power: '200 kW', soc: 71, status: 'charging' as const },
      { id: 'CH-05', name: 'Charger 05', type: 'CCS2 (DC)', power: '200 kW', soc: 0, status: 'available' as const },
      { id: 'CH-06', name: 'Charger 06', type: 'CHAdeMO (DC)', power: '150 kW', soc: 89, status: 'charging' as const },
      { id: 'CH-07', name: 'Charger 07', type: 'CHAdeMO (DC)', power: '150 kW', soc: 0, status: 'available' as const },
      { id: 'CH-08', name: 'Charger 08', type: 'GB/T (DC)', power: '120 kW', soc: 0, status: 'available' as const },
      { id: 'CH-09', name: 'Charger 09', type: 'GB/T (DC)', power: '120 kW', soc: 64, status: 'charging' as const },
      { id: 'CH-10', name: 'Charger 10', type: 'Type 2 (AC)', power: '22 kW', soc: 0, status: 'available' as const },
      { id: 'CH-11', name: 'Charger 11', type: 'CCS2 (DC)', power: '200 kW', soc: 37, status: 'charging' as const },
      { id: 'CH-12', name: 'Charger 12', type: 'Type 2 (AC)', power: '22 kW', soc: 93, status: 'charging' as const }
    ]
  }
];

const initialHistoryData = [
  {
    date: '10 Mei 2026',
    time: '14:30',
    stationName: 'SPBKLU Tunjungan Plaza',
    location: 'Surabaya',
    duration: '2 jam',
    energy: '6',
    cost: '15.000',
    status: 'completed' as const
  },
  {
    date: '8 Mei 2026',
    time: '09:15',
    stationName: 'SPBKLU Pakuwon Mall',
    location: 'Surabaya',
    duration: '1.5 jam',
    energy: '4.5',
    cost: '12.600',
    status: 'completed' as const
  },
  {
    date: '5 Mei 2026',
    time: '16:00',
    stationName: 'SPBKLU Galaxy Mall',
    location: 'Surabaya',
    duration: '1 jam',
    energy: '3',
    cost: '6.900',
    status: 'cancelled' as const
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [vehicleSetupComplete, setVehicleSetupComplete] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<typeof stations[0] | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showQRISPayment, setShowQRISPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [bookingDetails, setBookingDetails] = useState<BookingData | null>(null);
  const [bookingStation, setBookingStation] = useState<typeof stations[0] | null>(null);
  const [history, setHistory] = useState<string[]>(['home']);
  const [historyData, setHistoryData] = useState(initialHistoryData);

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = (data: UserData) => {
    setUserData(data);
    setIsLoggedIn(true);
    toast.success('Login berhasil!', {
      description: `Selamat datang, ${data.name || data.email}!`
    });
  };

  const handleVehicleSetup = (data: VehicleData) => {
    setVehicleData(data);
    setVehicleSetupComplete(true);
    if (data.brand) {
      toast.success('Setup motor listrik berhasil!', {
        description: `${data.brand} telah ditambahkan ke profil Anda.`
      });
    } else {
      toast.info('Setup dilewati', {
        description: 'Anda dapat mengatur motor listrik nanti di menu Profil.'
      });
    }
  };

  const handleBook = () => {
    if (selectedStation) {
      setBookingStation(selectedStation);
    }
    setSelectedStation(null);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = (booking: BookingData) => {
    // Calculate payment amount based on duration
    const durationHours = parseFloat(booking.duration);
    const pricePerKwh = bookingStation?.pricePerKwh || 2500;
    // Estimate 3 kWh per hour for motorcycle
    const estimatedKwh = durationHours * 3;
    const amount = Math.round(estimatedKwh * pricePerKwh);

    setBookingDetails(booking);
    setPaymentAmount(amount);
    setShowBookingForm(false);
    setShowQRISPayment(true);
  };

  const handlePaymentSuccess = () => {
    // Add new booking to history
    if (bookingDetails && bookingStation) {
      const durationHours = parseFloat(bookingDetails.duration);
      const estimatedKwh = durationHours * 3;
      const formattedDate = new Date(bookingDetails.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const newHistoryItem = {
        date: formattedDate,
        time: bookingDetails.time,
        stationName: bookingStation.name,
        location: 'Surabaya',
        duration: `${bookingDetails.duration} jam`,
        energy: estimatedKwh.toFixed(1),
        cost: paymentAmount.toLocaleString(),
        status: 'ongoing' as const
      };

      setHistoryData([newHistoryItem, ...historyData]);
    }

    setShowQRISPayment(false);
    toast.success('Pembayaran berhasil!', {
      description: 'Anda akan diarahkan ke halaman riwayat...'
    });

    // Redirect to history page after 2 seconds
    setTimeout(() => {
      setBookingDetails(null);
      setBookingStation(null);
      handleNavigate('history');
    }, 2000);
  };

  const handleNavigate = (view: string) => {
    setHistory([...history, view]);
    setActiveView(view);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setActiveView(previousView);
      toast.info('Kembali ke halaman sebelumnya');
    } else {
      toast.info('Tidak ada halaman sebelumnya');
    }
  };

  const handleExit = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
      setIsLoggedIn(false);
      setVehicleSetupComplete(false);
      setUserData(null);
      setVehicleData(null);
      setActiveView('home');
      setHistory(['home']);
      toast.info('Anda telah keluar dari aplikasi');
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  if (!vehicleSetupComplete) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <VehicleSetup onComplete={handleVehicleSetup} />
      </>
    );
  }

  const renderContent = () => {
    if (activeView === 'profile') {
      return <ProfileView onClose={() => setActiveView('home')} vehicleData={vehicleData} />;
    }

    if (activeView === 'settings') {
      return <SettingsView />;
    }

    if (activeView === 'stations') {
      return <StationDetailView station={stations[0]} />;
    }

    if (activeView === 'history') {
      return (
        <div className="max-w-4xl mx-auto p-4">
          <h2 className="mb-4">Riwayat Pengisian</h2>
          <div className="space-y-3">
            {historyData.map((item, index) => (
              <HistoryCard key={index} {...item} />
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'map') {
      return (
        <div className="h-[calc(100vh-72px)] relative">
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3>Peta Stasiun</h3>
              <p className="text-muted-foreground">Fitur peta dalam pengembangan</p>
            </div>
          </div>
        </div>
      );
    }

    // Home view
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h2 className="mb-4">Temukan Stasiun Terdekat</h2>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari stasiun atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg"
              />
            </div>
            <button className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg whitespace-nowrap">
              Semua
            </button>
            <button className="px-4 py-2 bg-muted text-foreground rounded-lg whitespace-nowrap hover:bg-accent">
              Fast Charging
            </button>
            <button className="px-4 py-2 bg-muted text-foreground rounded-lg whitespace-nowrap hover:bg-accent">
              Tersedia
            </button>
            <button className="px-4 py-2 bg-muted text-foreground rounded-lg whitespace-nowrap hover:bg-accent">
              Terdekat
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3>Stasiun Tersedia ({filteredStations.length})</h3>
          {filteredStations.map((station) => (
            <StationCard
              key={station.id}
              {...station}
              onClick={() => setSelectedStation(station)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Toaster position="top-center" richColors />
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onProfileClick={() => setActiveView('profile')}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      {renderContent()}

      <BottomNav
        onNavigate={handleNavigate}
        onExit={handleExit}
        onUndo={handleUndo}
      />

      {selectedStation && (
        <StationDetails
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onBook={handleBook}
        />
      )}

      {showBookingForm && bookingStation && (
        <BookingForm
          stationName={bookingStation.name}
          onClose={() => {
            setShowBookingForm(false);
            setBookingStation(null);
          }}
          onSubmit={handleBookingSubmit}
        />
      )}

      {showQRISPayment && bookingStation && bookingDetails && (
        <QRISPayment
          stationName={bookingStation.name}
          amount={paymentAmount}
          duration={bookingDetails.duration + ' jam'}
          chargerType={bookingDetails.chargerType}
          onClose={() => {
            setShowQRISPayment(false);
            setBookingStation(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}