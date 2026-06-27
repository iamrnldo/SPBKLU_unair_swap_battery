import { X, CheckCircle, Clock, QrCode } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QRISPaymentProps {
  stationName: string;
  amount: number;
  duration: string;
  chargerType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QRISPayment({
  stationName,
  amount,
  duration,
  chargerType,
  onClose,
  onSuccess
}: QRISPaymentProps) {
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !isPaid) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isPaid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentSimulation = () => {
    setIsPaid(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="mb-1">Pembayaran QRIS</h2>
            <p className="text-sm text-muted-foreground">{stationName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isPaid ? (
          <>
            {/* Payment Details */}
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Durasi</span>
                <span>{duration}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tipe Charger</span>
                <span>{chargerType}</span>
              </div>
              <div className="h-px bg-border my-3"></div>
              <div className="flex justify-between items-center">
                <span>Total Pembayaran</span>
                <span className="text-2xl text-primary">Rp {amount.toLocaleString()}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg mb-4">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center mb-3">
                <div className="w-full h-full p-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* QR Code pattern simulation */}
                    <rect x="0" y="0" width="20" height="20" fill="#000"/>
                    <rect x="25" y="0" width="5" height="5" fill="#000"/>
                    <rect x="35" y="0" width="10" height="5" fill="#000"/>
                    <rect x="50" y="0" width="5" height="10" fill="#000"/>
                    <rect x="80" y="0" width="20" height="20" fill="#000"/>

                    <rect x="0" y="25" width="5" height="5" fill="#000"/>
                    <rect x="10" y="25" width="10" height="5" fill="#000"/>
                    <rect x="25" y="25" width="15" height="10" fill="#000"/>
                    <rect x="85" y="25" width="5" height="10" fill="#000"/>

                    <rect x="5" y="35" width="10" height="10" fill="#000"/>
                    <rect x="30" y="40" width="5" height="5" fill="#000"/>
                    <rect x="45" y="35" width="10" height="15" fill="#000"/>
                    <rect x="60" y="40" width="15" height="5" fill="#000"/>

                    <rect x="0" y="50" width="10" height="5" fill="#000"/>
                    <rect x="20" y="50" width="5" height="10" fill="#000"/>
                    <rect x="35" y="55" width="15" height="5" fill="#000"/>
                    <rect x="65" y="50" width="10" height="10" fill="#000"/>
                    <rect x="85" y="55" width="10" height="5" fill="#000"/>

                    <rect x="10" y="65" width="5" height="10" fill="#000"/>
                    <rect x="25" y="70" width="10" height="5" fill="#000"/>
                    <rect x="45" y="65" width="5" height="15" fill="#000"/>
                    <rect x="60" y="70" width="15" height="5" fill="#000"/>

                    <rect x="0" y="80" width="20" height="20" fill="#000"/>
                    <rect x="30" y="85" width="10" height="10" fill="#000"/>
                    <rect x="50" y="80" width="5" height="5" fill="#000"/>
                    <rect x="65" y="85" width="10" height="5" fill="#000"/>
                    <rect x="80" y="80" width="20" height="20" fill="#000"/>
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Scan QR Code dengan aplikasi pembayaran Anda
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-500">
                Kode akan kadaluarsa dalam <strong>{formatTime(countdown)}</strong>
              </span>
            </div>

            {/* Payment Methods */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">Scan dengan aplikasi:</p>
              <div className="grid grid-cols-4 gap-2">
                {['GoPay', 'OVO', 'DANA', 'ShopeePay'].map((app) => (
                  <div key={app} className="p-3 bg-muted rounded-lg text-center">
                    <QrCode className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs">{app}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo button */}
            <button
              onClick={handlePaymentSimulation}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Simulasi Pembayaran Berhasil
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="mb-2">Pembayaran Berhasil!</h3>
            <p className="text-muted-foreground mb-4">
              Transaksi Anda telah dikonfirmasi
            </p>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Dibayar</span>
                <span className="text-lg">Rp {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-green-600">Berhasil</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
