import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  try {
    const parser = new Parser();
    // Fetch news related to counterfeit medicines and pharma supply chain
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=counterfeit+medicine+OR+pharma+supply+chain&hl=en-IN&gl=IN&ceid=IN:en');
    
    // Extract titles and limit to top 15
    const headlines = feed.items.slice(0, 15).map(item => item.title);

    return NextResponse.json({ headlines });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ 
      headlines: [
        "Live news feed currently unavailable. Falling back to local network...",
        "WHO reports an increase in counterfeit medicines.",
        "India implements stringent blockchain tracking for pharmaceuticals.",
        "FDA issues new guidelines for cold-chain biological transport."
      ] 
    });
  }
}
