import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface Card {
  id: string;
  cardNumber: string;
  cardType: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  accountId: string;
  account?: { accountNumber: string; accountName: string; balance: number; currency: string };
  createdAt: string;
  updatedAt: string;
}

const maskCardNumber = (num: string) => num.replace(/(\d{4})\d{8,12}(\d{4})/, '$1 **** **** $2');

const CardsPage: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('http://192.168.31.39:3001/api/banking/cards', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok) {
          setCards(data.data.cards);
        } else {
          setError(data.message || 'Failed to fetch cards');
        }
      } catch (err) {
        setError('Failed to fetch cards');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
        <Button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-colors"
          // onClick={...} // Sẽ thêm modal tạo thẻ ở bước sau
          disabled
        >
          + Tạo thẻ mới (sắp ra mắt)
        </Button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          Đang tải danh sách thẻ...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-red-500">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414-1.414M5.636 5.636l1.414 1.414M17.657 17.657l1.414-1.414M12 8v4m0 4h.01" /></svg>
          {error}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
          Bạn chưa có thẻ nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <Card key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Card Detail Modal */}
      {detailOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={() => setDetailOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Chi tiết thẻ</h3>
            <div className="mb-4 space-y-2">
              <div className="text-lg font-mono tracking-widest">{selectedCard.cardNumber}</div>
              <div className="text-sm text-gray-500">Exp: {selectedCard.expiryMonth.toString().padStart(2, '0')}/{selectedCard.expiryYear}</div>
              <div className="text-sm text-gray-700">{selectedCard.cardholderName || 'Cardholder'}</div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-2 h-2 rounded-full ${selectedCard.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-xs text-gray-600">{selectedCard.isActive ? 'Active' : 'Inactive'}</span>
                {selectedCard.isBlocked && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Blocked</span>}
              </div>
              {selectedCard.blockReason && (
                <div className="text-xs text-red-500">Block Reason: {selectedCard.blockReason}</div>
              )}
              {selectedCard.account && (
                <div className="text-xs text-gray-500">Linked Account: {selectedCard.account.accountNumber} ({selectedCard.account.accountName})</div>
              )}
              <div className="text-xs text-gray-500">Created: {new Date(selectedCard.createdAt).toLocaleString()}</div>
              <div className="text-xs text-gray-500">Updated: {new Date(selectedCard.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold" onClick={() => setDetailOpen(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsPage; 