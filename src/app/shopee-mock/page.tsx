'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Star,
  MessageCircle,
  ChevronDown,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  X,
  Send,
  Bot,
  ChevronLeft,
  Package,
  MapPin,
  Bell,
  Home,
  Tag 
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { createBrowserClient } from '@supabase/ssr'; // Added for live data
import { toast } from 'sonner'; // Added for feedback

/* ─── Types ─── */
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  sold: number;
  stock: number;
  sizes: string[];
  colors: string[];
  shopName: string;
  location: string;
  badge?: string;
  description: string;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'owner' | 'system';
  text: string;
  time: string;
}

/* ─── Mock Data ─── */
const products: Product[] = [
{
  id: 'p-001-L',
  name: 'Baju Kurung Moden Sulam Bunga – NabilahFashion',
  price: 89.9,
  originalPrice: 129.9,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1fa25d908-1766904818168.png",
  rating: 4.8,
  sold: 312,
  stock: 14,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Dusty Rose', 'Sage Green', 'Navy Blue'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  badge: 'Bestseller',
  description: 'Baju kurung moden dengan sulaman bunga halus. Kain premium, selesa dipakai seharian. Sesuai untuk majlis & harian.'
},
{
  id: 'p-002-L',
  name: 'Blouse Chiffon Raya Exclusive – NabilahFashion',
  price: 59.9,
  originalPrice: 79.9,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_18bab4eb7-1776700401543.png",
  rating: 4.6,
  sold: 187,
  stock: 6,
  sizes: ['S', 'M', 'L'],
  colors: ['Cream', 'Blush Pink', 'Mint'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  badge: 'Low Stock',
  description: 'Blouse chiffon ringan & elegan. Potongan A-line yang menyembunyikan perut. Boleh mix & match dengan pelbagai bawahan.'
},
{
  id: 'p-003-L',
  name: 'Dress Batik Viral Corak Pelangi',
  price: 75.0,
  originalPrice: 99.0,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_136de2dc4-1773433617181.png",
  rating: 4.9,
  sold: 521,
  stock: 22,
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  colors: ['Multicolor'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  badge: 'Top Rated',
  description: 'Dress batik corak pelangi yang viral di TikTok! Kain batik cotton premium, selesa & cantik. Free size friendly.'
},
{
  id: 'p-004-FS',
  name: 'Tudung Bawal Premium Sulam – 10 Warna',
  price: 35.9,
  originalPrice: 49.9,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_19d0d1210-1772330628015.png",
  rating: 4.7,
  sold: 893,
  stock: 45,
  sizes: ['Free Size'],
  colors: ['10 Colors Available'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  badge: 'Hot Deal',
  description: 'Tudung bawal premium dengan sulaman tepi yang cantik. Kain satin silk, tak panas & mudah dipakai. Tersedia 10 warna pilihan.'
},
{
  id: 'p-005-L',
  name: 'Palazzo Pants Linen Wide Leg',
  price: 45.9,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1abe5bd75-1772474934368.png",
  rating: 4.5,
  sold: 234,
  stock: 18,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Black', 'Camel', 'Olive'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  description: 'Palazzo pants linen yang selesa & stylish. Potongan wide leg yang trendy. Sesuai untuk kerja & casual.'
},
{
  id: 'p-006-L',
  name: 'Set Baju Melayu Moden Slim Fit',
  price: 119.9,
  originalPrice: 159.9,
  image: "https://img.rocket.new/generatedImages/rocket_gen_img_1a9088ea2-1776700401296.png",
  rating: 4.8,
  sold: 156,
  stock: 9,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['White', 'Light Blue', 'Charcoal'],
  shopName: 'NabilahFashion.my',
  location: 'Kuala Lumpur',
  badge: 'New Arrival',
  description: 'Set baju melayu moden potongan slim fit. Kain teluk belanga premium. Lengkap dengan sampin & butang.'
}];

// Mock logic kept for fallback/reference but bypassed by the API
const botReplies: Record<string, string> = {
  default: 'Terima kasih kerana menghubungi NabilahFashion! 😊 Boleh saya bantu anda?',
  stock: 'Stok masih ada untuk saiz yang anda pilih! Nak terus buat order? 🛍️',
  size: 'Untuk panduan saiz, S (32–34"), M (34–36"), L (36–38"), XL (38–40"). Kalau ragu, ambil saiz lebih besar ye~',
  shipping: 'Penghantaran ke Sabah/Sarawak RM9.90 via J&T, 5–7 hari kerja. Semenanjung RM6.90, 2–3 hari 📦',
  price: 'Harga yang tertera sudah termasuk SST. Tiada hidden charges! 💯',
  cod: 'Maaf, kami tak support COD buat masa ni. Payment via Shopee sahaja ye 🙏',
  return: 'Boleh return dalam 7 hari, item dalam kondisi asal. Hubungi kami dengan gambar item dulu ye 😊'
};

function detectIntent(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('stok') || lower.includes('stock') || lower.includes('ada tak')) return 'stock';
  if (lower.includes('saiz') || lower.includes('size') || lower.includes('ukur')) return 'size';
  if (lower.includes('pos') || lower.includes('ship') || lower.includes('sabah') || lower.includes('sarawak') || lower.includes('hantar')) return 'shipping';
  if (lower.includes('harga') || lower.includes('price') || lower.includes('rm') || lower.includes('berapa')) return 'price';
  if (lower.includes('cod') || lower.includes('cash')) return 'cod';
  if (lower.includes('return') || lower.includes('refund') || lower.includes('tukar')) return 'return';
  return 'default';
}

/* ─── Sub-components ─── */
// (ShopeeHeader, ProductCard, ProductDetail, CartToast are kept exactly the same)
function ShopeeHeader({ cartCount, onCartClick }: {cartCount: number;onCartClick: () => void;}) {
  return (
    <header className="bg-[#EE4D2D] text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-5xl mx-auto px-3 py-2">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
              <span className="text-[#EE4D2D] font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Shopee</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-medium">MY</span>
          </div>
          <div className="flex-1 flex items-center bg-white rounded overflow-hidden">
            <input
              className="flex-1 text-gray-700 text-sm px-3 py-1.5 outline-none placeholder:text-gray-400"
              placeholder="Cari produk di Shopee..."
              defaultValue="baju kurung moden" />
            
            <button className="bg-[#EE4D2D] px-3 py-1.5 border-l border-[#d94224]">
              <Search size={16} className="text-white" />
            </button>
          </div>
          <button onClick={onCartClick} className="relative p-1.5 hover:bg-white/10 rounded transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 &&
            <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-[#EE4D2D] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {cartCount}
              </span>
            }
          </button>
          <Bell size={18} className="opacity-80 cursor-pointer hover:opacity-100" />
        </div>
        {/* Nav tabs */}
        <div className="flex gap-4 text-xs overflow-x-auto scrollbar-none">
          {['Flash Sale', 'Voucher', 'Coins', 'Live', 'Brands', 'Food', 'Beauty'].map((tab) =>
          <button key={tab} className="whitespace-nowrap opacity-80 hover:opacity-100 pb-0.5 border-b border-transparent hover:border-white transition-all">
              {tab}
            </button>
          )}
        </div>
      </div>
    </header>);

}

function ProductCard({ product, onClick }: {product: Product;onClick: () => void;}) {
  const discount = product.originalPrice ?
  Math.round((product.originalPrice - product.price) / product.originalPrice * 100) :
  null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group border border-gray-100">
      
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={product.image}
          alt={`${product.name} – ${product.shopName}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        
        {discount &&
        <span className="absolute top-2 left-2 bg-[#EE4D2D] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        }
        {product.badge &&
        <span className={`absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded ${
        product.badge === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
        product.badge === 'Bestseller' ? 'bg-yellow-100 text-yellow-700' :
        product.badge === 'Top Rated' ? 'bg-green-100 text-green-700' :
        product.badge === 'New Arrival' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`
        }>
            {product.badge}
          </span>
        }
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors">
          
          <Heart size={14} className="text-gray-400 hover:text-red-500 transition-colors" />
        </button>
      </div>
      <div className="p-2.5">
        <p className="text-xs text-gray-700 line-clamp-2 leading-tight mb-1.5">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[#EE4D2D] font-bold text-sm">RM{product.price.toFixed(2)}</span>
          {product.originalPrice &&
          <span className="text-gray-400 text-xs line-through">RM{product.originalPrice.toFixed(2)}</span>
          }
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-0.5">
            <Star size={10} className="fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
          </div>
          <span>{product.sold} terjual</span>
        </div>
      </div>
    </div>);

}

function ProductDetail({
  product,
  onBack,
  onContactSeller,
  onAddToCart





}: {product: Product;onBack: () => void;onContactSeller: () => void;onAddToCart: () => void;}) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);

  const discount = product.originalPrice ?
  Math.round((product.originalPrice - product.price) / product.originalPrice * 100) :
  null;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-sm font-medium text-gray-700">Detail Produk</span>
        <div className="ml-auto flex items-center gap-2 text-gray-500">
          <Heart size={18} />
          <ShoppingCart size={18} />
        </div>
      </div>

      {/* Product image */}
      <div className="bg-white aspect-square max-h-72 overflow-hidden">
        <img src={product.image} alt={`${product.name} – ${product.shopName}`} className="w-full h-full object-cover" />
      </div>

      {/* Price & title */}
      <div className="bg-white px-4 py-3 mb-2">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[#EE4D2D] font-bold text-xl">RM{product.price.toFixed(2)}</span>
          {product.originalPrice &&
          <span className="text-gray-400 text-sm line-through">RM{product.originalPrice.toFixed(2)}</span>
          }
          {discount &&
          <span className="bg-[#EE4D2D] text-white text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
          }
        </div>
        <h2 className="text-sm text-gray-800 font-medium leading-snug mb-2">{product.name}</h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-0.5">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-700">{product.rating}</span>
          </div>
          <span>|</span>
          <span>{product.sold} Terjual</span>
          <span>|</span>
          <span className={product.stock < 10 ? 'text-orange-600 font-medium' : ''}>{product.stock} stok</span>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white px-4 py-3 mb-2">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Truck size={14} className="text-[#EE4D2D] mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-gray-800">Penghantaran</span>
            <p className="text-gray-500 mt-0.5">Semenanjung RM6.90 · Sabah/Sarawak RM9.90</p>
            <p className="text-gray-500">Dijangka tiba dalam 2–7 hari bekerja</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <MapPin size={12} className="text-gray-400" />
          <span>Dihantar dari {product.location}</span>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white px-4 py-3 mb-2">
        {/* Sizes */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Saiz</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) =>
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
              selectedSize === s ?
              'border-[#EE4D2D] bg-red-50 text-[#EE4D2D]' :
              'border-gray-200 text-gray-600 hover:border-gray-400'}`
              }>
              
                {s}
              </button>
            )}
          </div>
        </div>
        {/* Colors */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Warna</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) =>
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
              selectedColor === c ?
              'border-[#EE4D2D] bg-red-50 text-[#EE4D2D]' :
              'border-gray-200 text-gray-600 hover:border-gray-400'}`
              }>
              
                {c}
              </button>
            )}
          </div>
        </div>
        {/* Qty */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Kuantiti</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              
              –
            </button>
            <span className="text-sm font-medium w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              
              +
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white px-4 py-3 mb-2">
        <p className="text-xs font-semibold text-gray-700 mb-1.5">Penerangan Produk</p>
        <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
      </div>

      {/* Guarantees */}
      <div className="bg-white px-4 py-3 mb-24">
        <div className="flex items-center justify-around text-center">
          {[
          { icon: Shield, label: 'Shopee\nGuarantee' },
          { icon: RotateCcw, label: 'Return\n7 Hari' },
          { icon: Package, label: 'Packaging\nSelamat' }].
          map(({ icon: Icon, label }) =>
          <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={18} className="text-[#EE4D2D]" />
              <span className="text-xs text-gray-500 whitespace-pre-line leading-tight">{label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-20">
        <button
          onClick={onContactSeller}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-[#EE4D2D] text-[#EE4D2D] rounded text-sm font-medium hover:bg-red-50 transition-colors">
          
          <MessageCircle size={16} />
          Chat Penjual
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-2.5 bg-orange-400 text-white rounded text-sm font-semibold hover:bg-orange-500 transition-colors">
          
          + Keranjang
        </button>
        <button
          onClick={onAddToCart}
          className="flex-1 py-2.5 bg-[#EE4D2D] text-white rounded text-sm font-semibold hover:bg-[#d94224] transition-colors">
          
          Beli Sekarang
        </button>
      </div>
    </div>);

}

function ChatPanel({ product, onClose }: {product: Product | null; onClose: () => void;}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationId = "customer-shopee-demo-001"; // Stable ID
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch Live History from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          sender: m.sender as any,
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
        })));
      }
    };
    fetchHistory();
  }, [supabase, conversationId]);

  const quickReplies = [`stk size M ada?`, `Confirm Order & Pay`, `pos ke sabah rm?`];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // 1. Add user message to UI
    const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'customer', text, time: now }]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Fetch from our API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: "demo-user-1", message: text, productId: product?.id })
      });

      const data = await res.json();
      let reply = data.reply;

      // 3. CHECK FOR THE POPUP TRIGGER
      const confirmTag = reply.match(/\[SHOW_CONFIRMATION: (.*?)\]/);
      if (confirmTag) {
        const orderData = JSON.parse(confirmTag[1]);
        setPendingOrder(orderData);
        
        // Remove the ugly tag from the chat bubble
        reply = reply.replace(confirmTag[0], "").trim();
        
        // TRIGGER THE POPUP
        setTimeout(() => setIsModalOpen(true), 1000); 
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: reply, time: now }]);
    } catch (e) {
      toast.error("Gagal menghubungi bot.");
    } finally {
      setIsTyping(false);
    }
  };

// 4. FUNCTION CALLED WHEN USER CLICKS "YES" IN POPUP
const handleFinalConfirm = async () => {
  setIsModalOpen(false);
  setIsTyping(true);
  
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      conversationId: "demo-user-1", 
      message: "ACTION_CONFIRM_ORDER", 
      productId: pendingOrder.id,
      qty: pendingOrder.qty 
    })
  });
  
  const data = await res.json();
  const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: data.reply, time: now }]);
  setIsTyping(false);
};

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  return (
    <>
      {/* --- Main Chat Panel --- */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-[#EE4D2D] text-white px-4 py-3 flex items-center gap-3">
          <button onClick={onClose}><ChevronLeft size={20} /></button>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">NF</div>
          <div className="flex-1"><p className="text-sm font-semibold">NabilahFashion.my</p></div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
  
        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f5]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.sender === 'customer' ? 'bg-[#EE4D2D] text-white rounded-br-none' : 
                msg.sender === 'system' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-gray-800 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
  
        {/* Quick Replies */}
        <div className="bg-white border-t p-2 flex gap-2 overflow-x-auto scrollbar-none">
          {quickReplies.map(qr => (
            <button key={qr} onClick={() => sendMessage(qr)} className="whitespace-nowrap text-[10px] px-3 py-1.5 rounded-full border border-[#EE4D2D] text-[#EE4D2D]">{qr}</button>
          ))}
        </div>
  
        {/* Input Area */}
        <div className="p-3 border-t flex gap-2">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)} 
            placeholder="Taip mesej..." 
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" 
          />
          <button onClick={() => sendMessage(input)} className="bg-[#EE4D2D] text-white p-2 rounded-full">
            <Send size={16} />
          </button>
        </div>
      </div>
  
      {/* --- Confirmation Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-[#EE4D2D]">
                <ShoppingCart size={24} />
              </div>
              
              <h3 className="font-bold text-lg mb-2 text-gray-800">Sahkan Pesanan?</h3>
              
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Adakah anda pasti ingin memesan <span className="font-bold text-gray-700">{pendingOrder?.qty}x {pendingOrder?.name}</span>?
              </p>
  
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Nanti Dulu
                </button>
                <button 
                  onClick={handleFinalConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-[#EE4D2D] text-white text-sm font-bold hover:bg-[#d94224] shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  Ya, Sahkan!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CartToast({ count, onClose }: {count: number;onClose: () => void;}) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 animate-slide-up">
      <ShoppingCart size={14} />
      <span>Ditambah ke keranjang ({count} item)</span>
    </div>);

}

/* ─── Main Page ─── */
export default function ShopeeMockPage() {
  const [view, setView] = useState<'listing' | 'detail'>('listing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showCartToast, setShowCartToast] = useState(false);
  const [sortBy, setSortBy] = useState('popular');

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const handleContactSeller = () => {
    setChatProduct(selectedProduct);
    setChatOpen(true);
  };

  const handleAddToCart = () => {
    setCartCount((c) => c + 1);
    setShowCartToast(true);
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.sold - a.sold;
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <ShopeeHeader cartCount={cartCount} onCartClick={() => {}} />

      {view === 'listing' &&
      <div className="max-w-5xl mx-auto">
          {/* Shop banner */}
          <div className="bg-gradient-to-r from-[#EE4D2D] to-[#f97316] text-white px-4 py-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#EE4D2D] font-black text-lg">
                NF
              </div>
              <div>
                <h2 className="font-bold text-base">NabilahFashion.my</h2>
                <div className="flex items-center gap-3 text-xs text-white/80 mt-0.5">
                  <span className="flex items-center gap-1"><Star size={10} className="fill-yellow-300 text-yellow-300" /> 4.8</span>
                  <span>|</span>
                  <span>2.3k Pengikut</span>
                  <span>|</span>
                  <span className="flex items-center gap-1"><MapPin size={10} /> Kuala Lumpur</span>
                </div>
              </div>
              <button
              onClick={() => {setChatProduct(null);setChatOpen(true);}}
              className="ml-auto flex items-center gap-1.5 bg-white text-[#EE4D2D] text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-50 transition-colors">
              
                <MessageCircle size={13} />
                Chat
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-white px-4 py-2.5 flex items-center gap-3 mb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Susun:</span>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {[
            { value: 'popular', label: 'Popular' },
            { value: 'rating', label: 'Rating' },
            { value: 'price-asc', label: 'Harga ↑' },
            { value: 'price-desc', label: 'Harga ↓' }].
            map((opt) =>
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all ${
              sortBy === opt.value ?
              'bg-[#EE4D2D] text-white border-[#EE4D2D]' :
              'border-gray-200 text-gray-600 hover:border-gray-400'}`
              }>
              
                  {opt.label}
                </button>
            )}
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
              <span>{products.length} produk</span>
              <ChevronDown size={12} />
            </div>
          </div>

          {/* Product grid */}
          <div className="px-2 py-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {sortedProducts.map((product) =>
            <ProductCard key={product.id} product={product} onClick={() => handleProductClick(product)} />
            )}
            </div>
          </div>

          {/* Bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-20">
            {[
          { icon: Home, label: 'Utama' },
          { icon: Search, label: 'Cari' },
          { icon: Tag, label: 'Flash Sale' },
          { icon: ShoppingCart, label: 'Keranjang', count: cartCount },
          { icon: Package, label: 'Pesanan' }].
          map(({ icon: Icon, label, count }) =>
          <button key={label} className="flex flex-col items-center gap-0.5 relative">
                <div className="relative">
                  <Icon size={20} className={label === 'Utama' ? 'text-[#EE4D2D]' : 'text-gray-400'} />
                  {count && count > 0 ?
              <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none font-bold">
                      {count}
                    </span> :
              null}
                </div>
                <span className={`text-xs ${label === 'Utama' ? 'text-[#EE4D2D]' : 'text-gray-400'}`}>{label}</span>
              </button>
          )}
          </div>
          <div className="h-16" />
        </div>
      }

      {view === 'detail' && selectedProduct &&
      <ProductDetail
        product={selectedProduct}
        onBack={() => setView('listing')}
        onContactSeller={handleContactSeller}
        onAddToCart={handleAddToCart} />

      }

      {chatOpen &&
      <ChatPanel
        product={chatProduct}
        onClose={() => setChatOpen(false)} />

      }

      {showCartToast &&
      <CartToast count={cartCount} onClose={() => setShowCartToast(false)} />
      }
    </div>);

}