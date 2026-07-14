import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=economy_macro,financial_markets&apikey=${apiKey}`;
    
    // Cache the response for 1 hour to prevent hitting the 25 req/day limit
    const res = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Alpha Vantage" }, { status: res.status });
    }

    const data = await res.json();

    if (data.Information || data.Note) {
      // Rate limit hit
      return NextResponse.json({ error: "Rate limit exceeded", data: data }, { status: 429 });
    }

    const feed = data.feed || [];
    
    // Calculate average sentiment for top 10 articles
    const top10 = feed.slice(0, 10);
    const scores = top10.map((item: any) => parseFloat(item.overall_sentiment_score) || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    
    let label = "Bullish";
    if (avgScore <= -0.35) label = "Bearish";
    else if (avgScore <= -0.15) label = "Somewhat-Bearish";
    else if (avgScore < 0.15) label = "Neutral";
    else if (avgScore < 0.35) label = "Somewhat-Bullish";

    const headlines = feed.slice(0, 4).map((item: any) => ({
      title: item.title,
      url: item.url,
      sentiment: item.overall_sentiment_label,
      source: item.source,
      time: item.time_published
    }));

    return NextResponse.json({
      score: avgScore,
      label: label,
      headlines: headlines
    });

  } catch (error) {
    console.error("Sentiment API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
