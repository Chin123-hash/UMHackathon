'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  Bot,
  ShoppingBag,
  Grid,
  Play,
  Tag,
  Star,
  Truck,
  Package,
  RotateCcw,
  Shield,
  Plus,
  Home,
  Compass,
  User,
  ShoppingCart,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

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
  likes: number;
  caption: string;
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
    id: 'p-001',
    name: 'Baju Kurung Moden Sulam Bunga',
    price: 89.9,
    originalPrice: 129.9,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1fa25d908-1766904818168.png',
    rating: 4.8,
    sold: 312,
    stock: 14,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Dusty Rose', 'Sage Green', 'Navy Blue'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    badge: 'Bestseller',
    description:
      'Baju kurung moden dengan sulaman bunga halus. Kain premium, selesa dipakai seharian. Sesuai untuk majlis & harian.',
    likes: 1247,
    caption:
      '✨ New drop! Baju Kurung Moden Sulam Bunga — available in 3 warna cantik. Link in bio untuk order 🛍️ #BajuKurung #NabilahFashion #OotdMalaysia',
  },
  {
    id: 'p-002',
    name: 'Blouse Chiffon Raya Exclusive',
    price: 59.9,
    originalPrice: 79.9,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_18bab4eb7-1776700401543.png',
    rating: 4.6,
    sold: 187,
    stock: 6,
    sizes: ['S', 'M', 'L'],
    colors: ['Cream', 'Blush Pink', 'Mint'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    badge: 'Low Stock',
    description:
      'Blouse chiffon ringan & elegan. Potongan A-line yang menyembunyikan perut. Boleh mix & match dengan pelbagai bawahan.',
    likes: 893,
    caption:
      '🌸 Blouse Chiffon Raya Exclusive — ringan, elegan & perfect untuk Raya! Tinggal sikit je stok 🔥 DM untuk order sekarang! #BlouseChiffon #RayaFashion',
  },
  {
    id: 'p-003',
    name: 'Dress Batik Viral Corak Pelangi',
    price: 75.0,
    originalPrice: 99.0,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_136de2dc4-1773433617181.png',
    rating: 4.9,
    sold: 521,
    stock: 22,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Multicolor'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    badge: 'Top Rated',
    description:
      'Dress batik corak pelangi yang viral di TikTok! Kain batik cotton premium, selesa & cantik. Free size friendly.',
    likes: 3421,
    caption:
      '🌈 Dress Batik Viral yang korang dah lama tunggu! Corak pelangi exclusive, kain cotton premium. Viral di TikTok & sekarang ada kat sini! #DressBatik #BatikViral',
  },
  {
    id: 'p-004',
    name: 'Tudung Bawal Premium Sulam – 10 Warna',
    price: 35.9,
    originalPrice: 49.9,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_19d0d1210-1772330628015.png',
    rating: 4.7,
    sold: 893,
    stock: 45,
    sizes: ['Free Size'],
    colors: ['10 Colors Available'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    badge: 'Hot Deal',
    description:
      'Tudung bawal premium dengan sulaman tepi yang cantik. Kain satin silk, tak panas & mudah dipakai. Tersedia 10 warna pilihan.',
    likes: 2156,
    caption:
      '💫 Tudung Bawal Premium Sulam — 10 warna pilihan! Kain satin silk yang lembut & tak panas. Perfect untuk daily & majlis 💕 #TudungBawal #HijabStyle',
  },
  {
    id: 'p-005',
    name: 'Palazzo Pants Linen Wide Leg',
    price: 45.9,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1abe5bd75-1772474934368.png',
    rating: 4.5,
    sold: 234,
    stock: 18,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Camel', 'Olive'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    description:
      'Palazzo pants linen yang selesa & stylish. Potongan wide leg yang trendy. Sesuai untuk kerja & casual.',
    likes: 678,
    caption:
      '🤍 Palazzo Pants Linen Wide Leg — comfort meets style! Available in 3 neutral tones. Perfect untuk office & casual wear 👌 #PalazzoPants #OotdMy',
  },
  {
    id: 'p-006',
    name: 'Set Baju Melayu Moden Slim Fit',
    price: 119.9,
    originalPrice: 159.9,
    image: 'https://img.rocket.new/generatedImages/rocket_gen_img_1a9088ea2-1776700401296.png',
    rating: 4.8,
    sold: 156,
    stock: 9,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Light Blue', 'Charcoal'],
    shopName: 'NabilahFashion.my',
    location: 'Kuala Lumpur',
    badge: 'New Arrival',
    description:
      'Set baju melayu moden potongan slim fit. Kain teluk belanga premium. Lengkap dengan sampin & butang.',
    likes: 1089,
    caption:
      '👔 New Arrival! Set Baju Melayu Moden Slim Fit — potongan kemas & moden. Lengkap dengan sampin & butang premium ✨ #BajuMelayu #RayaReady #NabilahFashion',
  },
];

const stories = [
  { id: 's-0', label: 'Your Story', avatar: '👤', isOwn: true },
  { id: 's-1', label: 'Flash Sale', avatar: '🔥', hasNew: true },
  { id: 's-2', label: 'New Drop', avatar: '✨', hasNew: true },
  { id: 's-3', label: 'Raya 2025', avatar: '🌙', hasNew: true },
  { id: 's-4', label: 'Batik Viral', avatar: '🌈', hasNew: false },
  { id: 's-5', label: 'Behind Scenes', avatar: '🎬', hasNew: false },
];

/* ─── Instagram Header ─── */
function IGHeader({ onDMClick }: { onDMClick: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-[470px] mx-auto px-4 py-3 flex items-center justify-between">
        <span
          className="font-bold text-xl tracking-tight text-gray-900"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          NabilahFashion
        </span>
        <div className="flex items-center gap-4">
          <button className="text-gray-800 hover:text-gray-600 transition-colors">
            <Heart size={24} />
          </button>
          <button
            onClick={onDMClick}
            className="text-gray-800 hover:text-gray-600 transition-colors relative"
          >
            <MessageCircle size={24} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Stories Bar ─── */
function StoriesBar() {
  return (
    <div className="bg-white border-b border-gray-100 py-3">
      <div className="max-w-[470px] mx-auto px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-none">
          {stories.map((story) => (
            <button key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  story.isOwn
                    ? 'border-2 border-dashed border-gray-300'
                    : story.hasNew
                      ? 'p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                      : 'p-0.5 bg-gray-200'
                }`}
              >
                {story.isOwn ? (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                    <Plus size={20} className="text-gray-400" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {story.avatar}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 w-16 text-center truncate">{story.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feed Post Card ─── */
function FeedPost({
  product,
  onProductClick,
  onChatClick,
}: {
  product: Product;
  onProductClick: () => void;
  onChatClick: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(product.likes);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <article className="bg-white border-b border-gray-100">
      {/* Post header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-700">
              NF
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Instagram</p>
            <p className="text-xs text-gray-400">{product.location}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post image */}
      <div className="relative cursor-pointer" onDoubleClick={handleLike} onClick={onProductClick}>
        <img
          src={product.image}
          alt={`${product.name} by NabilahFashion`}
          className="w-full aspect-square object-cover"
        />
        {/* Shopping tag overlay */}
        <div className="absolute bottom-3 left-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick();
            }}
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <ShoppingBag size={12} />
            View Product
          </button>
        </div>
        {discount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}
        {product.badge && (
          <div
            className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${
              product.badge === 'Low Stock'
                ? 'bg-orange-500 text-white'
                : product.badge === 'Bestseller'
                  ? 'bg-yellow-500 text-white'
                  : product.badge === 'Top Rated'
                    ? 'bg-green-500 text-white'
                    : product.badge === 'New Arrival'
                      ? 'bg-blue-500 text-white'
                      : 'bg-red-500 text-white'
            }`}
          >
            {product.badge}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform active:scale-125">
              <Heart size={24} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-800'} />
            </button>
            <button
              onClick={onChatClick}
              className="text-gray-800 hover:text-gray-600 transition-colors"
            >
              <MessageCircle size={24} />
            </button>
            <button className="text-gray-800 hover:text-gray-600 transition-colors">
              <Send size={22} />
            </button>
          </div>
          <button
            onClick={() => setSaved((s) => !s)}
            className="transition-transform active:scale-110"
          >
            <Bookmark
              size={24}
              className={saved ? 'fill-gray-800 text-gray-800' : 'text-gray-800'}
            />
          </button>
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {likeCount.toLocaleString()} likes
        </p>

        {/* Price tag */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-gray-900">RM{product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              RM{product.originalPrice.toFixed(2)}
            </span>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">
              {product.rating} · {product.sold} sold
            </span>
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-800 leading-relaxed">
          <span className="font-semibold">nabilahfashion.my </span>
          <span className="text-gray-600">{product.caption}</span>
        </p>

        {/* View all comments */}
        <button
          onClick={onChatClick}
          className="text-sm text-gray-400 mt-1 hover:text-gray-600 transition-colors"
        >
          View all comments
        </button>

        {/* Add comment */}
        <div className="flex items-center gap-2 mt-2 pb-3 border-t border-gray-50 pt-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">
            👤
          </div>
          <button
            onClick={onChatClick}
            className="flex-1 text-left text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Add a comment...
          </button>
          <button
            onClick={onChatClick}
            className="text-blue-500 text-sm font-semibold hover:text-blue-600"
          >
            Post
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Profile Header ─── */
function ProfileHeader({ onChatClick }: { onChatClick: () => void }) {
  return (
    <div className="bg-white px-4 py-4 border-b border-gray-100">
      <div className="max-w-[470px] mx-auto">
        <div className="flex items-center gap-6 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl font-bold text-gray-700">
              NF
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-base font-bold text-gray-900">6</p>
              <p className="text-xs text-gray-500">posts</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">2.3K</p>
              <p className="text-xs text-gray-500">followers</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">148</p>
              <p className="text-xs text-gray-500">following</p>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">NabilahFashion.my 🛍️</p>
          <p className="text-sm text-gray-600">Fashion & Lifestyle · Kuala Lumpur</p>
          <p className="text-sm text-gray-600">✨ Baju kurung, blouse & more</p>
          <p className="text-sm text-blue-500">🔗 nabilahfashion.my/shop</p>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
            Follow
          </button>
          <button
            onClick={onChatClick}
            className="flex-1 py-1.5 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Message
          </button>
          <button className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid View ─── */
function GridView({
  products,
  onProductClick,
}: {
  products: Product[];
  onProductClick: (p: Product) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onProductClick(product)}
          className="relative aspect-square overflow-hidden group"
        >
          <img
            src={product.image}
            alt={`${product.name} – NabilahFashion`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white font-semibold text-sm">
              <span className="flex items-center gap-1">
                <Heart size={14} className="fill-white" /> {product.likes.toLocaleString()}
              </span>
            </div>
          </div>
          {product.badge && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Product Detail Sheet ─── */
function ProductDetailSheet({
  product,
  onClose,
  onChatClick,
}: {
  product: Product;
  onClose: () => void;
  onChatClick: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <p className="text-sm font-semibold text-gray-800">nabilahfashion.my</p>
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal size={22} className="text-gray-700" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        <div className="relative">
          <img
            src={product.image}
            alt={`${product.name} – NabilahFashion`}
            className="w-full aspect-square object-cover"
          />
          {discount && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Action bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked((l) => !l)}>
              <Heart size={24} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-800'} />
            </button>
            <button onClick={onChatClick}>
              <MessageCircle size={24} className="text-gray-800" />
            </button>
            <button>
              <Send size={22} className="text-gray-800" />
            </button>
          </div>
          <Bookmark size={24} className="text-gray-800" />
        </div>

        {/* Product info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-gray-900">RM{product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                RM{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">{product.name}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {product.rating}
            </span>
            <span>·</span>
            <span>{product.sold} sold</span>
            <span>·</span>
            <span className={product.stock < 10 ? 'text-orange-500 font-medium' : ''}>
              {product.stock} in stock
            </span>
          </div>
        </div>

        {/* Variants */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    selectedSize === s
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Color
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    selectedColor === c
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                –
              </button>
              <span className="text-sm font-semibold w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Description
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
        </div>

        {/* Shipping & guarantees */}
        <div className="px-4 py-3 mb-24">
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
            <Truck size={16} className="text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-800">Free shipping on orders over RM150</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Semenanjung RM6.90 · Sabah/Sarawak RM9.90
              </p>
            </div>
          </div>
          <div className="flex items-center justify-around text-center pt-3 border-t border-gray-100">
            {[
              { icon: Shield, label: 'Buyer\nProtection' },
              { icon: RotateCcw, label: '7-Day\nReturn' },
              { icon: Package, label: 'Safe\nPackaging' },
            ].map(({ icon: IconComp, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <IconComp size={18} className="text-gray-500" />
                <span className="text-xs text-gray-400 whitespace-pre-line leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-20">
        <button
          onClick={onChatClick}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-800 text-gray-800 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <MessageCircle size={16} />
          Message
        </button>
        <button className="flex-1 py-2.5 bg-gray-800 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors">
          Add to Bag
        </button>
        <button className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
          Buy Now
        </button>
      </div>
    </div>
  );
}

/* ─── DM Chat Panel ─── */
function DMChatPanel({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Modal and Order States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  const conversationId = 'customer-insta-demo-001'; // Stable ID for this demo
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch History from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            sender: m.sender as any,
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
      }
    };
    fetchHistory();
  }, [supabase, conversationId]);

  // Exact phrase to trigger backend human escalation
  const quickReplies = [
    'Ada stok size M?',
    'Pos ke Sabah?',
    'Boleh COD?',
    'Bila restock?',
    'I want to talk to the owner',
  ];

  // Integrated sendMessage calling real API
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

    // 1. Update UI
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'customer', text, time: now },
    ]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Real API call to Chat Route
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text, productId: product?.id }),
      });

      const data = await res.json();
      let reply = data.reply;

      // 3. Check for the order trigger tag
      const confirmTag = reply.match(/\[SHOW_CONFIRMATION: (.*?)\]/);
      if (confirmTag) {
        const orderData = JSON.parse(confirmTag[1]);
        setPendingOrder(orderData);
        reply = reply.replace(confirmTag[0], '').trim();
        setTimeout(() => setIsModalOpen(true), 1000);
      }

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: 'bot', text: reply, time: now },
      ]);
    } catch (e) {
      toast.error('Bot is currently offline.');
    } finally {
      setIsTyping(false);
    }
  };

  // Handle final DB confirmation
  const handleFinalConfirm = async () => {
    setIsModalOpen(false);
    setIsTyping(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message: 'ACTION_CONFIRM_ORDER',
        productId: pendingOrder.id,
        qty: pendingOrder.qty,
        totalPrice: pendingOrder.total,
        customerName: pendingOrder.customerName || 'Instagram User',
        destination: pendingOrder.destination || 'Selangor',
      }),
    });

    const data = await res.json();
    const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'bot', text: data.reply, time: now },
    ]);
    setIsTyping(false);
  };

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-700">
            NF
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">nabilahfashion.my</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
            Active now
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <button>
            <Phone size={20} />
          </button>
          <button>
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Product context */}
      {product && (
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-3 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{product.name}</p>
            <p className="text-xs font-bold text-gray-900">RM{product.price.toFixed(2)}</p>
          </div>
          <Tag size={14} className="text-gray-400 shrink-0" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.sender !== 'customer' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0 mb-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <Bot size={11} className="text-gray-600" />
                </div>
              </div>
            )}
            <div
              className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'customer'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-sm'
                  : msg.sender === 'system'
                    ? 'bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs italic'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              <p>{msg.text}</p>
              <p
                className={`text-xs mt-0.5 ${msg.sender === 'customer' ? 'text-white/70 text-right' : 'text-gray-400'}`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Bot size={11} className="text-gray-600" />
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ✅ AI Disclaimer Banner (Rounded & Pinned) */}
      <div className="px-3 pt-1 shrink-0 bg-white">
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex gap-2 items-start">
          <Bot size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-600">AI Assistant Active:</span> Handled by AI
            by default. If you find any hallucinations or misinformation, please request a human
            seller below.
          </p>
        </div>
      </div>

      {/* Quick replies */}
      <div className="bg-white border-t border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {quickReplies.map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
              qr === 'I want to talk to the owner'
                ? 'border-blue-400 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium'
                : 'border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800'
            }`}
          >
            {qr === 'I want to talk to the owner' ? '👤 Talk to owner' : qr}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-2.5 flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Message..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
          />
        </div>
        {input.trim() ? (
          <button
            onClick={() => sendMessage(input)}
            className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition-colors px-1"
          >
            Send
          </button>
        ) : (
          <div className="flex items-center gap-3 text-gray-500">
            <button>
              <Heart size={22} />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal Integrated into Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4 text-pink-600">
                <ShoppingCart size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Confirm Order?</h3>

              {/* Updated Description with Price */}
              <div className="text-sm text-gray-500 mb-6 space-y-1 leading-relaxed">
                <p>
                  Hi <span className="font-bold text-gray-800">{pendingOrder?.customerName}</span>!
                </p>
                <p>
                  Please confirm order for{' '}
                  <span className="font-bold text-gray-700">
                    {pendingOrder?.qty}x {pendingOrder?.name}
                  </span>
                  .
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Total Payment</p>
                  <p className="text-2xl font-black text-pink-600">
                    RM{pendingOrder?.total?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder icons for DM header
function Phone({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function Video({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

/* ─── Tab Bar ─── */
function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  const tabs = [
    { id: 'feed', icon: Home },
    { id: 'explore', icon: Compass },
    { id: 'reels', icon: Play },
    { id: 'shop', icon: ShoppingBag },
    { id: 'profile', icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2.5 z-20">
      {tabs.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center transition-colors ${activeTab === id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 1.5} />
        </button>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function InstagramMockPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleChatFromPost = (product: Product) => {
    setChatProduct(product);
    setChatOpen(true);
  };

  const handleChatFromDetail = () => {
    setChatProduct(selectedProduct);
    setChatOpen(true);
  };

  const isProfileTab = activeTab === 'profile';

  return (
    <div className="min-h-screen bg-white font-sans">
      <IGHeader
        onDMClick={() => {
          setChatProduct(null);
          setChatOpen(true);
        }}
      />

      <div className="max-w-[470px] mx-auto pb-20">
        {/* Profile tab */}
        {isProfileTab && (
          <>
            <ProfileHeader
              onChatClick={() => {
                setChatProduct(null);
                setChatOpen(true);
              }}
            />
            {/* Grid/Reels tabs */}
            <div className="flex border-b border-gray-200">
              <button className="flex-1 py-3 flex items-center justify-center border-b-2 border-gray-900">
                <Grid size={20} className="text-gray-900" />
              </button>
              <button className="flex-1 py-3 flex items-center justify-center">
                <Play size={20} className="text-gray-400" />
              </button>
              <button className="flex-1 py-3 flex items-center justify-center">
                <Tag size={20} className="text-gray-400" />
              </button>
            </div>
            <GridView products={products} onProductClick={handleProductClick} />
          </>
        )}

        {/* Feed tab */}
        {!isProfileTab && (
          <>
            <StoriesBar />
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <FeedPost
                  key={product.id}
                  product={product}
                  onProductClick={() => handleProductClick(product)}
                  onChatClick={() => handleChatFromPost(product)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Product detail sheet */}
      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onChatClick={handleChatFromDetail}
        />
      )}

      {/* DM Chat */}
      {chatOpen && <DMChatPanel product={chatProduct} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
