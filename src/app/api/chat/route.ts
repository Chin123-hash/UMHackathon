
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/actions/orders";

export const maxDuration = 30;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationId, productId, qty = 1, totalPrice = 0, customerName = "Guest", destination = "Selangor" } = body;
    
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = await createClient();

    // --- 1. HANDLE FINAL PURCHASE CONFIRMATION ---
    if (message === "ACTION_CONFIRM_ORDER") {
      const targetId = productId || "p-001-M";
      
      // Stock Update
      const { error: stockError } = await supabase.rpc('decrement_stock', { row_id: targetId, qty: qty });
      if (stockError) return NextResponse.json({ reply: "Maaf sis, stok baru habis! 🙏" });

      // Save Order to DB (Feature 1)
      const { success: orderSuccess, data: orderData } = await createOrder({
        product_id: targetId,
        quantity: qty,
        total_price: totalPrice,
        customer: customerName,
        destination: destination,
        status: 'pending'
      });

      // Notify Seller (Feature 1)
      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, 
        sender: "system", 
        text: `🚨 NEW ORDER RECEIVED: ${customerName} bought ${qty}x [${targetId}]. Order ID: ${orderData?.id.slice(0,8)}.` 
      }]);

      return NextResponse.json({ reply: "Alhamdulillah! Pesanan anda telah disahkan dan disimpan dalam sistem. Seller akan proses segera. 😊" });
    }

    // --- 2. LOG & FETCH HISTORY & CHECK FAILURES (Feature 3) ---
    let chatHistory: ChatMessage[] = [];
    let failureCount = 0;

    if (conversationId) {
      const { data: historyData } = await supabase
        .from("messages")
        .select("sender, text, status")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (historyData) {
        // Count consecutive bot failures
        for (const msg of historyData) {
          if (msg.sender === 'bot') {
            if (msg.status === 'failed') failureCount++;
            else break; // Reset if we find a successful response
          }
        }

        chatHistory = historyData.reverse().map(msg => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant' as const,
          content: msg.text
        }));
      }

      await supabase.from("messages").insert([{ 
        conversation_id: conversationId, sender: "customer", text: message, status: "unanswered"
      }]);
    }

    // Escalation Logic (Feature 3)
    if (failureCount >= 2) { // 2 failures already, this will be the 3rd attempt
        // Notify Seller
        await supabase.from("messages").insert([{ 
            conversation_id: conversationId, 
            sender: "system", 
            text: `⚠️ ESCALATION: AI bot failed 3 times. Human intervention required for ${conversationId}.` 
        }]);
        
        // Change conversation status to unanswered to alert owner
        await supabase.from("messages").update({ status: 'unanswered' }).eq('conversation_id', conversationId);

        return NextResponse.json({ reply: "Maaf sis, sistem AI saya sedang mengalami masalah teknikal. Saya sudah maklumkan kepada owner untuk reply sis secara manual sebentar lagi ya. 🙏" });
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
    const systemPrompt = `You are SellerMate AI. Use localized Malay slang ('sis', 'boss', 'ye').
    
    CRITICAL RULES:
    1. REQUEST FULL ADDRESS: You must ask for the COMPLETE shipping address.
    2. EXTRACT STATE: Identify the STATE from the provided full address. Use this state to find the rate in context.
    3. POPUP LOGIC: You MUST append the [SHOW_CONFIRMATION] tag every time intent is shown and data is ready.
    4. NO BYPASSING: Never skip shipping fees. If the address is incomplete, ask: "Boleh bagi alamat penuh sis?"

    CALCULATION: Total = (Product Price * Qty) + Shipping Fee.
    [SHOW_CONFIRMATION: {"id": "prod_id", "qty": num, "name": "name", "total": price, "customerName": "name", "destination": "state"}]

    DATA:
    Inventory: ${inventoryContext}
    Shipping: ${shippingContext}`;

    let botReply = "";
    const apiKey = process.env.ZAI_API_KEY;

    // --- 5. AI EXECUTION ---
    if (apiKey && !apiKey.includes("your-zai")) {
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

        if (res.ok) {
          const data = await res.json();
          botReply = data.content[0].text;
        } else {
           throw new Error("API Failure");
        }
      } catch (err: any) {
        console.error("Z.ai Error:", err.message);
        // Log failure to DB for feature 3
        if (conversationId) {
            await supabase.from("messages").insert([{ 
                conversation_id: conversationId, sender: "bot", text: "System Error. Please try again.", status: "failed"
            }]);
        }
        return NextResponse.json({ reply: "Maaf sis, sistem busy sikit. Cuba lagi ya? 🙏" });
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
    return NextResponse.json({ reply: "Sistem Error." }, { status: 500 });
  }
}
