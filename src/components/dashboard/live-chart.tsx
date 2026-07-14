"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { useTheme } from "next-themes";

export function LiveChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = resolvedTheme === "dark";
    const textColor = isDark ? "#d1d5db" : "#374151";
    const gridColor = isDark ? "#ffffff10" : "#00000010";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Mock data for XAUUSD (Dates must be ascending)
    const data = [
      { time: '2026-07-08', open: 2320.5, high: 2340.2, low: 2315.1, close: 2335.8 },
      { time: '2026-07-09', open: 2335.8, high: 2355.5, low: 2330.3, close: 2350.2 },
      { time: '2026-07-10', open: 2350.2, high: 2365.2, low: 2345.1, close: 2360.8 },
      { time: '2026-07-11', open: 2360.8, high: 2370.5, low: 2355.3, close: 2368.2 },
      { time: '2026-07-12', open: 2368.2, high: 2385.0, low: 2365.0, close: 2380.5 },
      { time: '2026-07-13', open: 2380.5, high: 2390.1, low: 2375.4, close: 2388.9 },
    ];
    
    candlestickSeries.setData(data);

    // Mock Entry Line
    candlestickSeries.createPriceLine({
      price: 2385.0,
      color: "#FFD700", // Gold
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: "ENTRY",
    });

    // Mock Take Profit
    candlestickSeries.createPriceLine({
      price: 2400.0,
      color: "#26a69a",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "TP1",
    });

    // Mock Stop Loss
    candlestickSeries.createPriceLine({
      price: 2370.0,
      color: "#ef5350",
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "SL",
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [resolvedTheme]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
