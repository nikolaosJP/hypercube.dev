---
title: Goal Tracker
date: June 4, 2025
tags: "#React #Python #Productivity #WebDev"
---

## Why This Exists

Most productivity apps fall into one of two species:  
1) the *endless to-do list* that guilt-trips you every morning, and  
2) the *vision board* that makes you feel inspired for seven minutes before you go back to scrolling.  

What almost none of them do is connect the small, boring tasks of today with the grand, naive ambitions of this Year. This tracker exists because I was tired of living in that gap, constantly busy, rarely aligned, and always wondering where the last three months went.

## The Core Problem

Long-term goals are destinations; daily actions are turns on the road. Most people can name where they want to go but struggle to convert that into which turn to take next. The map is clear in theory, but plotting each segment is tedious.

This app handles the routing for you.

![goal_tracker sample](/content/projects/assets/goal_tracker.jpeg)

## How It Links Timeframes

Everything flows downward like a miniature organizational universe:

**Yearly goals → quarterly milestones → monthly targets → weekly sprints → daily tasks.**

It’s basically a Russian nesting doll of ambition, where the giant, intimidating dream quietly turns into concrete daily steps. You stop asking “What should I do today?” and start asking the far more productive “What moves the system forward?” If today’s task doesn’t connect upward, it’s probably noise disguised as productivity.

## Work in Progress (WIP)

The core is live: define goals, break them down, track progress, and watch your dashboards guilt-trip you with cheerful bar charts.

Still building the fun stuff; habit integrations, reminders and reflection prompts. Shipping in public means the app improves at the same rate I do: slowly and steadily with the occasional “why did I architect it this way” lizard-brain thought arising here and there.

## Why Build This When Apps Already Exist?

**Custom fit**: It matches *my* brain, which refuses to cooperate with generic templates.  
**No lock-in**: No subscriptions, no ads, no redesigns that ruin your workflow overnight.  
**Skin in the game**: I use it daily, so bad design decisions hurt me personally, which keeps things honest.

Most tools assume you’ll adapt to them. This one adapts to your goals, which feels refreshingly non-capitalistic.

## The Philosophy

Productivity isn’t doing more; it’s aligning better. The guiding rule is simple:

**“Does today meaningfully move next month?”**  
If not, it’s probably ceremonial busywork wearing a productivity hat.

The app tries to enforce this without being a tyrant, or at least a friendly tyrant with good intentions.

## Technical Details

**Frontend**: React + hooks, React Router, Chart.js  
**Backend**: Python (Flask / FastAPI)  
**Database**: SQLite locally, PostgreSQL in production  
**State**: React Context  
**Styling**: Tailwind  

**Currently working**: multi-timeframe hierarchy, progress dashboards, category grouping, and completion logic.  
**Currently building**: habits (Strava/GitHub), reminders, reflection prompts, and velocity analytics; the features that turn goals into systems and systems into momentum.
[View on GitHub](https://github.com/nikolaosJP/Projects/tree/main/Goal-Tracker)
