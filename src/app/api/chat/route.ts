import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationId, productId, qty = 1 } = body;
    
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = await createClient();

    // --- 1. HANDLE FINAL PURCHASE CONFIRMATION ---
    if (message === "ACTION_CONFIRM_ORDER") {
      const targetId = productId || "p-001-M";
      const { error: stockError } = await supabase.rpc('decrement_stock', { row_id: targetId, qty: qty });
      
      if (stockError) return NextResponse.json({ reply: "Maaf sis, stok baru habis! 🙏" });

      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, 
        sender: "system", 
        text: `🚨 ORDER CONFIRMED: ${qty}x [${targetId}].` 
      }]);

      return NextResponse.json({ reply: "Alhamdulillah! Pesanan anda telah disahkan. 😊" });
    }

    // --- 2. LOG & FETCH HISTORY ---
    let chatHistory: ChatMessage[] = [];
    if (conversationId) {
      const { data: historyData } = await supabase
        .from("messages")
        .select("sender, text")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (historyData) {
        chatHistory = historyData.reverse().map(msg => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant' as const,
          content: msg.text
        }));
      }

      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, sender: "customer", text: message, status: "unanswered"
      }]);
    }
    
    // --- 3. FETCH CONTEXT ---
    const { data: products } = await supabase.from("products").select("*");
    const { data: rates } = await supabase.from("courier_rates").select(`buyer_base_price, handling_fee, destination, courier_partners(name)`);

    const inventoryContext = products?.map(p => `- ${p.id}: ${p.name} (RM${p.price}) | Size: ${p.size}`).join("\n");
    const shippingContext = rates?.map(r => {
      const partner = Array.isArray(r.courier_partners) ? r.courier_partners[0]?.name : (r.courier_partners as any)?.name;
      const totalShipping = Number(r.buyer_base_price) + Number(r.handling_fee);
      return `- State: ${r.destination} | Total Shipping: RM${totalShipping.toFixed(2)} (${partner})`;
    }).join("\n");

    // --- 4. SYSTEM PROMPT ---
    const systemPrompt = `You are SellerMate AI.
    
    CRITICAL RULES:
    1. REQUEST FULL ADDRESS: You must ask for the COMPLETE shipping address.
    2. EXTRACT STATE: Identify the STATE from the provided full address. Use this state to find the rate in context.
    3. POPUP LOGIC: You MUST append the [SHOW_CONFIRMATION] tag every time intent is shown and data is ready.
    4. NO BYPASSING: Never skip shipping fees. If the address is incomplete, ask: "Boleh bagi alamat penuh sis?"

    CALCULATION: Total = (Product Price * Qty) + Shipping Fee.
    [SHOW_CONFIRMATION: {"id": "prod_id", "qty": num, "name": "name", "total": price}]

    DATA:
    Inventory: ${inventoryContext}
    Shipping: ${shippingContext}`;

    let botReply = "";
    const apiKey = process.env.ZAI_API_KEY;

    // --- 5. AI EXECUTION WITH DETAILED LOGGING ---
    if (apiKey && !apiKey.includes("your-zai")) {
      const startTime = Date.now();
      try {
        const res = await fetch('https://api.ilmu.ai/anthropic/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey.trim() },
          body: JSON.stringify({
            model: 'ilmu-glm-5.1',
            system: systemPrompt,
            max_tokens: 1024,
            messages: [...chatHistory, { role: 'user', content: message }]
          }),
          signal: AbortSignal.timeout(50000)
        });

        const duration = Date.now() - startTime;

        if (res.ok) {
          const data = await res.json();
          botReply = data.content[0].text;
          console.log(`✅ Z.ai Success: ${duration}ms`);
        } else {
          // --- ADDED ERROR LOGGING ---
          const errorText = await res.text();
          console.error(`❌ Z.ai FAILED (${res.status} ${res.statusText})`);
          console.error(`   Ray-ID: ${res.headers.get('cf-ray') || 'N/A'}`);
          console.error(`   Duration: ${duration}ms`);
          
          try {
            const errorJson = JSON.parse(errorText);
            console.error("   Error Detail:", JSON.stringify(errorJson, null, 2));
          } catch {
            console.error("   Error Body Snippet:", errorText.substring(0, 500));
          }

          if (res.status === 502) console.warn("   💡 HINT: Bad Gateway. AI server is likely down.");
          if (res.status === 401) console.warn("   💡 HINT: Unauthorized. Check ZAI_API_KEY.");
          if (res.status === 404) console.warn("   💡 HINT: Not Found. Check endpoint/model name.");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error("❌ Z.ai TIMEOUT");
        } else {
          console.error("❌ Z.ai CONNECTION ERROR:", err.message);
        }
      }
    }

    botReply = botReply || "Maaf sis, sistem busy sikit. Cuba lagi ya? 🙏";

    if (conversationId) {
      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, sender: "bot", text: botReply, status: "bot-responded"
      }]);
    }

    return NextResponse.json({ reply: botReply });

  } catch (error) {
    console.error("CRITICAL ROUTE ERROR:", error);
    return NextResponse.json({ reply: "Sistem Error." }, { status: 500 });
  }
}