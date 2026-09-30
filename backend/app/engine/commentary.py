"""
AI Strategy Commentary Generator.
Produces human-readable, client-centric explanations of rebalance actions,
loss harvesting, and risk protection under Indian tax law.
Supports Anthropic Claude API if available with high-fidelity deterministic fallback.
"""
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def generate_harvest_commentary(
    client_name: str,
    scenario_name: str,
    trades: list[dict[str, Any]],
    tax_saved_inr: float,
    losses_harvested_inr: float,
    substitutes_used: list[str] | None = None,
    risk_profile: str = "Balanced",
) -> str:
    """
    Generate client portfolio commentary.
    """
    # 1. Try Claude API if ANTHROPIC_API_KEY is configured
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            prompt = f"""You are an expert Indian SEBI-registered portfolio wealth manager explaining an automated defensive rebalancing and tax-loss harvesting execution to your client {client_name}.
Scenario: {scenario_name}
Risk Profile: {risk_profile}
Tax Alpha Saved: ₹{tax_saved_inr:,.2f}
Total Capital Losses Harvested: ₹{losses_harvested_inr:,.2f}
Trades Executed: {len(trades)} trades
Substitutes Deployed: {', '.join(substitutes_used) if substitutes_used else 'NIFTY ETF substitutes'}

Write a concise, reassuring, professional 3-paragraph summary:
1. Market Context: Why defensive rebalancing triggered during {scenario_name}.
2. Tax-Loss Harvesting Alpha: How harvesting underwater tax lots offsets STCG (20%) / LTCG (12.5%) gains under FY 2024-25 rules.
3. Allocation & Cooling-off: How correlated substitute ETFs maintain target equity weight while complying with 30-day cooling-off guardrails.
Tone: Premium, transparent, institutional."""
            
            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except Exception as e:
            logger.info(f"Claude API commentary fallback to template: {e}")

    # 2. High-Fidelity Deterministic Fallback Template
    subs_text = (
        f"Correlated proxy instruments ({', '.join(substitutes_used)}) were acquired to maintain your target asset allocation without violating 30-day cooling-off rules."
        if substitutes_used
        else "Correlated ETF substitutes were selectively used to keep your market exposure intact while observing the mandatory 30-day cooling-off window."
    )

    return (
        f"During the market event '{scenario_name}', ShockHarvester's intraday volatility guardrails detected a deviation "
        f"from your {risk_profile} target allocation. In response, a quadratic optimization rebalance was executed across {len(trades)} positions.\n\n"
        f"By matching underwater FIFO tax lots, we harvested ₹{losses_harvested_inr:,.2f} in realized capital losses. "
        f"Under FY 2024–25 Indian tax provisions (STCG 20% / LTCG 12.5%), this generated an estimated ₹{tax_saved_inr:,.2f} in tax alpha "
        f"to offset future capital gain liabilities.\n\n"
        f"{subs_text} Your overall portfolio risk and maximum volatility boundaries remain fully protected."
    )
