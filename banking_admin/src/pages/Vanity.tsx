import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const currency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const viTier = (tier?: string) => {
  switch ((tier || '').toUpperCase()) {
    case 'VIP':
      return 'VIP';
    case 'PREMIUM':
      return 'CAO CẤP';
    case 'STANDARD':
      return 'TIÊU CHUẨN';
    case 'FREE':
      return 'MIỄN PHÍ';
    default:
      return tier || '';
  }
};

const viStatus = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'AVAILABLE':
      return 'ĐANG BÁN';
    case 'HELD':
      return 'ĐANG GIỮ';
    case 'SOLD':
      return 'ĐÃ BÁN';
    default:
      return status || '';
  }
};

const VanityPage: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, { price: number; tier: string; score: number }>>({});
  const [selectNumber, setSelectNumber] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Inventory state (Admin marketplace)
  const [tab, setTab] = useState<'market' | 'suggest'>('market');
  const [market, setMarket] = useState<{ items: any[]; total: number; page: number; limit: number }>({ items: [], total: 0, page: 1, limit: 20 });
  const [marketLoading, setMarketLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('AVAILABLE');
  const [tierFilter, setTierFilter] = useState('');
  const [newNumbers, setNewNumbers] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [tier, setTier] = useState<string>('STANDARD');

  const canPurchase = useMemo(() => Boolean(selectNumber && accountId), [selectNumber, accountId]);

  const fetchSuggest = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const list = await api.getVanitySuggestions({ pattern: pattern || undefined, limit });
      setNumbers(list);
      // prefetch prices
      const entries = await Promise.all(
        list.slice(0, 20).map(async (num) => {
          try {
            const p = await api.getVanityPrice(num);
            return [num, { price: p.price, tier: p.tier, score: p.score }] as const;
          } catch {
            return [num, { price: 0, tier: 'FREE', score: 0 }] as const;
          }
        })
      );
      setPrices(Object.fromEntries(entries));
    } catch (e: any) {
      setMessage(e?.message || 'Không thể lấy gợi ý');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarket = async (page = 1) => {
    setMarketLoading(true);
    setMessage(null);
    try {
      const res = await api.listVanityNumbers({ status: statusFilter || undefined, tier: tierFilter || undefined, page, limit: 20 });
      setMarket(res);
    } catch (e: any) {
      setMessage(e?.message || 'Không thể tải kho số');
    } finally {
      setMarketLoading(false);
    }
  };

  const handleAddNumbers = async () => {
    const lines = newNumbers.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return;
    try {
      await api.addVanityNumbers(lines.map((n) => ({ number: n, tier, basePrice })));
      setNewNumbers('');
      setBasePrice(0);
      setTier('STANDARD');
      fetchMarket(market.page);
    } catch (e: any) {
      setMessage(e?.message || 'Không thể thêm số');
    }
  };

  const handleGetPrice = async (num: string) => {
    try {
      const p = await api.getVanityPrice(num);
      setPrices((prev) => ({ ...prev, [num]: { price: p.price, tier: p.tier, score: p.score } }));
    } catch (e: any) {
      setMessage(e?.message || 'Không thể tính phí');
    }
  };

  const handlePurchase = async () => {
    if (!selectNumber || !accountId) return;
    setPurchaseLoading(true);
    setMessage(null);
    try {
      const res = await api.purchaseVanity(accountId, selectNumber);
      if (res.success) {
        setMessage(`Đổi số thành công: ${selectNumber}`);
      } else {
        setMessage(res.message || 'Đổi số thất bại');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Đổi số thất bại');
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'market') fetchMarket(1);
    else fetchSuggest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="p-6 max-w-8xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Số tài khoản đẹp</h1>
          <p className="text-sm text-gray-500">Gợi ý, xem phí và thực hiện đổi số tài khoản</p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          <button onClick={() => setTab('market')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'market' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Kho số</button>
          <button onClick={() => setTab('suggest')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'suggest' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Gợi ý</button>
        </div>

        {tab === 'suggest' && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mẫu (Regex)</label>
            <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="VD: 888$"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
            <input type="number" min={1} max={50} value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div className="flex items-end">
            <button onClick={fetchSuggest} disabled={loading}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
              {loading ? 'Đang tải...' : 'Gợi ý'}
            </button>
          </div>
        </div>
        )}

        {tab === 'market' && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">Tất cả</option>
                <option value="AVAILABLE">Đang bán</option>
                <option value="HELD">Đang giữ</option>
                <option value="SOLD">Đã bán</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạng (tier)</label>
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                <option value="">Tất cả</option>
                <option value="STANDARD">TIÊU CHUẨN</option>
                <option value="PREMIUM">CAO CẤP</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => fetchMarket(1)} disabled={marketLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
                {marketLoading ? 'Đang tải...' : 'Tải kho số'}
              </button>
            </div>
            {/* Add numbers */}
            <div className="md:col-span-3 grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thêm số (1 số mỗi dòng)</label>
                <textarea value={newNumbers} onChange={(e) => setNewNumbers(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" placeholder={"VD:\n088888888888\n123456789012"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier & Giá</label>
                <div className="flex gap-2">
                  <select value={tier} onChange={(e) => setTier(e.target.value)} className="border rounded-lg px-3 py-2">
                    <option value="STANDARD">TIÊU CHUẨN</option>
                    <option value="PREMIUM">CAO CẤP</option>
                    <option value="VIP">VIP</option>
                  </select>
                  <input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))} className="border rounded-lg px-3 py-2 w-full" placeholder="Giá" />
                </div>
                <button onClick={handleAddNumbers} className="mt-2 w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Thêm vào kho</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account ID để đổi</label>
          <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Nhập Account ID"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">{message}</div>
        )}

        {tab === 'suggest' && (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
            {numbers.map((num) => {
              const p = prices[num];
              return (
                <div key={num} className={`border rounded-xl p-4 hover:shadow transition ${selectNumber === num ? 'ring-2 ring-purple-500' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{num}</div>
                      <div className="text-xs text-gray-500">{p ? `${viTier(p.tier)} • điểm: ${p.score}` : 'Chưa tính phí'}</div>
                    </div>
                    <button onClick={() => setSelectNumber(num)} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Chọn</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Phí: {p ? currency(p.price) : '—'}</div>
                    <button onClick={() => handleGetPrice(num)} className="text-purple-600 text-sm">Xem phí</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'market' && (
          <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
            {market.items.map((item) => (
              <div key={item.id} className="border rounded-xl p-4 hover:shadow transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-800">{item.number}</div>
                    <div className="text-xs text-gray-500">{viTier(item.tier)} • Trạng thái: {viStatus(item.status)}</div>
                  </div>
                  {item.status !== 'SOLD' && (
                    <button onClick={() => setSelectNumber(item.number)} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm">Chọn</button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Giá: {currency(item.basePrice || 0)}</div>
                  <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {item.status !== 'SOLD' && (
                    <button onClick={async () => { await api.updateVanityNumber(item.id, { status: item.status === 'AVAILABLE' ? 'HELD' : 'AVAILABLE' }); fetchMarket(market.page); }} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm">{item.status === 'AVAILABLE' ? 'Giữ chỗ' : 'Mở bán'}</button>
                  )}
                  {item.status !== 'SOLD' && (
                    <button onClick={async () => { await api.deleteVanityNumber(item.id); fetchMarket(market.page); }} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm">Xóa</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button disabled={!canPurchase || purchaseLoading} onClick={handlePurchase}
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
            {purchaseLoading ? 'Đang xử lý...' : 'Mua/Đổi số'}
          </button>
          {selectNumber && <span className="text-sm text-gray-600">Số đã chọn: <strong>{selectNumber}</strong></span>}
        </div>
      </div>
  );
};

export default VanityPage;


