---
title: Rent vs Buy Simulator
date: February 14, 2024
tags: "#Finance #Modeling #RealEstate #Python"
---

## Why Build a Rent-vs-Buy Simulator

Everyone has an opinion about housing. Your uncle says buying is always better. Your coworker insists renting is financially enlightened minimalism. TikTok says the world is ending so just buy whatever. None of this is helpful. The simulator exists because math is quiet, patient, and doesn’t project its life regrets onto you. It lets you run the numbers cleanly so you can make decisions based on reality rather than whoever yelled loudest on the internet that day.

At its core, the tool answers a deceptively simple question: “What does each path actually do to my net worth over time?” Spoiler: the answer is almost never what people assume.

## What People Constantly Miss

Buying a home is not just “mortgage good, rent bad.” It’s a hydra of hidden cash flows: opportunity cost on the down payment, maintenance that shows up like a surprise tax on adulthood, property taxes, HOA fees, and the emotional tax of fixing things that break because gravity won’t mind its own business. Renting, meanwhile, gets dismissed as “throwing money away,” which is only true if you assume your investments sit in a sock under your bed.

Most rules of thumb collapse all this nuance into a single sentence, which is roughly why they are wrong half the time and unhelpful the other half.

## How the Simulator Actually Thinks

The model treats both paths like parallel universes and projects them forward.

In the Renting Universe, you pay rent each month and invest the money that *would* have gone into a down payment. If renting is cheaper than owning (often the case early on), you invest the monthly savings too. Your net worth grows through compounding, not drywall.

In the Buying Universe, you deploy the down payment upfront, take on a mortgage, pay property taxes and maintenance, and ride the unpredictable roller coaster of home appreciation. In this scenario, you get whatever tax benefits your local government allocates to “people brave enough to own things that break” and invest any potential savings.

After simulating both worlds, the model compares your net worth at 5, 10, 20, and 30 years, essentially asking which version of you ends up with more money and fewer regrets.

## The Results That Surprise People

With the current assumptions, renting + investing isn’t just an early win; it keeps the crown the whole 25-year run. The down payment compounding in markets plus modest rent inflation means buying never catches up in this scenario; the net wealth gap lands around ¥210.8M in favor of renting. However, change the appreciation or rent growth knobs and that story can flip.

![rent_buy sample](/content/projects/assets/rent_buy.jpeg)

The twist is that there’s no universal right answer. Anyone selling you a one-size-fits-all rule is ignoring math, nuance, and the part where life happens differently for everyone.

## The Variables That Actually Swing the Outcome

1. **Home appreciation rate**: A shift from 3 to 5 percent turns entire timelines upside down.  
2. **Stock market returns**: Whether the market behaves like a golden retriever (10 percent) or a grumpy cat (6 percent).  
3. **How long you stay**: Moving too often resets the financial clock.  
4. **Rent inflation**: If rent climbs substantially on an annual basis, ownership suddenly looks like a warm, protective blanket.

These variables matter far more than the binary “renting bad, buying good” arguments people love to shout.

## How It’s Built (And Why It’s Honest)

The simulator is all sliders, no agenda. Change an assumption, watch the model reroute itself, feel the quiet existential dread that accompanies big financial decisions, but with clarity this time.

Under the hood it uses **Python + NumPy** for the math, **Matplotlib** for visuals, and **Streamlit** to make it interactive. A **Monte Carlo engine** with 1000 iterations introduces market volatility, because life is rarely linear, and neither are prices.

Inputs cover everything that actually matters: home price, down payment, interest rate, tax bracket, maintenance, rent levels, rent inflation, expected appreciation, stock/bond return assumptions, even mortgage interest deduction if you live somewhere that still believes in that.

Outputs include net worth for both scenarios, break-even timelines, sensitivity analyses, and probability distributions, so you don’t just get a single answer; you get a map of how reality might unfold.

## Sample Scenario

For a ¥40M home, 20 percent down, 1.9 percent mortgage, 0.5 percent annual rent growth, and 10 percent investment returns:

- Renting stays ahead every year across a 25-year horizon.  
- The projected net worth gap by year 25 is about 210.8M in favor of renting.

Dial up appreciation or slow investment returns and buying may recover; crank rent inflation and it can flip too. The simulator exists so you can see exactly when (or if) that crossover happens instead of guessing.

[View on GitHub](https://github.com/nikolaosJP/Projects/tree/main/Rent-vs-Buy-Simulator)
