import { NextResponse } from 'next/server';

interface Look {
  look_id: string;
  image_url: string;
  caption: string;
  username: string;
  tags?: string[];
}

export async function GET() {
  try {
    // Simulate API delay in production
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock look options data
    const lookOptions: Look[] = Array.from({ length: 10 }, (_, i) => ({
      look_id: `option-${i + 1}`,
      image_url: `https://picsum.photos/seed/option${i + 1}/400/600?random=${Math.random()}`,
      caption: [
        "Denim jacket with patches",
        "White sneakers with blue accents", 
        "Black leather belt with silver buckle",
        "Statement necklace with gemstones",
        "Oversized sunglasses",
        "Canvas tote bag",
        "Beaded bracelet set",
        "Knit beanie hat",
        "Patterned silk scarf",
        "Leather boots with buckles"
      ][i],
      username: "ai_stylist",
      tags: ["accessory", "complement", "style", "fashion", "trending"][i % 5] 
        ? [["accessory", "complement", "style", "fashion", "trending"][i % 5]] 
        : undefined
    }));

    return NextResponse.json(lookOptions);
  } catch (error) {
    console.error("Error fetching look options:", error);
    return NextResponse.json(
      { error: "Failed to fetch look options" },
      { status: 500 }
    );
  }
} 