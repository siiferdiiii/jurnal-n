const DB_NAME = 'JurnalNDB';
const DB_VERSION = 1;

// Initialize database
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store untuk Metode
      if (!db.objectStoreNames.contains('metode')) {
        db.createObjectStore('metode', { keyPath: 'id' });
      }
      
      // Store untuk Jurnal
      if (!db.objectStoreNames.contains('jurnal')) {
        db.createObjectStore('jurnal', { keyPath: 'id' });
      }
    };
  });
}

// Helper generic: Ambil semua data
export function getAll(storeName) {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(transaction.objectStoreNames[0] || storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  });
}

// Helper generic: Simpan/Update data
export function put(storeName, item) {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = (e) => reject(e.target.error);
    });
  });
}

// Helper generic: Hapus data
export function remove(storeName, id) {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = (e) => reject(e.target.error);
    });
  });
}

// Canvas-based chart generator for realistic mock seed charts
export function generateMockChartDataURL(title, type = 'premarket') {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    
    // Background obsidian
    ctx.fillStyle = '#0d0e15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 50; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 50; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw some candlesticks
    let currentPrice = 180 + Math.random() * 80;
    let trendDirection = type === 'premarket' ? 1.5 : 2.5;
    
    for (let i = 0; i < 24; i++) {
      const x = 60 + i * 28;
      const open = currentPrice;
      // create a wave pattern
      const wave = Math.sin(i / 3) * 30;
      const noise = (Math.random() - 0.48) * 20;
      const close = open + (wave * 0.3) + noise;
      
      const high = Math.max(open, close) + Math.random() * 8;
      const low = Math.min(open, close) - Math.random() * 8;
      
      const isBullish = close > open;
      ctx.strokeStyle = isBullish ? '#10b981' : '#f43f5e';
      ctx.fillStyle = isBullish ? '#10b981' : '#f43f5e';
      
      // Wick
      ctx.beginPath();
      ctx.moveTo(x, high);
      ctx.lineTo(x, low);
      ctx.stroke();
      
      // Candle body
      ctx.fillRect(x - 6, Math.min(open, close), 12, Math.max(1, Math.abs(close - open)));
      currentPrice = close;
    }
    
    // Draw indicators or markings
    if (type === 'premarket') {
      // Key Level marker
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(50, currentPrice + 40);
      ctx.lineTo(750, currentPrice + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px monospace';
      ctx.fillText('FVG / KEY LEVEL RE-TEST ZONE', 70, currentPrice + 32);

      // Target projection arrow
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60 + 23 * 28, currentPrice);
      ctx.lineTo(740, currentPrice - 80);
      ctx.stroke();
      
      // Draw arrow tip
      ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.beginPath();
      ctx.moveTo(740, currentPrice - 80);
      ctx.lineTo(725, currentPrice - 75);
      ctx.lineTo(735, currentPrice - 65);
      ctx.closePath();
      ctx.fill();
    } else {
      // Result
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(60 + 23 * 28, currentPrice);
      // Actual trade path
      ctx.lineTo(710, currentPrice - 20);
      ctx.lineTo(760, currentPrice - 110);
      ctx.stroke();
      
      // Green highlight for profit
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(700, 50, 80, 350);
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(710, currentPrice - 130, 65, 24);
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(710, currentPrice - 130, 65, 24);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('TP HIT (+3R)', 716, currentPrice - 114);
    }
    
    // Metadata overlays
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(title, 25, 30);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText(type === 'premarket' ? 'PREMARKET ANALYSIS' : 'TRADE RESULT DOCUMENTATION', 25, 48);
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate mock chart', error);
    return '';
  }
}

// Seed initial data if DB is empty
export async function seedInitialData() {
  const existingMetode = await getAll('metode');
  
  if (existingMetode.length > 0) {
    return; // Sudah ada data
  }

  // Seed metode
  const methods = [
    {
      id: 'metode-1',
      nama: 'SMC Continuation (MSS + FVG)',
      sopChecklist: [
        'Tentukan bias di HTF (4H/Daily)',
        'Tunggu Market Structure Shift (MSS) di LTF (5m/15m)',
        'Tentukan FVG/OB terdekat sebagai entry zone',
        'Cek berita high impact (tidak open 15m sebelum/sesudah)',
        'Set Stop Loss di bawah swing low terakhir'
      ],
      keyLevels: ['FVG (Fair Value Gap)', 'Order Block (OB)', 'Breaker Block', 'Fibonacci OTE (0.62 - 0.79)'],
      triggers: ['iFVG (Inversion FVG)', 'MSS (Market Structure Shift)', 'CISD (Change in State of Delivery)', 'Choch'],
      entryRules: [
        'Entry HANYA di Sesi London (08:00–12:00 WIB) atau New York (15:00–20:00 WIB)',
        'Pastikan spread tidak melebihi 15 pip sebelum entry',
        'Minimal 1 konfirmasi MSS di LTF sebelum eksekusi'
      ],
      noEntryRules: [
        'Jangan entry 15 menit sebelum/sesudah berita red folder',
        'Jangan entry jika harga sudah berjalan lebih dari 50% dari setup awal',
        'Jangan entry di sesi Asia (00:00–07:00 WIB) untuk pair non-JPY',
        'Jangan entry lebih dari 2 trade dalam 1 hari'
      ],
      slPlusRules: [
        'Geser SL ke Break Even (BE) ketika harga mencapai +1R profit',
        'Pasang SL+ (trailing) ketika harga mencapai TP parsial pertama',
        'Jika sudah +2R, lock profit minimum +1R dengan SL trailing'
      ],
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    },
    {
      id: 'metode-2',
      nama: 'Fibonacci Reversal & Liquidity Sweep',
      sopChecklist: [
        'Liquidty Sweep dari EQ High/Low terkonfirmasi',
        'Retracement masuk ke area Golden Ratio (0.618 - 0.786)',
        'Tunggu reaksi penolakan candlestick (pinbar/engulfing)',
        'Risk per trade maks 1%'
      ],
      keyLevels: ['Fibonacci 0.618', 'Fibonacci 0.786', 'EQ High/Low', 'Daily High/Low'],
      triggers: ['Candlestick Rejection', 'MSS', 'CISD'],
      entryRules: [
        'Entry di sesi London Open (08:00–10:00 WIB) untuk volatilitas optimal',
        'Konfirmasi liquidity sweep selesai sebelum entry (close lilin di atas/bawah EQ)'
      ],
      noEntryRules: [
        'Jangan entry jika candle retracement belum tutup di dalam zona Fibonacci',
        'Jangan entry saat ada divergence yang berlawanan di RSI HTF',
        'Jangan entry jika sudah kena SL dalam 1 hari yang sama (1 trade/hari)'
      ],
      slPlusRules: [
        'Geser SL ke BE setelah harga bergerak 1.5R dari entry',
        'Ambil TP parsial 50% di target R:1.5, sisanya trailing ke R:3'
      ],
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000
    }
  ];


  for (const m of methods) {
    await put('metode', m);
  }

  // Helper untuk membuat tanggal dengan format YYYY-MM-DD
  const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // Seed journals
  const journals = [
    {
      id: 'trade-1',
      tanggal: getPastDateStr(8),
      pair: 'EURUSD',
      arah: 'BUY',
      jenisTrade: 'continuation',
      metodeId: 'metode-1',
      checklistTerpenuhi: [
        'Tentukan bias di HTF (4H/Daily)',
        'Tunggu Market Structure Shift (MSS) di LTF (5m/15m)',
        'Tentukan FVG/OB terdekat sebagai entry zone'
      ],
      keyLevelDigunakan: 'FVG (Fair Value Gap)',
      triggerEntry: 'MSS (Market Structure Shift)',
      riskRewardRatio: 3,
      hasilTrade: 'win',
      profitNominal: 350,
      rrDiperoleh: 3,
      psikologiSebelum: 'Tenang',
      psikologiSaatOpen: 'Tenang',
      psikologiSetelah: 'Puas',
      faktorKesalahan: [],
      fotoPremarket: generateMockChartDataURL('EURUSD BUY Setup (Continuation)', 'premarket'),
      fotoResult: generateMockChartDataURL('EURUSD BUY Profit Result', 'result'),
      catatanHariIni: 'Trade berjalan sangat mulus sesuai rencana. FVG terisi penuh lalu harga langsung memantul ke arah TP.'
    },
    {
      id: 'trade-2',
      tanggal: getPastDateStr(6),
      pair: 'GBPUSD',
      arah: 'BUY',
      jenisTrade: 'reversal',
      metodeId: 'metode-2',
      checklistTerpenuhi: [
        'Liquidty Sweep dari EQ High/Low terkonfirmasi',
        'Retracement masuk ke area Golden Ratio (0.618 - 0.786)',
        'Tunggu reaksi penolakan candlestick (pinbar/engulfing)'
      ],
      keyLevelDigunakan: 'Fibonacci 0.618',
      triggerEntry: 'Candlestick Rejection',
      riskRewardRatio: 2.5,
      hasilTrade: 'lose',
      profitNominal: -120,
      rrDiperoleh: -1,
      psikologiSebelum: 'FOMO',
      psikologiSaatOpen: 'Takut',
      psikologiSetelah: 'Kecewa',
      faktorKesalahan: ['fomo', 'takut'],
      fotoPremarket: generateMockChartDataURL('GBPUSD BUY Setup (Reversal)', 'premarket'),
      fotoResult: generateMockChartDataURL('GBPUSD BUY Stop Out', 'result'),
      catatanHariIni: 'Entry dipaksakan terlalu dini sebelum lilin benar-benar terkonfirmasi ditutup di atas fibo. Harga meluncur turun menembus SL sebelum akhirnya berbalik naik. FOMO merusak entry ini.'
    },
    {
      id: 'trade-3',
      tanggal: getPastDateStr(5),
      pair: 'BTCUSD',
      arah: 'SELL',
      jenisTrade: 'continuation',
      metodeId: 'metode-1',
      checklistTerpenuhi: [
        'Tentukan bias di HTF (4H/Daily)',
        'Tunggu Market Structure Shift (MSS) di LTF (5m/15m)',
        'Tentukan FVG/OB terdekat sebagai entry zone',
        'Set Stop Loss di bawah swing low terakhir'
      ],
      keyLevelDigunakan: 'Order Block (OB)',
      triggerEntry: 'iFVG (Inversion FVG)',
      riskRewardRatio: 4,
      hasilTrade: 'partial_tp',
      profitNominal: 200,
      rrDiperoleh: 2,
      psikologiSebelum: 'Tenang',
      psikologiSaatOpen: 'Serakah',
      psikologiSetelah: 'Netral',
      faktorKesalahan: ['serakah'],
      fotoPremarket: generateMockChartDataURL('BTCUSD SELL Setup (SMC)', 'premarket'),
      fotoResult: generateMockChartDataURL('BTCUSD SELL Partial Exit', 'result'),
      catatanHariIni: 'Mengambil TP parsial sebesar 50% posisi pada target R:2 karena ada benturan resistance kuat di area support bawah. Sisanya terkena BE. Keputusan parsial yang baik.'
    },
    {
      id: 'trade-4',
      tanggal: getPastDateStr(4),
      pair: 'EURUSD',
      arah: 'SELL',
      jenisTrade: 'ranging',
      metodeId: 'metode-2',
      checklistTerpenuhi: [
        'Liquidty Sweep dari EQ High/Low terkonfirmasi',
        'Tunggu reaksi penolakan candlestick (pinbar/engulfing)'
      ],
      keyLevelDigunakan: 'EQ High/Low',
      triggerEntry: 'MSS',
      riskRewardRatio: 2,
      hasilTrade: 'break_even',
      profitNominal: 0,
      rrDiperoleh: 0,
      psikologiSebelum: 'Tenang',
      psikologiSaatOpen: 'Tenang',
      psikologiSetelah: 'Netral',
      faktorKesalahan: [],
      fotoPremarket: generateMockChartDataURL('EURUSD SELL Range Bound', 'premarket'),
      fotoResult: generateMockChartDataURL('EURUSD SELL BE Exit', 'result'),
      catatanHariIni: 'Harga bergerak lambat di sesi Asia. Setelah berjalan 1R+, saya geser SL ke BE. Harga berbalik arah mengambil BE saya sebelum akhirnya sideway terus.'
    },
    {
      id: 'trade-5',
      tanggal: getPastDateStr(1),
      pair: 'GBPUSD',
      arah: 'SELL',
      jenisTrade: 'continuation',
      metodeId: 'metode-1',
      checklistTerpenuhi: [
        'Tentukan bias di HTF (4H/Daily)',
        'Tunggu Market Structure Shift (MSS) di LTF (5m/15m)'
      ],
      keyLevelDigunakan: 'FVG (Fair Value Gap)',
      triggerEntry: 'iFVG (Inversion FVG)',
      riskRewardRatio: 3.5,
      hasilTrade: 'sl+',
      profitNominal: 80,
      rrDiperoleh: 0.8,
      psikologiSebelum: 'Tenang',
      psikologiSaatOpen: 'Geser SL',
      psikologiSetelah: 'Puas',
      faktorKesalahan: ['geser_sl'],
      fotoPremarket: generateMockChartDataURL('GBPUSD SELL Entry', 'premarket'),
      fotoResult: generateMockChartDataURL('GBPUSD SELL Stop Profit', 'result'),
      catatanHariIni: 'Mengamankan profit dengan mengunci SL di area profit (SL+). Sayang sekali kena spike berita CPI lalu turun tajam lagi tanpa saya. Bagaimanapun, profit tetaplah profit.'
    }
  ];

  for (const j of journals) {
    await put('jurnal', j);
  }
}
