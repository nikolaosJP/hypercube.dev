---
title: Energy Market Forecasting
date: August 8, 2025
tags: "#Python #QuantEnergy #TimeSeries #XGBoost #Optuna #Backtesting #FeatureEngineering"
---

## The Irritation
Every morning at 9:30 you need a read on tomorrow’s energy prices, and the market behaves like a cat that just heard a vacuum start: weather whiplash, demand spikes, renewables overachieve, then ghost you. “Yesterday plus a shrug” is not a strategy; it’s a vibes-based donation to your counterparty.

## The Gambit (Let the Robots Sweat)
This forecaster exists to make you money and feel mildly superior to ARIMA. It cleans the telemetry with STL imputation, engineers the features you wish you had time for, and trains an Optuna-tuned XGBoost that knows when to lean in or sit out. The output isn’t just a price; it’s a position size that respects risk, before your morning inbox can ambush you.

![energy_market sample](/content/projects/assets/energy_market.jpeg)

## The Deeper Problem
Day-ahead power markets are a hall of mirrors. Renewables surge when the sun decides to overperform, wind stalls for no reason, and demand leaps because someone scheduled a surprise national bake-off. Most desks still rely on patched spreadsheets, last night’s gut feel, and a prayer to Saint Basel. The consequence: either undertrade (hello, opportunity cost) or overtrade (hello, slippage and regret).

## How It Dodges Guess-onomics
- **Data janitor with a degree:** Gaps and outliers across demand, renewables, and prices get patched before they can poison the signal.  
- **Features with teeth:** Cyclical time encodings, season flags, renewable share, spreads, commercial flows, SMAs/EMAs, and 24h/48h/168h lags, because energy remembers.  
- **PnL-first brain:** Hyperparameters are tuned on trading profit, not just RMSE, so the model optimizes your wallet instead of a validation cell.  
- **Position sizing built-in:** Forecasts map to trade sizes via a sensitivity curve, small bets when spreads are meh, full send when conviction spikes.  
- **Backtests that don’t lie:** Walk-forward splits, slippage and costs included, plus benchmarks beyond “what if we time-traveled to yesterday.”

## Why Bother
Because “just hedge it” isn’t a plan, and “the wind will probably blow” is not a thesis. You need a model that understands seasonality, respects grid quirks, and prices the cost of being wrong. This thing turns chaos into probabilities, probabilities into trades, and trades into a PnL curve you can show without clearing your throat first.

## Receipts
- **Simulated PnL:** €1,384,880.61 (best of 30 trials) on day-ahead strategy.  
- **Top levers:** Lagged prices and moving averages carry the load; weather-driven renewables move the needle.  
- **Model DNA:** XGBoost, Optuna-tuned, three years of hourly data.  
- **Visual proof:** Actual vs predicted, accuracy, feature importance, and cumulative PnL marching north in `output/final_output.png`.

## Who Should Care
- Power traders who want explainable-ish trees instead of black-box mysticism.  
- Portfolio folks hedging exposure to intraday chaos.  
- Anyone who prefers their PnL curve trending up and to the right.

<div class="cta-wrapper">
  <a class="cta-button" href="https://github.com/nikolaosJP/Projects/tree/main/Energy-Market-Prediction" target="_blank" rel="noopener noreferrer">View the code</a>
</div>
