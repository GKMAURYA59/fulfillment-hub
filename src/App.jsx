import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldAlert,
  Printer,
  ChevronRight,
  MapPin,
  Check,
  X,
  Building2,
  Sparkles,
  Zap,
  BarChart3,
  UserCheck,
  LayoutDashboard
} from 'lucide-react';

// Audio feedback generator for warehouse scanner simulation
const playSound = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.setValueAtTime(120, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    }
  } catch (e) {
    console.error('Audio context error', e);
  }
};

const INITIAL_PRODUCTS = [
  { sku: 'TSHIRT-BLK-L', name: 'Classic Unisex Cotton Tee', variant: 'Black / Large', bin: 'A-12-03', locationZone: 'MAIN', barcode: '849201823011', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80', stockMain: 42, stockSecondary: 120 },
  { sku: 'TSHIRT-BLK-M', name: 'Classic Unisex Cotton Tee', variant: 'Black / Medium', bin: 'A-12-02', locationZone: 'MAIN', barcode: '849201823012', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80', stockMain: 5, stockSecondary: 80 },
  { sku: 'HOODIE-GRY-XL', name: 'Heavyweight Pullover Hoodie', variant: 'Heather Grey / XL', bin: 'B-04-01', locationZone: 'MAIN', barcode: '739104829102', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80', stockMain: 18, stockSecondary: 50 },
  { sku: 'CAP-NVY-OS', name: 'Structured Dad Cap', variant: 'Navy / One Size', bin: 'C-01-14', locationZone: 'SECONDARY', barcode: '910284719203', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&q=80', stockMain: 0, stockSecondary: 45 },
  { sku: 'MUG-WHT-12', name: 'Ceramic Coffee Mug 12oz', variant: 'Glossy White', bin: 'D-08-05', locationZone: 'MAIN', barcode: '619284019283', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80', stockMain: 60, stockSecondary: 200 },
  { sku: 'SOCKS-CREW-WHT', name: 'Athletic Crew Socks 3-Pack', variant: 'White / US 9-12', bin: 'A-02-09', locationZone: 'MAIN', barcode: '510293847561', image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=300&q=80', stockMain: 100, stockSecondary: 300 }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-8921',
    customer: 'Sarah Jenkins',
    channel: 'Shopify Store',
    isPriority: true,
    cutoffMinutes: 24,
    status: 'RECEIVED',
    createdAt: '10:15 AM',
    courier: 'DHL Express',
    items: [
      { sku: 'TSHIRT-BLK-L', quantity: 2, picked: 0, packed: 0 },
      { sku: 'HOODIE-GRY-XL', quantity: 1, picked: 0, packed: 0 }
    ],
    stagingZone: null
  },
  {
    id: 'ORD-8922',
    customer: 'Marcus Vance',
    channel: 'Amazon US',
    isPriority: true,
    cutoffMinutes: 45,
    status: 'PICKING',
    createdAt: '10:22 AM',
    courier: 'FedEx Priority',
    items: [
      { sku: 'CAP-NVY-OS', quantity: 1, picked: 0, packed: 0 }
    ],
    stagingZone: null
  },
  {
    id: 'ORD-8923',
    customer: 'Elena Rostova',
    channel: 'WooCommerce',
    isPriority: false,
    cutoffMinutes: 180,
    status: 'RECEIVED',
    createdAt: '10:45 AM',
    courier: 'USPS Ground',
    items: [
      { sku: 'MUG-WHT-12', quantity: 4, picked: 0, packed: 0 },
      { sku: 'SOCKS-CREW-WHT', quantity: 2, picked: 0, packed: 0 }
    ],
    stagingZone: null
  },
  {
    id: 'ORD-8920',
    customer: 'David Miller',
    channel: 'Shopify Store',
    isPriority: false,
    cutoffMinutes: 120,
    status: 'PACKING',
    createdAt: '09:50 AM',
    courier: 'FedEx Ground',
    items: [
      { sku: 'TSHIRT-BLK-M', quantity: 1, picked: 1, packed: 0 }
    ],
    stagingZone: null
  },
  {
    id: 'ORD-8918',
    customer: 'Jessica Taylor',
    channel: 'Etsy Direct',
    isPriority: true,
    cutoffMinutes: 10,
    status: 'ISSUE',
    createdAt: '09:30 AM',
    courier: 'DHL Express',
    issueReason: 'Stock Discrepancy reported at Bin A-12-02 (TSHIRT-BLK-M missing)',
    items: [
      { sku: 'TSHIRT-BLK-M', quantity: 2, picked: 0, packed: 0 }
    ],
    stagingZone: null
  },
  {
    id: 'ORD-8915',
    customer: 'Tom Brady',
    channel: 'Shopify Store',
    isPriority: false,
    cutoffMinutes: 300,
    status: 'STAGED',
    createdAt: '08:40 AM',
    courier: 'DHL Express',
    stagingZone: 'STAGE-DHL-02',
    items: [
      { sku: 'SOCKS-CREW-WHT', quantity: 1, picked: 1, packed: 1 }
    ]
  },
  {
    id: 'ORD-8912',
    customer: 'Amanda Lewis',
    channel: 'Amazon US',
    isPriority: false,
    cutoffMinutes: 0,
    status: 'SHIPPED',
    createdAt: '08:10 AM',
    courier: 'USPS Ground',
    stagingZone: 'STAGE-USPS-01',
    items: [
      { sku: 'MUG-WHT-12', quantity: 2, picked: 2, packed: 2 }
    ]
  }
];

const COURIER_SCHEDULES = [
  { id: 'dhl', name: 'DHL Express', nextPickup: '11:45 AM (In 22 min)', stagedBoxes: 14, driverStatus: 'En Route' },
  { id: 'fedex', name: 'FedEx Priority / Ground', nextPickup: '01:30 PM (In 2h 07m)', stagedBoxes: 28, driverStatus: 'Scheduled' },
  { id: 'usps', name: 'USPS Ground Advantage', nextPickup: '03:00 PM (In 3h 37m)', stagedBoxes: 9, driverStatus: 'Scheduled' }
];

export default function App() {
  const [activeRole, setActiveRole] = useState('kiosk');
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, time: '10:52 AM', text: 'System initialized. 2 Priority orders require immediate processing.', type: 'info' }
  ]);

  const [activeOrderId, setActiveOrderId] = useState(null);
  const [currentPickItemIndex, setCurrentPickItemIndex] = useState(0);
  const [scannedInput, setScannedInput] = useState('');
  const [scanErrorModal, setScanErrorModal] = useState(null);
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [stagingModalOpen, setStagingModalOpen] = useState(false);
  const [printedLabelOrder, setPrintedLabelOrder] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);

  const scanInputRef = useRef(null);

  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ id: Date.now(), time, text, type }, ...prev.slice(0, 49)]);
  };

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === activeOrderId) || null;
  }, [orders, activeOrderId]);

  const priorityQueue = useMemo(() => {
    return orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PICKING' || o.status === 'PACKING')
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.cutoffMinutes - b.cutoffMinutes;
      });
  }, [orders]);

  useEffect(() => {
    if (activeRole === 'kiosk' && activeOrder && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [activeRole, activeOrder, currentPickItemIndex]);

  const handlePhysicalScanSubmit = (e) => {
    e.preventDefault();
    if (!scannedInput.trim()) return;
    verifyBarcode(scannedInput.trim());
    setScannedInput('');
  };

  const verifyBarcode = (barcodeScanned) => {
    if (!activeOrder) return;

    const currentItem = activeOrder.items[currentPickItemIndex];
    const productInfo = products.find((p) => p.sku === currentItem.sku);

    if (!productInfo) return;

    if (barcodeScanned === productInfo.barcode || barcodeScanned === productInfo.sku) {
      playSound('success', soundEnabled);
      addLog(`[PASS] Verified SKU: ${productInfo.sku} (${productInfo.variant}) for Order ${activeOrder.id}`, 'success');

      const updatedOrders = orders.map((ord) => {
        if (ord.id === activeOrder.id) {
          const updatedItems = [...ord.items];
          const itemToUpdate = { ...updatedItems[currentPickItemIndex] };
          itemToUpdate.picked = Math.min(itemToUpdate.quantity, itemToUpdate.picked + 1);
          updatedItems[currentPickItemIndex] = itemToUpdate;

          const allPicked = updatedItems.every((it) => it.picked >= it.quantity);
          const nextStatus = allPicked ? 'PACKING' : 'PICKING';

          return { ...ord, items: updatedItems, status: nextStatus };
        }
        return ord;
      });

      setOrders(updatedOrders);

      if (currentItem.picked + 1 >= currentItem.quantity) {
        if (currentPickItemIndex + 1 < activeOrder.items.length) {
          setCurrentPickItemIndex((prev) => prev + 1);
        }
      }
    } else {
      playSound('error', soundEnabled);
      addLog(`[REJECT] Wrong barcode scanned "${barcodeScanned}". Expected ${productInfo.barcode} (${productInfo.sku})`, 'error');
      setScanErrorModal({
        scanned: barcodeScanned,
        expectedSku: productInfo.sku,
        expectedBarcode: productInfo.barcode,
        expectedName: productInfo.name,
        expectedVariant: productInfo.variant
      });
    }
  };

  const handleReportDiscrepancy = (reason) => {
    if (!activeOrder) return;
    const currentItem = activeOrder.items[currentPickItemIndex];
    const productInfo = products.find((p) => p.sku === currentItem.sku);

    playSound('error', soundEnabled);
    addLog(`[ALERT] Inventory Discrepancy reported on Order ${activeOrder.id} at Bin ${productInfo?.bin}! Flagged for Office.`, 'error');

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === activeOrder.id
          ? {
              ...ord,
              status: 'ISSUE',
              issueReason: `Warehouse Gap: ${productInfo?.sku} (${productInfo?.variant}) missing at Bin ${productInfo?.bin}. Notes: ${reason}`
            }
          : ord
      )
    );

    setDiscrepancyModalOpen(false);
    setActiveOrderId(null);
  };

  const handleCompletePacking = () => {
    if (!activeOrder) return;
    playSound('success', soundEnabled);

    let stagingZone = 'STAGE-A-01';
    if (activeOrder.courier.includes('DHL')) stagingZone = 'STAGE-DHL-04';
    if (activeOrder.courier.includes('FedEx')) stagingZone = 'STAGE-FEDEX-12';
    if (activeOrder.courier.includes('USPS')) stagingZone = 'STAGE-USPS-02';

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === activeOrder.id
          ? {
              ...ord,
              status: 'STAGED',
              stagingZone,
              items: ord.items.map((i) => ({ ...i, packed: i.quantity }))
            }
          : ord
      )
    );

    setPrintedLabelOrder({ ...activeOrder, stagingZone });
    addLog(`[PACKED] Order ${activeOrder.id} packed and assigned to ${stagingZone}`, 'success');
    setStagingModalOpen(true);
  };

  const finishKioskOrderSession = () => {
    setStagingModalOpen(false);
    setPrintedLabelOrder(null);
    setActiveOrderId(null);
    setCurrentPickItemIndex(0);
  };

  const handleTransferStock = (sku) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === sku && p.stockSecondary > 0) {
          return {
            ...p,
            stockMain: p.stockMain + 10,
            stockSecondary: p.stockSecondary - 10
          };
        }
        return p;
      })
    );
    addLog(`[STOCK MOVED] Transferred 10 units of ${sku} from Secondary to Main Warehouse.`, 'info');
  };

  const filteredOfficeOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesPriority = !priorityOnly || o.isPriority;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.courier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const issueOrdersCount = orders.filter((o) => o.status === 'ISSUE').length;
  const urgentPriorityCount = orders.filter((o) => o.isPriority && (o.status === 'RECEIVED' || o.status === 'PICKING')).length;

  return (
    <div className={`min-h-screen font-sans ${highContrast ? 'bg-black text-yellow-300' : 'bg-slate-900 text-slate-100'} transition-colors duration-200`}>
      <header className={`border-b ${highContrast ? 'border-yellow-500 bg-black' : 'border-slate-800 bg-slate-950'} sticky top-0 z-40 px-4 py-3 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${highContrast ? 'bg-yellow-400 text-black' : 'bg-indigo-600 text-white'} shadow-md`}>
              <Package className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                FULFILLMENT HUB
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal border border-slate-700">By GK Maurya</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">XYZ Logistics-Order & Warehouse Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveRole('kiosk');
                playSound('click', soundEnabled);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeRole === 'kiosk'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-extrabold shadow-lg'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Warehouse Kiosk</span>
              {urgentPriorityCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  {urgentPriorityCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveRole('office');
                playSound('click', soundEnabled);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeRole === 'office'
                  ? highContrast
                    ? 'bg-yellow-400 text-black font-extrabold shadow-lg'
                    : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Office Overview</span>
              {issueOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-xs font-extrabold">
                  {issueOrdersCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Warehouse Sound Effects' : 'Enable Audio Prompts'}
              className={`p-2.5 rounded-lg border text-sm font-semibold transition ${
                soundEnabled ? 'border-slate-700 bg-slate-800 text-emerald-400' : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle High-Contrast Warehouse Light Mode"
              className={`p-2.5 rounded-lg border text-sm font-semibold transition ${
                highContrast ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-slate-700 bg-slate-800 text-slate-300'
              }`}
            >
              {highContrast ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {activeRole === 'kiosk' ? (
          <WarehouseKioskView
            orders={orders}
            activeOrder={activeOrder}
            setActiveOrderId={setActiveOrderId}
            priorityQueue={priorityQueue}
            currentPickItemIndex={currentPickItemIndex}
            setCurrentPickItemIndex={setCurrentPickItemIndex}
            products={products}
            scannedInput={scannedInput}
            setScannedInput={setScannedInput}
            handlePhysicalScanSubmit={handlePhysicalScanSubmit}
            verifyBarcode={verifyBarcode}
            scanInputRef={scanInputRef}
            highContrast={highContrast}
            soundEnabled={soundEnabled}
            setDiscrepancyModalOpen={setDiscrepancyModalOpen}
            handleCompletePacking={handleCompletePacking}
            finishKioskOrderSession={finishKioskOrderSession}
          />
        ) : (
          <OfficeDashboardView
            orders={filteredOfficeOrders}
            allOrders={orders}
            products={products}
            courierSchedules={COURIER_SCHEDULES}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priorityOnly={priorityOnly}
            setPriorityOnly={setPriorityOnly}
            handleTransferStock={handleTransferStock}
            highContrast={highContrast}
            setActiveRole={setActiveRole}
            setActiveOrderId={setActiveOrderId}
          />
        )}

        <div className="mt-8 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Real-time Warehouse Event Log
            </h3>
            <span className="text-xs text-slate-500">{logs.length} events logged</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-28 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 ${
                  log.type === 'error'
                    ? 'text-red-400 font-semibold'
                    : log.type === 'success'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 select-none">[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {}
      {scanErrorModal && (
        <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-4 border-red-500 rounded-2xl max-w-lg w-full p-6 text-center shadow-2xl space-y-6">
            <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-500 animate-bounce">
              <AlertTriangle className="w-16 h-16" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-red-500 tracking-tight uppercase">BARCODE MISMATCH!</h2>
              <p className="text-slate-300 font-medium text-lg mt-1">Wrong product or variant scanned.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-sm">Scanned Code:</span>
                <span className="font-mono font-bold text-red-400">{scanErrorModal.scanned}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-sm">Expected Item:</span>
                <span className="font-bold text-white text-sm">{scanErrorModal.expectedName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-sm">Required Variant:</span>
                <span className="font-extrabold text-amber-400 text-sm">{scanErrorModal.expectedVariant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Expected SKU:</span>
                <span className="font-mono font-bold text-emerald-400">{scanErrorModal.expectedSku}</span>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('click', soundEnabled);
                setScanErrorModal(null);
                if (scanInputRef.current) scanInputRef.current.focus();
              }}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xl shadow-lg transition active:scale-95"
            >
              DISMISS & TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {discrepancyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold text-white">Report Missing Inventory</h3>
                <p className="text-xs text-slate-400">Flags office team & pauses order picking</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Confirm that item is absent from shelf bin location. Office will be notified to reconcile or reassign stock.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleReportDiscrepancy('Shelf empty / Zero physical stock')}
                className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-left font-semibold text-sm border border-slate-700 flex items-center justify-between"
              >
                <span>1. Bin shelf is completely empty</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => handleReportDiscrepancy('Damaged or open box on shelf')}
                className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-left font-semibold text-sm border border-slate-700 flex items-center justify-between"
              >
                <span>2. Damaged/unusable product unit</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => handleReportDiscrepancy('Mislabeled barcode on physical box')}
                className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-left font-semibold text-sm border border-slate-700 flex items-center justify-between"
              >
                <span>3. Physical product barcode incorrect</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setDiscrepancyModalOpen(false)}
                className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {stagingModalOpen && printedLabelOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-white">ORDER PACKED SUCCESSFULLY!</h2>
              <p className="text-slate-400 text-sm">Shipping label generated and sent to thermal printer</p>
            </div>

            <div className="bg-white text-black p-4 rounded-xl shadow-inner font-mono text-xs space-y-3 border-2 border-black">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <span className="font-extrabold text-lg tracking-tighter">{printedLabelOrder.courier}</span>
                <span className="bg-black text-white px-2 py-0.5 text-xs font-bold">PRIORITY PARCEL</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-sans font-bold">SHIP FROM:</p>
                  <p className="font-bold">XYZ Fulfillment Center</p>
                  <p>Main Warehouse Gate 4</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-sans font-bold">SHIP TO:</p>
                  <p className="font-bold">{printedLabelOrder.customer}</p>
                  <p>104 West Broadway Ave</p>
                </div>
              </div>

              <div className="border-t-2 border-b-2 border-black py-2 text-center bg-slate-100 rounded">
                <p className="text-[10px] text-slate-600 font-sans uppercase font-bold">ASSIGNED STAGING BIN</p>
                <p className="text-3xl font-black text-indigo-900 tracking-wider my-1">{printedLabelOrder.stagingZone}</p>
                <p className="text-[10px] text-slate-500">Place box in designated courier staging shelf</p>
              </div>

              <div className="pt-1 flex justify-center">
                <div className="h-10 bg-slate-900 w-3/4 rounded flex items-center justify-center text-white text-[10px] tracking-widest font-bold">
                  ||||| ||||||| |||| |||||| |||||||
                </div>
              </div>
            </div>

            <button
              onClick={finishKioskOrderSession}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-lg shadow-lg transition active:scale-95"
            >
              COMPLETE & RETURN TO QUEUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WarehouseKioskView({
  orders,
  activeOrder,
  setActiveOrderId,
  priorityQueue,
  currentPickItemIndex,
  setCurrentPickItemIndex,
  products,
  scannedInput,
  setScannedInput,
  handlePhysicalScanSubmit,
  verifyBarcode,
  scanInputRef,
  highContrast,
  soundEnabled,
  setDiscrepancyModalOpen,
  handleCompletePacking
}) {
  if (!activeOrder) {
    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-2xl border ${highContrast ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'} shadow-md flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-emerald-400" />
            <div>
              <h2 className="text-2xl font-black tracking-tight">WAREHOUSE PICKING KIOSK</h2>
              <p className="text-sm opacity-80">Select an order from the prioritized queue below to start guided picking.</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs uppercase font-bold text-slate-400">Queue Length</span>
            <p className="text-2xl font-black">{priorityQueue.length} Orders Pending</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priorityQueue.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-950 border border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white">All Orders Processed!</h3>
              <p className="text-slate-400 text-sm">No pending picking tasks in queue right now.</p>
            </div>
          ) : (
            priorityQueue.map((order) => {
              const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
              const isUrgent = order.isPriority;

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setActiveOrderId(order.id);
                    setCurrentPickItemIndex(0);
                  }}
                  className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.02] shadow-xl ${
                    isUrgent
                      ? highContrast
                        ? 'bg-yellow-400 border-black text-black'
                        : 'bg-slate-900 border-red-500/80 hover:border-red-400'
                      : 'bg-slate-900 border-slate-800 hover:border-indigo-500'
                  }`}
                >
                  {isUrgent && (
                    <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      SAME-DAY PRIORITY ({order.cutoffMinutes}m LEFT)
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3 pt-1">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">{order.channel}</span>
                      <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-400 transition">
                        {order.id}
                      </h3>
                      <p className="text-sm font-semibold text-slate-300">{order.customer}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                      {order.courier}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4 space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">{itemCount} TOTAL ITEMS TO PICK</p>
                    {order.items.map((it, idx) => {
                      const prod = products.find((p) => p.sku === it.sku);
                      return (
                        <div key={idx} className="flex justify-between text-xs text-slate-300">
                          <span className="truncate max-w-[200px]">{prod ? prod.name : it.sku}</span>
                          <span className="font-mono font-bold text-amber-400">x{it.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  <button className="w-full py-3.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg transition">
                    START PICKING ORDER
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const currentItem = activeOrder.items[currentPickItemIndex];
  const currentProduct = products.find((p) => p.sku === currentItem?.sku);
  const isPackingStage = activeOrder.status === 'PACKING';
  const totalItemsCount = activeOrder.items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPickedCount = activeOrder.items.reduce((acc, i) => acc + i.picked, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            playSound('click', soundEnabled);
            setActiveOrderId(null);
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 border border-slate-700"
        >
          ← Pause & Back to Queue
        </button>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold">Active Order</span>
            <h2 className="text-2xl font-black text-white">{activeOrder.id}</h2>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold">Progress</span>
            <p className="text-xl font-bold text-emerald-400">
              {totalPickedCount} / {totalItemsCount} Units Picked
            </p>
          </div>
        </div>

        {activeOrder.isPriority && (
          <span className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-black tracking-wide flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            PRIORITY ORDER ({activeOrder.cutoffMinutes}m REMAINING)
          </span>
        )}
      </div>

      {!isPackingStage && currentProduct ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black p-4 rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-black tracking-widest text-black/80">Target Bin Location</span>
                <h3 className="text-5xl font-black tracking-tight">{currentProduct.bin}</h3>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold text-black/70">Warehouse Zone</span>
                <p className={`text-lg font-black px-3 py-1 rounded-lg ${currentProduct.locationZone === 'MAIN' ? 'bg-black text-amber-400' : 'bg-red-950 text-red-200'}`}>
                  {currentProduct.locationZone === 'MAIN' ? 'MAIN SHELF' : 'SECONDARY WAREHOUSE'}
                </p>
              </div>
            </div>

            {currentProduct.locationZone === 'SECONDARY' && (
              <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-sm flex items-center gap-3">
                <Building2 className="w-6 h-6 text-red-400 shrink-0" />
                <p>
                  <strong>Stock Location Notice:</strong> Item is located in Secondary Annex. Stock transfer required if shelf is empty.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <img
                src={currentProduct.image}
                alt={currentProduct.name}
                className="w-40 h-40 object-cover rounded-xl border-2 border-slate-700 shadow-md"
              />

              <div className="space-y-3 text-center sm:text-left flex-1">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold">Item {currentPickItemIndex + 1} of {activeOrder.items.length}</span>
                  <h3 className="text-2xl font-black text-white">{currentProduct.name}</h3>
                </div>

                <div className="inline-block bg-indigo-950 border border-indigo-500/50 rounded-xl px-4 py-2">
                  <span className="text-xs text-indigo-300 font-bold uppercase block">Required Variant</span>
                  <span className="text-xl font-extrabold text-amber-300">{currentProduct.variant}</span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                  <div>SKU: <span className="font-mono text-slate-200 font-bold">{currentProduct.sku}</span></div>
                  <div>Expected Barcode: <span className="font-mono text-emerald-400 font-bold">{currentProduct.barcode}</span></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl text-center min-w-[120px]">
                <span className="text-xs uppercase font-bold text-slate-400">PICK QTY</span>
                <p className="text-4xl font-black text-emerald-400">{currentItem.picked} / {currentItem.quantity}</p>
              </div>
            </div>

            <form onSubmit={handlePhysicalScanSubmit} className="space-y-3">
              <label className="block text-sm font-bold text-slate-300">
                Scan Item Barcode (Use USB Scanner or Virtual Scanner Pad):
              </label>
              <div className="flex gap-2">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value)}
                  placeholder="Scan barcode string here..."
                  className="flex-1 bg-slate-950 border-2 border-indigo-500 rounded-xl px-4 py-3 font-mono text-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-lg"
                >
                  VERIFY
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <p className="text-xs text-slate-400">Can't locate item on shelf or barcode damaged?</p>
              <button
                onClick={() => setDiscrepancyModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/50 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Report Missing / Gap
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Virtual Barcode Simulator</h3>
              </div>

              <p className="text-xs text-slate-400">
                Click buttons below to simulate physical laser barcode scans for quick testing:
              </p>

              <button
                onClick={() => verifyBarcode(currentProduct.barcode)}
                className="w-full p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500 text-emerald-300 text-left font-bold transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs uppercase text-emerald-400 font-extrabold block">Simulate Correct Scan</span>
                  <span className="text-sm font-mono">{currentProduct.barcode}</span>
                </div>
                <Check className="w-6 h-6 text-emerald-400" />
              </button>

              <button
                onClick={() => verifyBarcode('999900001111')}
                className="w-full p-4 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border-2 border-red-500 text-red-300 text-left font-bold transition flex items-center justify-between"
              >
                <div>
                  <span className="text-xs uppercase text-red-400 font-extrabold block">Simulate Wrong Scan</span>
                  <span className="text-sm font-mono">999900001111 (Wrong Item)</span>
                </div>
                <X className="w-6 h-6 text-red-400" />
              </button>

              <div className="pt-2 space-y-2">
                <h4 className="text-xs uppercase font-bold text-slate-400">Order Pick List Status</h4>
                {activeOrder.items.map((it, idx) => {
                  const p = products.find((prod) => prod.sku === it.sku);
                  const isCurrent = idx === currentPickItemIndex;
                  const isDone = it.picked >= it.quantity;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                        isCurrent
                          ? 'bg-indigo-950/80 border-indigo-500 font-bold text-white'
                          : isDone
                          ? 'bg-slate-900 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <p>{p?.name}</p>
                        <span className="text-[10px] text-slate-400">{p?.variant}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">{it.picked}/{it.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400">
            <Package className="w-16 h-16" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-white">ALL ITEMS PICKED!</h2>
            <p className="text-slate-300 text-lg mt-1">Ready for final packing and staging box assignment.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
            <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">Packing Summary Verification</h3>
            {activeOrder.items.map((it, idx) => {
              const p = products.find((prod) => prod.sku === it.sku);
              return (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-800 last:border-0">
                  <span className="text-slate-200 font-medium">{p?.name} ({p?.variant})</span>
                  <span className="font-mono font-bold text-emerald-400">x{it.quantity} Verified</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCompletePacking}
            className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-3"
          >
            <Printer className="w-6 h-6" />
            PRINT LABEL & ASSIGN STAGING
          </button>
        </div>
      )}
    </div>
  );
}

function OfficeDashboardView({
  orders,
  allOrders,
  products,
  courierSchedules,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  priorityOnly,
  setPriorityOnly,
  handleTransferStock,
  highContrast,
  setActiveRole,
  setActiveOrderId
}) {
  const totalOrders = allOrders.length;
  const issueOrders = allOrders.filter((o) => o.status === 'ISSUE');
  const stagedOrders = allOrders.filter((o) => o.status === 'STAGED');
  const shippedOrders = allOrders.filter((o) => o.status === 'SHIPPED');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase text-slate-400">Total Today's Orders</span>
          <p className="text-3xl font-black text-white mt-1">{totalOrders}</p>
          <span className="text-xs text-emerald-400 mt-1 inline-block">↑ 12% vs yesterday</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase text-slate-400">Staged Boxes</span>
          <p className="text-3xl font-black text-indigo-400 mt-1">{stagedOrders.length}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Awaiting courier pickup</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase text-slate-400">Completed & Shipped</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{shippedOrders.length}</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Handed to drivers</span>
        </div>

        <div className={`p-4 rounded-2xl border ${issueOrders.length > 0 ? 'bg-amber-950/40 border-amber-500/80' : 'bg-slate-900 border-slate-800'}`}>
          <span className="text-xs font-bold uppercase text-amber-400">Inventory Issues / Gaps</span>
          <p className="text-3xl font-black text-amber-300 mt-1">{issueOrders.length}</p>
          <span className="text-xs text-amber-400/80 mt-1 inline-block">Requires office review</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-lg">Today's Courier Pickup Schedule</h3>
          </div>
          <span className="text-xs text-slate-400">Live Status</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courierSchedules.map((courier) => (
            <div key={courier.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-white">{courier.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {courier.driverStatus}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Next Arrival:</span>
                  <span className="font-bold text-amber-400">{courier.nextPickup}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Boxes Staged in Bay:</span>
                  <span className="font-bold text-white">{courier.stagedBoxes} boxes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {issueOrders.length > 0 && (
        <div className="bg-amber-950/30 border-2 border-amber-500 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-lg font-black text-white">Stock Discrepancies Flagged by Warehouse Floor</h3>
          </div>

          <div className="space-y-3">
            {issueOrders.map((ord) => (
              <div key={ord.id} className="bg-slate-900 border border-amber-500/50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{ord.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold">{ord.customer}</span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium mt-1">{ord.issueReason}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ord.items.map((it) => {
                    const prod = products.find((p) => p.sku === it.sku);
                    return (
                      <div key={it.sku} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Secondary Stock: <strong>{prod?.stockSecondary || 0} units</strong></span>
                        <button
                          onClick={() => handleTransferStock(it.sku)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow transition"
                        >
                          Transfer 10 Units to Main Shelf
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-lg">Master Order Pipeline Board</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search order ID, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="PICKING">Picking</option>
              <option value="PACKING">Packing</option>
              <option value="STAGED">Staged</option>
              <option value="SHIPPED">Shipped</option>
              <option value="ISSUE">Issue Flagged</option>
            </select>

            <button
              onClick={() => setPriorityOnly(!priorityOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                priorityOnly ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Priority Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Order Ref</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Priority / SLA</th>
                <th className="p-3">Status</th>
                <th className="p-3">Courier</th>
                <th className="p-3">Staging Bin</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-500">
                    No orders match current search and status filters.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-bold text-white">{ord.id}</td>
                    <td className="p-3 text-slate-200 font-medium">{ord.customer}</td>
                    <td className="p-3 text-slate-400">{ord.channel}</td>
                    <td className="p-3">
                      {ord.isPriority ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-extrabold text-[10px]">
                          SAME-DAY ({ord.cutoffMinutes}m)
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard Ground</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'SHIPPED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : ord.status === 'STAGED'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : ord.status === 'ISSUE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{ord.courier}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{ord.stagingZone || '—'}</td>
                    <td className="p-3 text-right">
                      {ord.status !== 'SHIPPED' && (
                        <button
                          onClick={() => {
                            setActiveOrderId(ord.id);
                            setActiveRole('kiosk');
                          }}
                          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                        >
                          Launch in Kiosk
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}