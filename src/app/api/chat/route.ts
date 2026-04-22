import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Save customer's message to Supabase
    if (conversationId) {
      await supabase.from("messages").insert([
        { conversation_id: conversationId, sender: "customer", text: message },
      ]);
    }

    // 2. Fetch current inventory for context
    const { data: products } = await supabase
      .from("products")
      .select("id, sku, name, size, price, stock");

    const inventoryContext = products
      ?.map(
        (p) => `- ${p.name} (Size: ${p.size || "N/A"}, SKU: ${p.sku}): RM${p.price}, Stock: ${p.stock}`
      )
      .join("\n") || "No inventory data found.";

    // 3. Construct the System Prompt
    const systemPrompt = `You are SellerMate AI, an intelligent assistant for e-commerce sellers in Malaysia.
    You help manage customer inquiries, check inventory, and provide product information.
    Be friendly, professional, and occasionally use Malaysian slang like 'ye', 'boleh', 'sis'.

    Current Inventory:
    ${inventoryContext}

    Guidelines:
    - Check the inventory context provided above to answer stock questions.
    - If a product is low stock (< 50), mention it might sell out soon.
    - If a product is out of stock (0), apologize and suggest alternatives.
    - Keep responses concise but informative. Do not write long paragraphs.`;

    let botReply = "";

    // 4. AI PROVIDER ROUTING (The "Graceful Fallback" logic)
    // Check if Zhipu Key exists and isn't a dummy string
    if (process.env.ZAI_API_KEY && !process.env.ZAI_API_KEY.includes("your-zai")) {
      console.log("Routing to Zhipu AI (GLM-4)...");
      
      const glmResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });

      if (!glmResponse.ok) throw new Error(`Zhipu API Error: ${glmResponse.statusText}`);
      const aiData = await glmResponse.json();
      botReply = aiData.choices[0].message.content;

    } 
    // Fallback to Gemini if Zhipu key is missing
    // Fallback to Gemini if Zhipu key is missing
    else if (process.env.GROQ_API_KEY) {
      console.log("Routing to Groq (Llama 3)...");
      
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // Super fast, free model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });

      if (!groqResponse.ok) {
        const errorDetails = await groqResponse.text();
        throw new Error(`Groq API Error: ${errorDetails}`);
      }
      
      const aiData = await groqResponse.json();
      botReply = aiData.choices[0].message.content;
    } 
    else {
      throw new Error("No valid AI API keys found in .env file.");
    }

    // 5. Save the Bot's response to Supabase
    if (conversationId) {
      await supabase.from("messages").insert([
        { conversation_id: conversationId, sender: "bot", text: botReply },
      ]);
    }

    // 6. Return response to UI
    return NextResponse.json({ reply: botReply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ 
      reply: "Maaf, sistem sedang sibuk. Sila cuba sebentar lagi 🙏" 
    });
  }
}