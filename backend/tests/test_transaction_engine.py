import pytest
from app.services.transaction_engine import TransactionIntelligenceEngine


def test_z_score_calculation():
    engine = TransactionIntelligenceEngine()
    # Mean 1000, std 200, amount 1600 -> z = (1600 - 1000) / 200 = 3.0
    z = engine.calculate_z_score(1600.0, 1000.0, 200.0)
    assert z == 3.0

    # Normal amount equals mean -> z = 0.0
    z_zero = engine.calculate_z_score(1000.0, 1000.0, 200.0)
    assert z_zero == 0.0


def test_iqr_outlier_factor():
    engine = TransactionIntelligenceEngine()
    amounts = [100.0, 200.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0]
    outlier = 5000.0
    iqr_fac = engine.calculate_iqr_outlier_factor(outlier, amounts)
    assert iqr_fac > 2.0
