---
title: Cost of Living Scraper
date: April 12, 2025
tags: "#WebScraping #Python #Data #Automation"
---

# Cost of Living Scraper  
*For when your future rent shouldn’t be a plot twist.*

## The Problem: Moving Without Financial Night Vision Goggles

Relocating is already an emotional obstacle course. You’re pricing movers, scouting apartments, negotiating offers, and periodically wondering why a mattress costs more to ship than to buy.  
The one piece of information you *really* need is:  
**“What will my life actually cost there?”**

But finding that out usually means clicking through Numbeo like a medieval monk illuminating manuscripts by hand. Beautiful data. Zero ergonomics.

## The Solution: A Tiny Robot That Reads Numbeo So You Don’t Have To

So I built a scraper. Not the shady, website-melting kind. More like a quiet, under-paid new employee who collects all of Numbeo’s tables, cleans them up, and hands you a neat Parquet file while whispering “I organized your entire economic reality.”

You get:
- All costs for all cities in one place  
- Machine-readable structure  
- No more “I swear I saw rent for Lisbon somewhere, but where?”  
- The ability to run actual analyses instead of spiritual guesswork  

![scraper](/content/projects/assets/scraper.jpeg)

## Why Parquet? Because CSV Has Trust Issues

CSV is fine until it decides:
- Commas are optional  
- Encoding is a suggestion  
- File size should mimic the GDP of Luxembourg  

Parquet, meanwhile, compresses like a champ, loads 10x faster, and behaves like a file format created in this century. ALl of these just so your laptop stop threatening to take off vertically. 

## What This Lets You Do (aka The Fun Part)

Once you have clean, structured data, you unlock abilities normally reserved for spreadsheet wizards and corporate economists:

- **Salary crosswalks:** Is 120k in NYC secretly worse than 90k in Nashville?  
- **Relocation calculators:** “If I move to Berlin, will my grocery bill stop screaming?”  
- **Trend detection:** Which cities are quietly becoming luxury goods?  
- **Expat simulations:** How far could your income stretch in, say, Prague?

Suddenly the world is no longer a mystery box full of price tags.

## How It Works (Without Boring You to Tears)

1. Respect `robots.txt` like a civilized human.  
2. Pull pages with `requests` using an honest user agent.  
3. Feed the HTML to BeautifulSoup, which strips out everything except useful tables.  
4. Extract categories: rent, groceries, transport, utilities, etc.  
5. Normalize currencies, rows, and city names so they behave.  
6. Export the whole thing to Parquet via Pandas + PyArrow.  

It updates ~100 cities in roughly the time it takes to microwave leftovers.

## Tech Specs (For the Nerds Among Us)

**Stack:** Python, Requests, BeautifulSoup4, Pandas, PyArrow  
**Coverage:** 500+ cities, 50+ cost categories  
**Update Frequency:** Monthly  
**Rate Limit:** reasonably low, because being blocked is bad and manners are free  

## A Real Example

When comparing offers:
- 10.5M JPY in Tokyo  
- 150k CHF in Zurich  

COL-adjusted, that Tokyo salary behaves like **~135k CHF in Zurich**.  
In other words, Zurich is the bougie final boss of cost of living, and Tokyo is the surprisingly reasonable mid-game level. The bigger paycheck isn’t always the one that actually buys you dinner.

[View on GitHub](https://github.com/nikolaosJP/Projects/tree/main/Cost-of-Living-Scraper)
