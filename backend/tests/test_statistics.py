import pytest
from app.statistics.engine import StatisticalEngine


def test_calculate_mean():
    values = [10.0, 20.0, 30.0, 40.0]
    res = StatisticalEngine.calculate_mean(values)
    assert res["mean"] == 25.0
    assert res["sample_size"] == 4
    assert res["sum"] == 100.0


def test_calculate_mean_empty():
    with pytest.raises(ValueError):
        StatisticalEngine.calculate_mean([])


def test_calculate_median_odd():
    values = [50.0, 10.0, 30.0]
    res = StatisticalEngine.calculate_median(values)
    assert res["median"] == 30.0
    assert res["is_even"] is False


def test_calculate_median_even():
    values = [10.0, 20.0, 30.0, 40.0]
    res = StatisticalEngine.calculate_median(values)
    assert res["median"] == 25.0
    assert res["is_even"] is True
    assert res["central_values"] == [20.0, 30.0]


def test_compare_mean_and_median():
    # Asimetría positiva por outlier
    values = [10.0, 12.0, 11.0, 10.0, 100.0]
    res = StatisticalEngine.compare_mean_and_median(values)
    assert res["mean"] > res["median"]
    assert "Sesgo positivo" in res["distribution_shape"]


def test_calculate_bayes_valid():
    # P(A) = 0.20 (compra producto premium)
    # P(B|A) = 0.80 (recibió descuento dado que compró premium)
    # P(B) = 0.40 (tasa global de descuento)
    # P(A|B) = (0.80 * 0.20) / 0.40 = 0.16 / 0.40 = 0.40
    res = StatisticalEngine.calculate_bayes(
        prior_prob_a=0.20,
        likelihood_b_given_a=0.80,
        marginal_prob_b=0.40,
        event_a_name="Compra Premium",
        event_b_name="Recibe Descuento"
    )
    assert res["posterior_prob_a_given_b"] == 0.40
    assert "0.4000" in res["calculation_steps"]


def test_calculate_bayes_invalid_denominator():
    with pytest.raises(ValueError, match="mayor que cero"):
        StatisticalEngine.calculate_bayes(
            prior_prob_a=0.30,
            likelihood_b_given_a=0.50,
            marginal_prob_b=0.0
        )


def test_calculate_bayes_incoherent_probabilities():
    # P(B|A)*P(A) > P(B) -> imposible
    with pytest.raises(ValueError, match="Incoherencia"):
        StatisticalEngine.calculate_bayes(
            prior_prob_a=0.90,
            likelihood_b_given_a=0.90,
            marginal_prob_b=0.50
        )
