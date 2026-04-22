import { createClient } from "@/lib/supabase/server";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  const supabase = await createClient();

  // Fetch current inventory for context
  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name, size, price, stock");

  const inventoryContext = products
    ?.map(
      (p) =>
        `- ${p.name} (Size: ${p.size || "N/A"}, SKU: ${p.sku}): $${p.price}, Stock: ${p.stock}`
    )
    .join("\n");

  const systemPrompt = `You are SellerMate AI, an intelligent assistant for e-commerce sellers. You help manage customer inquiries, check inventory, and provide product information.

Current Inventory:
${inventoryContext}

Guidelines:
- Be helpful, friendly, and professional
- When customers ask about products, check inventory and provide accurate info
- If a product is low stock (< 50), mention it might sell out soon
- If a product is out of stock (0), apologize and suggest alternatives
- For order inquiries, help track status or escalate to the owner
- Keep responses concise but informative
- If you need to check something you don't know, use the available tools`;

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages,
    tools: {
      checkInventory: tool({
        description:
          "Check the current inventory for a specific product by name or SKU",
        parameters: z.object({
          query: z.string().describe("Product name or SKU to search for"),
        }),
        execute: async ({ query }) => {
          const { data: matchedProducts } = await supabase
            .from("products")
            .select("*")
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%`);

          if (!matchedProducts || matchedProducts.length === 0) {
            return { found: false, message: "No products found matching query" };
          }

          return {
            found: true,
            products: matchedProducts.map((p) => ({
              name: p.name,
              size: p.size,
              price: p.price,
              stock: p.stock,
              sku: p.sku,
            })),
          };
        },
      }),
      getLowStockAlerts: tool({
        description: "Get all products with low stock (below threshold)",
        parameters: z.object({
          threshold: z
            .number()
            .optional()
            .describe("Stock threshold, defaults to 50"),
        }),
        execute: async ({ threshold = 50 }) => {
          const { data: lowStockProducts } = await supabase
            .from("products")
            .select("name, size, stock, sku")
            .lt("stock", threshold)
            .order("stock", { ascending: true });

          return {
            count: lowStockProducts?.length || 0,
            products: lowStockProducts || [],
          };
        },
      }),
    },
    onFinish: async ({ text }) => {
      // Save bot response to database
      if (conversationId && text) {
        await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            sender: "bot",
            text,
          },
        ]);
      }
    },
  });

  return result.toDataStreamResponse();
}
