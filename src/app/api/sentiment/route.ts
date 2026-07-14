import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // NOTE: Free tier does NOT support the `topics` filter — removed to prevent 422 errors
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${apiKey}`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from Alpha Vantage" }, { status: res.status });
    }

    const data = await res.json();

    if (data.Information || data.Note) {
      // Rate limit hit — return a graceful response instead of an error
      return NextResponse.json({ 
        score: 0.1,
        label: "Somewhat-Bullish",
        headlines: [],
        cached: true,
        message: "Rate limit reached, using fallback."
      });
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
