"""
Tax rules configuration loader.
Reads config/tax_rules.yaml and validates with Pydantic v2.
"""
from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, Field


class TaxRules(BaseModel):
    """Validated tax and regulatory configuration."""

    # Capital gains rates
    stcg_rate: float = Field(ge=0.0, le=1.0)
    ltcg_rate: float = Field(ge=0.0, le=1.0)
    ltcg_annual_exemption_inr: float = Field(ge=0.0)

    # Holding period
    long_term_holding_days: int = Field(ge=1)

    # Transaction costs
    stt_delivery_buy: float = Field(ge=0.0, le=0.05)
    stt_delivery_sell: float = Field(ge=0.0, le=0.05)
    brokerage_rate: float = Field(ge=0.0, le=0.05)

    # Harvesting
    cooling_off_days: int = Field(ge=0, le=365)

    # Circuit bands
    circuit_band_options: list[float]
    index_circuit_levels: list[float]

    # Set-off rules
    setoff_stloss_offsets: list[str]
    setoff_ltloss_offsets: list[str]

    # Optimizer weights
    lambda_tax: float = Field(ge=0.0, default=0.5)
    lambda_transaction: float = Field(ge=0.0, default=0.3)
    lambda_harvest: float = Field(ge=0.0, default=0.4)
    turnover_cap_per_asset: float = Field(ge=0.0, le=1.0, default=0.30)

    @property
    def total_transaction_cost(self) -> float:
        """Combined one-way transaction cost fraction."""
        return self.stt_delivery_sell + self.brokerage_rate


@lru_cache()
def get_tax_rules() -> TaxRules:
    """Load and cache tax rules from YAML config."""
    config_path = Path(__file__).parent.parent / "config" / "tax_rules.yaml"
    with open(config_path) as f:
        data = yaml.safe_load(f)
    return TaxRules(**data)


tax_rules = get_tax_rules()
