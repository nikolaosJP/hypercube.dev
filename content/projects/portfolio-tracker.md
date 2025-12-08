---
title: Portfolio Tracker
date: October 2, 2025
tags: "#Python #QuantFinance #PortfolioAnalytics"
---

# Portfolio Tracker  
*A love letter to people who just wanted to invest, not become part-time data janitors.*

## The Pain
You open your Interactive Brokers CSV and it looks like the Dead Sea Scrolls got merged with a grocery receipt. Column names like `column_7` stare back at you, daring you to find “cash” among the hieroglyphs. Meanwhile, your allocation has drifted off to chase butterflies and you’re wondering if you actually made money or just generated an expensive hobby.

## The Promise
Portfolio Tracker is the friend who shows up with a label maker and a sense of humor. It slurps those IBKR exports, grabs live prices, and rebuilds your portfolio’s entire life story, cash, cost basis, dividends, FX timing, the whole soap opera, then hands you a shopping list for rebalancing so your targets stop freelancing.

![portfolio sample](/content/projects/assets/portfolio.jpeg)

## How It Saves You From Spreadsheet Purgatory
- **It translates IBKR-ese into human.** Trades, FX conversions, dividends, taxes, deposits, and fees get normalized automatically.  
- **It keeps the receipts.** Contributed capital, cost basis, equity, realized/unrealized P&L, and time-weighted returns (plus annualized TWR) all tracked daily.  
- **It points to the culprits.** Per-symbol grades: shares, avg price, market value, weight, dividends, taxes, unrealized P&L. Who’s carrying, who’s loafing.  
- **It’s visually loud.** Value curves with buy/sell markers, P&L bands, dividend progress, stacked allocation plots. You know what happened and when.  
- **It’s honest about FX drama.** Tells you if your yen-to-USD timing was genius or gremlin.  
- **It tells you what to buy next.** Feed it a target allocation and new cash; it returns whole-share buys that fit the budget and close the gaps.

## Who This Is For
- The “I invest but refuse to cosplay as an accountant” crowd.  
- People who want to brag about returns without hiding the math.  
- Anyone allergic to ad-supported fintech dashboards that sell your eyeballs to the highest bidder.

## What You Actually Do
1) Export your IBKR CSVs and drop them into `data/`.  
2) Open `jupyter/portfolio_analysis.ipynb` and run all cells.  
3) Stare at the plots and the annotated summary, feel feelings, then execute the rebalancing shopping list.  
4) Go outside; you’re done.

## Why Trust It
It’s pure Python + Polars for the heavy lifting, `yfinance` for fresh prices, Matplotlib for the drawings, and notebooks so you can see every step. No hidden API calls, no mystery sauce, just your data, made legible.

<div class="cta-wrapper">
  <a class="cta-button" href="https://github.com/nikolaosJP/Projects/tree/main/Portfolio-Tracker" target="_blank" rel="noopener noreferrer">View the code</a>
</div>
