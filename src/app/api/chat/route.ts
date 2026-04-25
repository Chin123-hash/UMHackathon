import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/actions/orders";

export const maxDuration = 60;

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      conversationId,
      productId,
      qty = 1,
      totalPrice = 0,
      customerName = 'Guest',
      destination = 'Selangor',
    } = body;

    const supabase = await createClient();

    console.group("🚀 =========================================");
    console.log("📨 Payload received:", { message, conversationId, productId });

    // --- 1. HANDLE FINAL PURCHASE CONFIRMATION ---
    if (message === "ACTION_CONFIRM_ORDER") {
      console.log("⚙️ Trigger: ACTION_CONFIRM_ORDER");
      const targetId = productId || 'p-001-M';

      // ✅ FIXED SYNTAX ERROR
      console.log("📦 Decrementing stock for:", targetId, "qty:", qty);
      
      const { error: stockError } = await supabase.rpc('decrement_stock', { row_id: targetId, qty });
      if (stockError) {
        console.groupEnd();
        return NextResponse.json({ reply: 'Sorry, the item just went out of stock! 🙏' });
      }

      console.log("📝 Creating order record...");
      const { data: orderData } = await createOrder({
        product_id: targetId,
        quantity: qty,
        total_price: totalPrice,
        customer: customerName,
        destination: destination,
        status: 'pending',
      });
      console.log("✅ Order created. ID:", orderData?.id);

      console.log("📝 Inserting system log...");
      await supabase.from('messages').insert([{
        conversation_id: conversationId,
        sender: 'system',
        text: `🚨 NEW ORDER: ${customerName} bought ${qty}x [${targetId}]. \n⚠️ ACTION REQUIRED: Please manually send the tracking number to this customer.`,
      }]);
      console.log("🔄 Flagging conversation unanswered...");
      await supabase.from("messages").update({ status: 'unanswered' }).eq('conversation_id', conversationId);

      console.log("✅ Returning success confirmation to customer.");
      console.groupEnd();
      return NextResponse.json({
        reply: 'Success! Your order has been confirmed. Please wait a moment; the seller will send you the tracking number shortly. 😊',
      });
    }

    // --- 2. LOG & FETCH HISTORY & CHECK FAILURES ---
    console.group("📖 Fetching History & Checking Failures...");
    // ✅ FIXED TYPE ERROR
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
        let botFailCount = 0;
        for (const msg of historyData) {
          if (msg.sender === 'bot') {
            if (msg.status === 'failed') botFailCount++;
            else break;
          }
        }
        // ✅ FIXED LOGIC: Link internal count to escalation variable
        failureCount = botFailCount;
        console.log(`📊 History fetched. Records: ${historyData.length}, Bot fails in history: ${botFailCount}`);

        chatHistory = historyData.reverse().map((msg) => ({
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text,
        }));
      } else {
        console.log("⚠️ No conversationId provided. Skipping history fetch.");
      }

      console.log("📝 Logging customer message to DB...");
      await supabase.from("messages").insert([{
        conversation_id: conversationId,
        sender: 'customer',
        text: message,
        status: 'unanswered',
      }]);
    }
    console.groupEnd();

    // Human-in-the-Loop Escalation Logic (AI failures)
    if (failureCount >= 2) {
      console.warn(`⚠️ [HITL] AI failed ${failureCount + 1} times. Escalating to human.`);
      await supabase.from("messages").insert([{
        conversation_id: conversationId,
        sender: 'system',
        text: `⚠️ ESCALATION: AI bot failed 3 times. Human intervention required.`,
      }]);
      await supabase.from("messages").update({ status: 'unanswered' }).eq('conversation_id', conversationId);
      return NextResponse.json({
        reply: "Sorry, our AI system is having issues. I've already notified the owner to reply to you manually. 🙏",
      });
    }

    // --- 3. FETCH CONTEXT ---
    console.group("🛒 Fetching Inventory & Shipping Rates...");
    const { data: products } = await supabase.from("products").select("*");
    console.log(`📦 Products fetched: ${products?.length || 0} items`);

    const { data: rates } = await supabase
      .from('courier_rates')
      .select(`buyer_base_price, handling_fee, destination, courier_partners(name)`);
    console.log(`🚚 Shipping rates fetched: ${rates?.length || 0} records`);
    console.groupEnd();

    // --- 4. CONSTRUCT PROMPT ---
    console.group("🧠 Constructing System Prompt...");
    const inventoryTable = products
      ?.map((p) => `| ID: ${p.id} | NAME: ${p.name} | PRICE: RM${p.price} | STOCK: ${p.stock} units |`)
      .join("\n");
    const shippingContext = rates
      ?.map((r: any) => { // ✅ FIXED: Added 'any' to prevent join error
        const partner = Array.isArray(r.courier_partners)
          ? r.courier_partners[0]?.name
          : r.courier_partners?.name;
        const totalShipping = Number(r.buyer_base_price) + Number(r.handling_fee);
        return `- State: ${r.destination} | Shipping: RM${totalShipping.toFixed(2)} (${partner})`;
      })
      .join("\n");

    console.log(`📊 Context mapping complete.`);
    console.groupEnd();

    // --- 5. CALL AI ---
    console.group("🤖 Calling AI Provider...");
    const zaiApiKey = process.env.ZAI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const systemPrompt = `You are SellerMate AI, a helpful sales assistant. 

    LANGUAGE RULE (STRICT): 
    - Analyze the customer's input language carefully.
    - You MUST reply in the EXACT SAME language the customer uses.
    - If the customer writes in English, you MUST reply in English.
    - If the customer writes in Malay, you MAY reply in Malay.
    - If the customer writes in Chinese, you MUST reply in Chinese.
    - Default to ENGLISH if unsure.
    - Do NOT mix languages unnecessarily.

    CRITICAL RULES:
    1. SHIPPING PRIVACY: Only tell the customer the SHIPPING PRICE. NEVER reveal the courier company name. Say: "This is the cheapest shipping rate we have for you."
    2. STOCK VALIDATION: Check 'Stock' in Inventory. If requested Qty > Stock, offer the remaining available stock instead.
    3. ADDRESS PROTOCOL:
       - CHECK HISTORY: Look for a previously mentioned address in Chat History.
       - ASK TO REUSE: If found, ask: "Should we use this address? [Insert Address]"
       - IF YES: Proceed to CALCULATION.
       - IF NO/NOT FOUND: Request the FULL shipping address (Street, Area, Postcode, City, State).
    4. COLLECT NAME: If not known, ask for the customer's name politely.
    5. EXTRACT STATE: Identify the STATE from the address for the shipping rate.
    6. POPUP LOGIC: Only append [SHOW_CONFIRMATION] when Name, Qty, Stock, and Address are ALL confirmed.

    CALCULATION: Total = (Price × Qty) + Shipping Fee.

    TAG FORMAT:
    [SHOW_CONFIRMATION: {"id": "prod_id", "qty": num, "name": "name", "total": price, "customerName": "name", "destination": "state"}]

    ============================
    HUMAN ESCALATION DETECTION
    ============================
    If the customer wants to speak to a HUMAN, output this tag EXACTLY at the START:
    [REQUEST_HUMAN]
    
    Trigger this when customer says:
    - "I want to talk to a real person"
    - "Can I speak to the owner?"
    - "Connect me to human"
    - "I don't want to talk to AI/bot"
    - "Real person please"
    - "Is the owner available?"
    - "Let me talk to someone real"
    - Similar phrases requesting human assistance
    
    After the tag, provide a brief polite acknowledgment.

    DO NOT trigger this for:
    - General complaints (try to help first)
    - Product or shipping questions
    - Asking "are you a bot?" (answer honestly but offer help)
    - Simple greetings

    DATA:
    Inventory: ${inventoryTable}
    Shipping: ${shippingContext}`;

    let botReply = '';

    // --- 5. PRIMARY EXECUTION: Z.ai (Anthropic Format) ---
    if (zaiApiKey && !zaiApiKey.includes('your-zai')) {
      console.log("➡️ Trying Z.ai...");
      try {
        const res = await fetch('https://api.ilmu.ai/anthropic/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': zaiApiKey.trim() },
          body: JSON.stringify({
            model: 'ilmu-glm-5.1',
            system: systemPrompt,
            max_tokens: 1024,
            messages: [...chatHistory, { role: 'user', content: message }],
          }),
          signal: AbortSignal.timeout(50000),
        });

        if (res.ok) {
          const data = await res.json();
          botReply = data.content[0].text;
          console.log("✅ Z.ai Success. Response length:", botReply.length, "chars");
        } else {
          console.error(`❌ Z.ai Failed. Status: ${res.status}`);
        }
      } catch (err: any) {
        console.error("❌ Z.ai Exception:", err.message);
      }
    }

    // --- 6. FALLBACK EXECUTION: Groq (OpenAI Format) ---
    if (!botReply && groqApiKey) {
      console.group("➡️ Z.ai failed/skipped. Trying Groq Fallback...");
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatHistory,
              { role: 'user', content: message },
            ],
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(50000),
        });

        if (res.ok) {
          const data = await res.json();
          botReply = data.choices[0].message.content;
          console.log("✅ Groq Fallback Success.");
        }
      } catch (err: any) {
        console.error("❌ Groq Exception:", err.message);
      }
      console.groupEnd();
    }
    console.groupEnd();

    // --- 7. POST-REPLY LOGGING & HUMAN ESCALATION HANDLING ---
    console.group("💾 Logging to DB & UI...");
    if (botReply) {
      if (botReply.includes('[REQUEST_HUMAN]')) {
        console.log("🚨 [HUMAN ESCALATION] Detected! Removing tag and flagging conversation.");
        const cleanReply = botReply.replace('[REQUEST_HUMAN]', '').trim();

        if (conversationId) {
          await supabase.from('messages').insert([{
            conversation_id: conversationId,
            sender: 'bot',
            text: cleanReply,
            status: 'bot-responded',
          }]);

          await supabase.from('messages').insert([{
            conversation_id: conversationId,
            sender: 'system',
            text: `👤 HUMAN REQUEST: Customer wants manual assistance.`,
          }]);

          await supabase.from("messages").update({ status: 'unanswered' }).eq('conversation_id', conversationId);
          console.groupEnd();
          console.groupEnd();
          return NextResponse.json({ reply: cleanReply, escalatedToHuman: true });
        }
      }

      if (conversationId) {
        await supabase.from('messages').insert([{
          conversation_id: conversationId,
          sender: 'bot',
          text: botReply,
          status: 'bot-responded',
        }]);
      }
      console.log("✅ Returning response to UI.");
      console.groupEnd();
      console.groupEnd();
      return NextResponse.json({ reply: botReply });
    }

    throw new Error("No response from AI.");

  } catch (error: any) {
    console.error("❌ [CRITICAL] Internal Router Error:", error.message);
    return NextResponse.json({ reply: 'System Error.' }, { status: 500 });
  }
}