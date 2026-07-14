import MetaTrader5 as mt5
import pandas as pd
import pandas_ta as ta
import time
from datetime import datetime, timezone
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

FIREBASE_URL = "https://tradingview-c3839-default-rtdb.asia-southeast1.firebasedatabase.app"

# In-memory dictionary to track active signals. Format: { "firebase_id": signal_payload }
active_signals = {}

# Cooldown tracking - persisted to Firebase so restarts don't bypass it
last_published_time = {}

# Track last published direction to prevent duplicate same-direction signals
last_published_direction = {}

# ─── Firebase Helpers ──────────────────────────────────────────────────────────

def push_to_firebase(signal_data):
    try:
        res = requests.post(f"{FIREBASE_URL}/signals.json", json=signal_data)
        if res.status_code == 200:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] New Signal Published -> {signal_data['status']} {signal_data['direction']} @ {signal_data['price']}")
            return res.json().get('name')
        else:
            print(f"Firebase push failed: {res.text}")
            return None
    except Exception as e:
        print(f"Error pushing to Firebase: {e}")
        return None

def update_signal_status(signal_id, new_status):
    try:
        res = requests.patch(f"{FIREBASE_URL}/signals/{signal_id}.json", json={
            'status': new_status,
            'updatedAt': datetime.now(timezone.utc).isoformat()
        })
        if res.status_code == 200:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Signal {signal_id} -> {new_status}")
    except Exception as e:
        print(f"Error updating Firebase: {e}")

def push_live_price(symbol, bid, ask):
    try:
        price = round((bid + ask) / 2, 2)
        safe_symbol = symbol.replace(".", "_").replace("#", "_").replace("$", "_").replace("[", "_").replace("]", "_")
        requests.patch(f"{FIREBASE_URL}/live_prices.json", json={
            safe_symbol: {
                'symbol': symbol,
                'price': price,
                'bid': bid,
                'ask': ask,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        })
    except Exception as e:
        pass

def save_state_to_firebase():
    """Persist the cooldown state so restarts don't reset it."""
    try:
        requests.put(f"{FIREBASE_URL}/engine_state.json", json={
            'last_published_time': last_published_time,
            'last_published_direction': last_published_direction,
            'updated_at': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"Error saving engine state: {e}")

def load_state_from_firebase():
    """Load persisted cooldown state on startup."""
    global last_published_time, last_published_direction
    try:
        res = requests.get(f"{FIREBASE_URL}/engine_state.json")
        if res.status_code == 200 and res.json():
            data = res.json()
            # Handle migration from old integer format to dict
            if isinstance(data.get('last_published_time'), dict):
                last_published_time = data.get('last_published_time', {})
                last_published_direction = data.get('last_published_direction', {})
            else:
                last_published_time = {}
                last_published_direction = {}
            print(f"Restored engine state for {len(last_published_time)} symbols.")
    except Exception as e:
        print(f"Error loading engine state: {e}")

def load_active_signals():
    """Load active signals from Firebase on startup so TP/SL tracking continues."""
    global active_signals
    try:
        res = requests.get(f"{FIREBASE_URL}/signals.json")
        if res.status_code == 200 and res.json():
            data = res.json()
            count = 0
            for key, val in data.items():
                if val.get('status') == 'ACTIVE':
                    active_signals[key] = val
                    count += 1
            if count > 0:
                print(f"Resumed tracking {count} active signal(s) from Firebase.")
    except Exception as e:
        print(f"Error loading active signals: {e}")

# ─── Telegram ──────────────────────────────────────────────────────────────────

def get_telegram_chat_id(bot_token):
    """Auto-detect chat_id from recent bot messages."""
    try:
        res = requests.get(f"https://api.telegram.org/bot{bot_token}/getUpdates")
        if res.status_code == 200:
            updates = res.json().get('result', [])
            if updates:
                for update in reversed(updates):
                    msg = update.get('message') or update.get('channel_post')
                    if msg:
                        return str(msg['chat']['id'])
    except Exception as e:
        print(f"Chat ID auto-detect failed: {e}")
    return None

def send_telegram_message(text):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not bot_token:
        return

    # Auto-detect chat_id if not set or is placeholder
    if not chat_id or chat_id in ["YOUR_CHAT_ID", ""]:
        print("TELEGRAM_CHAT_ID not set, attempting auto-detect...")
        chat_id = get_telegram_chat_id(bot_token)
        if chat_id:
            print(f"Auto-detected chat_id: {chat_id}. Add this to your .env file!")
        else:
            print("Could not auto-detect Telegram chat ID. Send /start to your bot first.")
            return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    try:
        requests.post(url, json=payload)
        print("Telegram notification sent!")
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

# ─── MT5 ──────────────────────────────────────────────────────────────────────

def initialize_mt5():
    print("Initializing MetaTrader 5...")
    login = os.getenv("MT5_LOGIN")
    password = os.getenv("MT5_PASSWORD")
    server = os.getenv("MT5_SERVER")

    if login and password and server:
        print(f"Attempting to log into {server} with account {login}...")
        authorized = mt5.initialize(login=int(login), password=password, server=server)
    else:
        authorized = mt5.initialize()

    if not authorized:
        print("initialize() failed, error code =", mt5.last_error())
        quit()

    print("MetaTrader 5 initialized successfully.")

    # Restore state from Firebase so restarts don't lose cooldown or active signals
    load_state_from_firebase()
    load_active_signals()

def get_data(symbol, timeframe, num_candles):
    if not mt5.symbol_select(symbol, True):
        return None
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, num_candles)
    if rates is None or len(rates) == 0:
        return None
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    df.set_index('time', inplace=True)
    return df

# ─── FIX #3: Session Filter ────────────────────────────────────────────────────

def is_valid_trading_session(symbol):
    """
    Trade during all three major sessions:
      - Asia / Tokyo  : 00:00 – 07:00 UTC  (Gold reacts to Asian demand & JPY moves)
      - London        : 07:00 – 13:00 UTC  (Highest volume for XAUUSD)
      - New York      : 13:00 – 20:00 UTC  (USD data, Fed news)
    Dead zone blocked: 20:00 – 00:00 UTC (post-NY close, very thin liquidity).
    """
    # Synthetic indices run 24/7
    if any(keyword in symbol for keyword in ["Vol", "Volatility", "Step", "Crash", "Boom", "Jump"]):
        return True

    now_utc = datetime.now(timezone.utc)
    hour = now_utc.hour

    in_asia   = 0 <= hour < 7    # Tokyo session
    in_london = 7 <= hour < 13   # London session
    in_ny     = 13 <= hour < 20  # New York session

    in_session = in_asia or in_london or in_ny

    if in_session:
        if in_asia:   session_name = "Asia/Tokyo"
        elif in_london: session_name = "London"
        else:           session_name = "New York"
    else:
        session_name = "Dead Zone"

    if not in_session:
        print(f"   -> [{symbol}] [{now_utc.strftime('%H:%M')} UTC] {session_name} — outside all sessions. Waiting for Asia open.")
    return in_session

# ─── Alpha Vantage ─────────────────────────────────────────────────────────────

last_av_fetch_time = 0
av_cached_data = None

def get_alpha_vantage_sentiment():
    global last_av_fetch_time, av_cached_data
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        return None
    
    current_time = time.time()
    # Cache for 1 hour (3600 seconds)
    if current_time - last_av_fetch_time < 3600 and av_cached_data:
        return av_cached_data
        
    # Removed topics=economy_macro,financial_markets as AV sometimes flags it as invalid input on free tiers
    url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey={api_key}"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if "Information" in data or "Note" in data:
                # Silently ignore AV rate limits/errors to not spam the console
                return av_cached_data
                
            feed = data.get("feed", [])
            if not feed:
                return av_cached_data
                
            scores = [item.get("overall_sentiment_score", 0) for item in feed[:10]]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            if avg_score <= -0.35: label = "Bearish"
            elif avg_score <= -0.15: label = "Somewhat-Bearish"
            elif avg_score < 0.15: label = "Neutral"
            elif avg_score < 0.35: label = "Somewhat-Bullish"
            else: label = "Bullish"
            
            headlines = [{"title": item.get("title"), "sentiment": item.get("overall_sentiment_label")} for item in feed[:3]]
            
            av_cached_data = {
                "score": avg_score,
                "label": label,
                "headlines": headlines
            }
            last_av_fetch_time = current_time
            print(f"Refreshed Alpha Vantage Sentiment: {label} ({avg_score:.2f})")
            return av_cached_data
    except Exception as e:
        print(f"Alpha Vantage Error: {e}")
    return av_cached_data

# ─── Gemini AI ─────────────────────────────────────────────────────────────────

def get_gemini_analysis(symbol, direction, price, rsi, macd_hist, mtf_trends, confluences, av_sentiment, atr):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "AI Analysis unavailable."

    prompt = f"Act as a professional forex trader. A {direction} setup was detected for {symbol} at ${price:.2f}. "
    prompt += f"RSI={rsi:.1f}, MACD Histogram={macd_hist:.4f}. "
    prompt += f"Timeframe trends: M5={mtf_trends['M5']}, M15={mtf_trends['M15']}, H1={mtf_trends['H1']}, H4={mtf_trends['H4']}. "
    prompt += f"{confluences} out of 8 confluence factors aligned. "
    prompt += f"ATR (volatility) = {atr:.2f}. "
    
    if av_sentiment:
        prompt += f"Global Macro Sentiment is {av_sentiment['label']}. "
        prompt += "Top Headlines: " + ", ".join([h['title'] for h in av_sentiment['headlines']]) + ". "
        
    prompt += "Write 2 concise sentences explaining why this is a high-probability setup. Plain text only, no bullet points or markdown."

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-2.0-flash-exp",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                return res.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        except Exception:
            continue
            
    return "AI Analysis temporarily unavailable. (Check API Key)"

# ─── Dynamic Confidence & RR ───────────────────────────────────────────────────

def calculate_confidence_and_grade(confluences):
    """Dynamically score confidence based on how many factors aligned (max 8)."""
    score = 50 + (confluences * 6)
    score = min(score, 97)  # Cap at 97%

    if score >= 90:
        grade = "A+"
    elif score >= 80:
        grade = "A"
    elif score >= 70:
        grade = "B"
    else:
        grade = "C"

    return score, grade

def calculate_rr(entry, sl, tp1):
    """Calculate actual Risk/Reward ratio."""
    risk = abs(entry - sl)
    reward = abs(tp1 - entry)
    if risk == 0:
        return 0.0
    return round(reward / risk, 2)

# ─── Core Analysis ─────────────────────────────────────────────────────────────

def analyze_market(symbol):
    global last_published_time, last_published_direction, active_signals

    # Fetch live price every cycle to update the UI
    tick = mt5.symbol_info_tick(symbol)
    if tick:
        push_live_price(symbol, tick.bid, tick.ask)

    # ── FIX #3: Session Gate ─────────────────────────────────────────────────
    if not is_valid_trading_session(symbol):
        return

    # 1. Fetch Multi-Timeframe Data (including H4 for FIX #6)
    df_m5  = get_data(symbol, mt5.TIMEFRAME_M5,  100)
    df_m15 = get_data(symbol, mt5.TIMEFRAME_M15, 100)
    df_h1  = get_data(symbol, mt5.TIMEFRAME_H1,  100)
    df_h4  = get_data(symbol, mt5.TIMEFRAME_H4,  100)

    if df_m5 is None or df_m15 is None or df_h1 is None or df_h4 is None:
        print("Warning: Failed to fetch one or more timeframes. Skipping cycle.")
        return

    # ── FIX #2: Use CLOSED candle (iloc[-2]) NOT live candle (iloc[-1]) ───────
    # iloc[-1] = currently forming (unreliable). iloc[-2] = last fully closed candle.
    IDX = -2

    # MTF EMA50 Trends — all based on last CLOSED candle
    df_m5['ema50']  = ta.ema(df_m5['close'],  length=50)
    df_m15['ema50'] = ta.ema(df_m15['close'], length=50)
    df_h1['ema50']  = ta.ema(df_h1['close'],  length=50)
    df_h4['ema50']  = ta.ema(df_h4['close'],  length=50)

    trend_m5  = "BULLISH" if float(df_m5['close'].iloc[IDX])  > float(df_m5['ema50'].iloc[IDX])  else "BEARISH"
    trend_m15 = "BULLISH" if float(df_m15['close'].iloc[IDX]) > float(df_m15['ema50'].iloc[IDX]) else "BEARISH"
    trend_h1  = "BULLISH" if float(df_h1['close'].iloc[IDX])  > float(df_h1['ema50'].iloc[IDX])  else "BEARISH"
    trend_h4  = "BULLISH" if float(df_h4['close'].iloc[IDX])  > float(df_h4['ema50'].iloc[IDX])  else "BEARISH"
    mtf_trends = {"M5": trend_m5, "M15": trend_m15, "H1": trend_h1, "H4": trend_h4}

    # M15 Indicators — based on CLOSED candle
    df_m15['ema20'] = ta.ema(df_m15['close'], length=20)
    df_m15['rsi']   = ta.rsi(df_m15['close'], length=14)
    macd_df         = ta.macd(df_m15['close'], fast=12, slow=26, signal=9)

    # ── FIX #1: ATR for dynamic SL/TP ────────────────────────────────────────
    df_m15['atr'] = ta.atr(df_m15['high'], df_m15['low'], df_m15['close'], length=14)
    current_atr   = float(df_m15['atr'].iloc[IDX])

    # ── FIX #5: True MACD CROSSOVER detection (not just value) ───────────────
    macd_hist_prev    = float(macd_df.iloc[-3, 1])  # 2 candles ago
    macd_hist_closed  = float(macd_df.iloc[IDX, 1]) # last closed candle
    macd_bullish_cross = macd_hist_prev <= 0 and macd_hist_closed > 0  # crossed UP
    macd_bearish_cross = macd_hist_prev >= 0 and macd_hist_closed < 0  # crossed DOWN

    current_close  = float(df_m15['close'].iloc[IDX])
    current_ema20  = float(df_m15['ema20'].iloc[IDX])
    current_ema50  = float(df_m15['ema50'].iloc[IDX])
    current_rsi    = float(df_m15['rsi'].iloc[IDX])

    # ── FIX #7: Volatility Filter ─────────────────────────────────────────────
    # ATR too low = dead market (wide spread eats profit)
    # ATR too high = explosive/news spike (unpredictable, dangerous)
    # NOTE: These fixed values are tuned for XAUUSD. Synthetic indices have massive ATRs.
    if "XAU" in symbol.upper() or "GOLD" in symbol.upper():
        ATR_MIN = 2.0   
        ATR_MAX = 25.0  
        if current_atr < ATR_MIN or current_atr > ATR_MAX:
            print(f"   -> [{symbol}] ATR={current_atr:.2f} outside safe range [{ATR_MIN}-{ATR_MAX}]. Skipping.")
            return

    current_live_price = None
    if tick:
        current_live_price = (tick.bid + tick.ask) / 2

    # 2. Track active signals against TP/SL
    if current_live_price is not None:
        for sig_id, sig_data in list(active_signals.items()):
            if sig_data.get('symbol') != symbol:
                continue
            
            direction = sig_data['direction']
            status = "ACTIVE"
            if direction == "BUY":
                if current_live_price >= sig_data['takeProfit1']:
                    status = "COMPLETED_TP"
                elif current_live_price <= sig_data['stopLoss']:
                    status = "COMPLETED_SL"
            elif direction == "SELL":
                if current_live_price <= sig_data['takeProfit1']:
                    status = "COMPLETED_TP"
                elif current_live_price >= sig_data['stopLoss']:
                    status = "COMPLETED_SL"

            if status != "ACTIVE":
                update_signal_status(sig_id, status)
                del active_signals[sig_id]
                emoji = "✅" if status == "COMPLETED_TP" else "❌"
                send_telegram_message(f"{emoji} *TRADE CLOSED* {emoji}\n\nSymbol: *{sig_data.get('symbol', symbol)}*\nDirection: *{direction}*\nResult: *{status}*\nClose Price: {current_live_price:.2f}")

    # Fetch AV sentiment BEFORE calculating confluences so the math can use it
    av_sentiment   = get_alpha_vantage_sentiment()
    sentiment_label = av_sentiment['label'] if av_sentiment else "Neutral"

    # 3. Detect New Setups — 8-factor confluence system
    # ── FIX #5: MACD crossover used instead of raw histogram ─────────────────
    # ── FIX #6: H4 EMA50 trend added as 8th factor ───────────────────────────
    buy_score = 0
    if current_close > current_ema50: buy_score += 1          # Price above M15 EMA50
    if current_ema20 > current_ema50: buy_score += 1          # EMA20 > EMA50 (bullish structure)
    if 40 < current_rsi < 65:         buy_score += 1          # RSI in healthy buy zone
    if macd_bullish_cross:             buy_score += 1          # MACD just crossed UP (strong signal)
    if trend_m5  == "BULLISH":         buy_score += 1          # M5  micro-trend aligned
    if trend_h1  == "BULLISH":         buy_score += 1          # H1  mid-trend aligned
    if trend_h4  == "BULLISH":         buy_score += 1          # H4  macro-trend aligned (new)
    if "Bullish" in sentiment_label:   buy_score += 1          # Macro news aligned

    sell_score = 0
    if current_close < current_ema50: sell_score += 1
    if current_ema20 < current_ema50: sell_score += 1
    if 35 < current_rsi < 60:         sell_score += 1
    if macd_bearish_cross:             sell_score += 1          # MACD just crossed DOWN
    if trend_m5  == "BEARISH":         sell_score += 1
    if trend_h1  == "BEARISH":         sell_score += 1
    if trend_h4  == "BEARISH":         sell_score += 1          # H4 macro-trend aligned
    if "Bearish" in sentiment_label:   sell_score += 1

    # Requires 5+ out of 8 factors (higher bar = better quality signals)
    direction  = "NONE"
    confluences = 0
    if buy_score >= 5 and sell_score < buy_score:
        direction   = "BUY"
        confluences = buy_score
    elif sell_score >= 5 and sell_score > buy_score:
        direction   = "SELL"
        confluences = sell_score

    current_time     = time.time()
    last_time = last_published_time.get(symbol, 0)
    last_dir = last_published_direction.get(symbol, "NONE")
    
    time_since_last  = current_time - last_time
    cooldown_remaining = max(0, int(900 - time_since_last))

    print(f"[{datetime.now().strftime('%H:%M:%S')}] {symbol}: {current_close:.2f} | ATR:{current_atr:.1f} | MTF:{trend_m5[0]}/{trend_m15[0]}/{trend_h1[0]}/{trend_h4[0]} | RSI:{current_rsi:.1f} | MACD_X:{'B' if macd_bullish_cross else ('S' if macd_bearish_cross else '-')} | BUY:{buy_score}/8 SELL:{sell_score}/8 -> {direction}")

    # Skip if cooldown active
    if direction != "NONE" and cooldown_remaining > 0:
        print(f"   -> [{symbol}] Cooldown: {cooldown_remaining}s remaining")
        return

    # Check if there is already an ACTIVE signal of the same direction
    has_active_same_direction = any(
        s.get('direction') == direction and s.get('symbol') == symbol for s in active_signals.values()
    )
    if direction != "NONE" and has_active_same_direction:
        print(f"   -> [{symbol}] Skipping duplicate {direction} signal (Already ACTIVE)")
        return

    # Skip if same direction as last signal (deduplication after cooldown)
    if direction != "NONE" and direction == last_dir and cooldown_remaining == 0:
        print(f"   -> [{symbol}] Skipping duplicate {direction} signal (same as last)")
        return

    if direction == "NONE":
        return

    # ── FIX #1 & #4: Dynamic ATR-based SL/TP with minimum 1:1.5 RR ──────────
    # SL = 1.5x ATR (gives room for normal volatility, not too tight)
    # TP1 = 2.0x ATR (1:1.33 RR — first target, partial profit)
    # TP2 = 3.0x ATR (1:2.0 RR  — second target, ride the trend)
    sl_distance  = round(current_atr * 1.5, 2)
    tp1_distance = round(current_atr * 2.0, 2)
    tp2_distance = round(current_atr * 3.0, 2)
    entry_price  = current_close

    if direction == "BUY":
        stop_loss    = entry_price - sl_distance
        take_profit1 = entry_price + tp1_distance
        take_profit2 = entry_price + tp2_distance
        entry_low    = entry_price - (current_atr * 0.2)
        entry_high   = entry_price + (current_atr * 0.1)
    else:
        stop_loss    = entry_price + sl_distance
        take_profit1 = entry_price - tp1_distance
        take_profit2 = entry_price - tp2_distance
        entry_low    = entry_price - (current_atr * 0.1)
        entry_high   = entry_price + (current_atr * 0.2)

    rr = calculate_rr(entry_price, stop_loss, take_profit1)
    confidence, grade = calculate_confidence_and_grade(confluences)
    ai_analysis = get_gemini_analysis(symbol, direction, entry_price, current_rsi, macd_hist_closed, mtf_trends, confluences, av_sentiment, current_atr)

    signal_payload = {
        "symbol":       symbol,
        "direction":    direction,
        "status":       "ACTIVE",
        "price":        entry_price,
        "confidence":   confidence,
        "grade":        grade,
        "riskReward":   rr,
        "confluences":  confluences,
        "entryLow":     round(entry_low, 2),
        "entryHigh":    round(entry_high, 2),
        "stopLoss":     round(stop_loss, 2),
        "takeProfit1":  round(take_profit1, 2),
        "takeProfit2":  round(take_profit2, 2),
        "atr":          round(current_atr, 2),
        "createdAt":    datetime.now(timezone.utc).isoformat(),
        "updatedAt":    datetime.now(timezone.utc).isoformat(),
        "mtf":          mtf_trends,
        "aiAnalysis":   ai_analysis
    }

    sig_id = push_to_firebase(signal_payload)
    if sig_id:
        active_signals[sig_id] = signal_payload
        last_published_time[symbol] = current_time
        last_published_direction[symbol] = direction
        save_state_to_firebase()

        msg  = f"🚨 *NEW SETUP DETECTED* 🚨\n\n"
        msg += f"Symbol: *{symbol}*  |  Direction: *{direction}*\n"
        msg += f"Grade: *{grade}*  |  Confidence: *{confidence}%*  |  RR: *1:{rr}*\n"
        msg += f"Confluences: *{confluences}/8*  |  ATR: *{current_atr:.1f}*\n\n"
        msg += f"🎯 Entry: {entry_low:.2f} - {entry_high:.2f}\n"
        msg += f"✅ TP1: {take_profit1:.2f}  |  TP2: {take_profit2:.2f}\n"
        msg += f"🛑 SL: {stop_loss:.2f}\n\n"
        msg += f"_{ai_analysis[:200]}_"
        send_telegram_message(msg)

# ─── Main Loop ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    initialize_mt5()
    print("\n--- MT5 Analysis Engine Started (v2.0 — ATR + Session + Crossover) ---\n")

    consecutive_errors = 0
    while True:
        try:
            target_symbols = os.getenv("SYMBOLS", "XAUUSD").split(",")
            for sym in target_symbols:
                analyze_market(sym.strip())
            consecutive_errors = 0
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nShutting down gracefully...")
            mt5.shutdown()
            break
        except Exception as e:
            consecutive_errors += 1
            print(f"[ERROR #{consecutive_errors}] {e}")
            if consecutive_errors >= 5:
                print("Too many consecutive errors. Attempting MT5 reconnect...")
                try:
                    mt5.shutdown()
                    time.sleep(5)
                    initialize_mt5()
                    consecutive_errors = 0
                except Exception as reconnect_err:
                    print(f"Reconnect failed: {reconnect_err}")
            time.sleep(10)
