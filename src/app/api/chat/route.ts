import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import crypto from 'crypto';

export const maxDuration = 30;

function generateZhipuToken(apiKey: string) {
  try {
    const [id, secret] = apiKey.split('.');
    if (!id || !secret) return apiKey;

    const header = { alg: 'HS256', sign_type: 'SIGN' };
    const payload = {
      api_key: id,
      exp: Date.now() + 3600 * 1000, 
      timestamp: Date.now()
    };

    const toBase64Url = (obj: any) => 
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    const encodedHeader = toBase64Url(header);
    const encodedPayload = toBase64Url(payload);
    
    const signature = crypto.createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  } catch (error) {
    console.error("JWT Generation Error:", error);
    return apiKey;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationId, productId, qty = 1 } = body;
    
    console.log("--- API DEBUG: REQUEST RECEIVED ---");

    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = await createClient();

    // --- 1. HANDLE FINAL PURCHASE CONFIRMATION ---
    if (message === "ACTION_CONFIRM_ORDER") {
      const targetId = productId || "p-001-M";
      const { error: stockError } = await supabase.rpc('decrement_stock', { row_id: targetId, qty: qty });

      if (stockError) {
        return NextResponse.json({ reply: "Maaf sis, stok untuk item ini baru sahaja habis. 🙏" });
      }

      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, 
        sender: "system", 
        text: `🚨 NEW ORDER: Customer confirmed ${qty}x [${targetId}] via confirmation popup.` 
      }]);

      return NextResponse.json({ reply: "Terima kasih! Pesanan anda telah disahkan dan akan diproses segera. 😊" });
    }

    // --- 2. LOG CUSTOMER MESSAGE ---
    if (conversationId) {
      await supabase.from("messages").insert([{ conversation_id: conversationId, sender: "customer", text: message }]);
    }

    // --- 3. FETCH CONTEXT (Now including Description) ---
    // We explicitly select the description column
    const { data: products } = await supabase
      .from("products")
      .select("id, name, size, stock, price, description");

    const inventoryContext = products?.map(p => 
      `- ID: ${p.id} | Name: ${p.name} | Size: ${p.size} | Stock: ${p.stock} | Price: RM${p.price} | Product Info: ${p.description || "Tiada info tambahan."}`
    ).join("\n") || "No inventory found.";

    const systemPrompt = `You are SellerMate AI, a helpful e-commerce assistant in Malaysia.
    Use friendly slang like 'sis', 'boss', 'ye'. 

    CONTEXT:
    The customer is currently looking at product group: ${productId}.
    Inventory List:
    ${inventoryContext}

    GUIDELINES:
    1. Use the 'Product Info' section from the inventory list to answer questions about material, fabric, design, or benefits (e.g., if user asks "kain apa ni?").
    2. If a customer expresses intent to buy, you MUST respond nicely and append this EXACT tag at the very end: 
       [SHOW_CONFIRMATION: {"id": "target_variant_id", "qty": number, "name": "product_name"}]
    3. Use suffix "-FS" for Free Size and "-S", "-M", etc., for others.`;

    let botReply = "";

    // --- 4. AI PROVIDERS ---

    // Option A: Z.ai / ILMU-GLM-5.1
    if (process.env.ZAI_API_KEY && !process.env.ZAI_API_KEY.includes("your-zai")) {
      const traceId = Math.random().toString(36).substring(7);
      console.group(`[TRACE-${traceId}] Z.ai Request`);
      const apiKey = process.env.ZAI_API_KEY.trim();

      try {
        const res = await fetch('https://api.ilmu.ai/anthropic/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
          body: JSON.stringify({
            model: 'ilmu-glm-5.1',
            system: systemPrompt,
            max_tokens: 1024,
            messages: [{ role: 'user', content: message }]
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
          const data = await res.json();
          botReply = data.content[0].text;
          console.log("SUCCESS: Z.ai replied.");
        } else {
            console.error("Z.ai Error:", res.status);
        }
      } catch (err: any) {
        console.error("Z.ai Connection Error:", err.message);
      }
      console.groupEnd();
    }

    // Option B: Groq Fallback
    if (!botReply && process.env.GROQ_API_KEY) {
      console.log("Routing to Groq...");
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        botReply = data.choices[0].message.content;
      }
    }

    botReply = botReply || "Maaf, sistem sedang sibuk sebentar. Sila cuba lagi ya? 🙏";

    // --- 5. LOG BOT REPLY ---
    if (conversationId) {
      await supabase.from("messages").insert([{ conversation_id: conversationId, sender: "bot", text: botReply }]);
    }

    return NextResponse.json({ reply: botReply });

  } catch (error: any) {
    console.error("Chat API Critical Error:", error);
    return NextResponse.json({ reply: "Sistem Error. Sila cuba lagi sebentar." }, { status: 500 });
  }
}