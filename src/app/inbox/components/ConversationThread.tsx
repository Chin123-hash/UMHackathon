'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Crown, Loader2, Info } from 'lucide-react';
import { Conversation } from './InboxLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { addMessage } from '@/lib/actions/messages'; // Add this import
interface Message {
  id: string;
  sender: 'customer' | 'bot' | 'owner';
  text: string;
  time: string;
  toolCall?: { name: string; status: 'loading' | 'done'; result?: string };
}

const threadData: Record<string, Message[]> = {
  'conv-001': [
    { id: 'msg-001-1', sender: 'customer', text: 'stk size M ada tak? nak beli 2 helai', time: '15:23:41' },
    {
      id: 'msg-001-2',
      sender: 'bot',
      text: '',
      time: '15:23:42',
      toolCall: { name: 'Inventory API', status: 'done', result: 'stock: 3, reserved: 1 → available: 2' },
    },
    { id: 'msg-001-3', sender: 'bot', text: 'Ada stok M, tinggal 2 je! 😊 Nak proceed order? Boleh add to cart terus ye~', time: '15:23:44' },
    { id: 'msg-001-4', sender: 'customer', text: 'ok la, nak beli 2. boleh COD?', time: '15:24:10' },
    { id: 'msg-001-5', sender: 'bot', text: 'Maaf, kami tak support COD buat masa ni. Payment via Shopee je ye 🙏 Tapi selamat & mudah!', time: '15:24:12' },
  ],
  'conv-002': [
    { id: 'msg-002-1', sender: 'customer', text: 'pos ke sabah berapa rm? boleh combine order?', time: '15:21:55' },
    {
      id: 'msg-002-2',
      sender: 'bot',
      text: '',
      time: '15:21:56',
      toolCall: { name: 'Shipping API', status: 'done', result: 'KL→Sabah: RM9.90, est 5–7 days (J&T)' },
    },
    { id: 'msg-002-3', sender: 'bot', text: 'Pos ke Sabah RM9.90 via J&T, est 5–7 hari kerja 📦 Combine order boleh, shipping kira sekali je!', time: '15:21:58' },
    { id: 'msg-002-4', sender: 'customer', text: 'kalau 3 items still rm9.90?', time: '15:22:30' },
  ],
  'conv-005': [
    { id: 'msg-005-1', sender: 'customer', text: 'boleh refund tak kalau size tak muat?', time: '15:14:20' },
    { id: 'msg-005-2', sender: 'bot', text: 'Soalan tentang refund/return perlu owner sahkan. Saya escalate ke owner sekarang ya 🙏', time: '15:14:22' },
    { id: 'msg-005-3', sender: 'owner', text: 'Hi! Boleh je refund dalam 7 hari, item dalam kondisi asal. DM saya gambar dulu ye 😊', time: '15:15:01' },
  ],
  'conv-007': [
    { id: 'msg-007-1', sender: 'customer', text: 'bila restock size S? dah 3 kali check sold out 😭', time: '15:08:50' },
    {
      id: 'msg-007-2',
      sender: 'bot',
      text: '',
      time: '15:08:51',
      toolCall: { name: 'Inventory API', status: 'done', result: 'BKM-001 S: stock=0, restock_eta=unknown' },
    },
    { id: 'msg-007-3', sender: 'bot', text: 'Maaf, size S habis stok buat masa ni 😔 Saya dah alert owner untuk restock. Nak saya notif bila ada stok?', time: '15:08:53' },
    { id: 'msg-007-4', sender: 'customer', text: 'boleh! please notif tau', time: '15:09:10' },
  ],
};

const defaultThread = (conv: Conversation): Message[] => [
  {
    id: `default-${conv.id}-1`,
    sender: 'customer',
    text: conv.lastMessage,
    time: conv.time,
  },
];

interface ConversationThreadProps {
  conversation: Conversation;
  viralSpike: boolean;
}

export default function ConversationThread({
  conversation,
  viralSpike,
}: ConversationThreadProps) {
  const messages = threadData[conversation.id] || defaultThread(conversation);
  const [displayMessages, setDisplayMessages] = useState<Message[]>(messages);
  const [isTyping, setIsTyping] = useState(false);
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayMessages(threadData[conversation.id] || defaultThread(conversation));
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isTyping]);

  // Viral spike: simulate bot auto-responding
  useEffect(() => {
    if (viralSpike && conversation.id.startsWith('spike')) {
      setIsTyping(true);
      const t = setTimeout(() => {
        setIsTyping(false);
        setDisplayMessages((prev) => [
          ...prev,
          {
            id: `spike-reply-${conversation.id}`,
            sender: 'bot',
            text: 'Hai! Ada stok M 😊 Pos ke Sabah RM9.90. Nak proceed?',
            time: '15:25',
          },
        ]);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [viralSpike, conversation.id]);

  const handleSendOwnerReply = async () => {
    if (!replyText.trim()) return;

    const textToSend = replyText;
    setReplyText(''); // Clear input immediately for UX

    // 1. Save to Database
    const result = await addMessage(conversation.id, 'owner', textToSend);

    if (result.success) {
      // 2. Update UI locally
      setDisplayMessages((prev) => [
        ...prev,
        {
          id: result.data?.id || `owner-reply-${Date.now()}`,
          sender: 'owner',
          text: textToSend,
          time: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      toast.success('Reply saved and status updated to Owner Replied');
    } else {
      toast.error('Failed to save message to database');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Thread header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {conversation.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mono">{conversation.customer}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mono font-medium">
                Shopee
              </span>
              <StatusBadge status={conversation.status} />
              <span className="text-xs text-muted-foreground mono">{conversation.intent.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {/* Viral spike indicator */}
      {viralSpike && conversation.id.startsWith('spike') && (
        <div className="flex items-center gap-2 px-5 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          <Loader2 size={12} className="animate-spin" />
          Agent is auto-responding to viral spike messages…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
        {displayMessages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {/* Tool call card */}
            {msg.toolCall && (
              <div className="flex justify-center mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-xs mono text-primary-700">
                  {msg.toolCall.status === 'loading' ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Info size={11} />
                  )}
                  <span className="font-semibold">{msg.toolCall.name}</span>
                  {msg.toolCall.result && (
                    <span className="text-primary-500">→ {msg.toolCall.result}</span>
                  )}
                </div>
              </div>
            )}

            {/* Message bubble */}
            {msg.text && (
              <div
                className={[
                  'flex items-end gap-2',
                  msg.sender === 'customer' ? 'justify-start' : 'justify-end',
                ].join(' ')}
              >
                {msg.sender === 'customer' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
                <div className="max-w-xs xl:max-w-sm">
                  {msg.sender !== 'customer' && (
                    <div className="flex items-center gap-1 mb-1 justify-end">
                      {msg.sender === 'bot' ? (
                        <>
                          <Bot size={11} className="text-primary-600" />
                          <span className="text-xs text-primary-600 font-medium mono">Agent</span>
                        </>
                      ) : (
                        <>
                          <Crown size={11} className="text-green-600" />
                          <span className="text-xs text-green-600 font-medium mono">Owner</span>
                        </>
                      )}
                    </div>
                  )}
                  <div
                    className={[
                      'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      msg.sender === 'customer' ?'bg-muted text-foreground rounded-bl-sm'
                        : msg.sender === 'bot' ?'bg-primary-600 text-white rounded-br-sm' :'bg-green-600 text-white rounded-br-sm',
                    ].join(' ')}
                  >
                    {msg.text}
                  </div>
                  <p className="text-xs text-muted-foreground mono mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end animate-fade-in">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-primary-600 rounded-2xl rounded-br-sm">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Owner reply input */}
      <div className="px-5 py-3.5 border-t border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 mono">
          <Crown size={12} className="text-green-600" />
          Reply as Owner
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOwnerReply()}
            placeholder="Type a reply as owner…"
            className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
          />
          <button
            onClick={handleSendOwnerReply}
            disabled={!replyText.trim()}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}