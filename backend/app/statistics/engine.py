import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from decimal import Decimal


class StatisticalEngine:
    """Motor matemático y estadístico para SalesIA Enterprise (Semana 07).
    
    Implementa cálculos determinísticos verificables con NumPy, Pandas y SciPy.
    """

    @staticmethod
    def calculate_mean(values: List[float]) -> Dict[str, Any]:
        """Calcula la media aritmética: sum(x) / n.
        
        Valida que la muestra no esté vacía y no contenga valores infinitos o NaN.
        """
        if not values:
            raise ValueError("El conjunto de datos no puede estar vacío.")

        arr = np.array(values, dtype=np.float64)
        clean_arr = arr[~np.isnan(arr)]
        
        if len(clean_arr) == 0:
            raise ValueError("No existen observaciones numéricas válidas en la muestra.")

        n = len(clean_arr)
        total_sum = float(np.sum(clean_arr))
        mean_val = float(np.mean(clean_arr))

        return {
            "sample_size": n,
            "sum": round(total_sum, 4),
            "mean": round(mean_val, 4),
            "formula": "media = sum(x) / n",
            "explanation": f"Suma de {n} observaciones ({round(total_sum, 2)}) dividida entre el tamaño muestral ({n})."
        }

    @staticmethod
    def calculate_median(values: List[float]) -> Dict[str, Any]:
        """Calcula la mediana ordenando las observaciones:
        - Si n es impar: valor central.
        - Si n es par: promedio de los dos valores centrales.
        """
        if not values:
            raise ValueError("El conjunto de datos no puede estar vacío.")

        arr = np.array(values, dtype=np.float64)
        clean_arr = arr[~np.isnan(arr)]
        
        if len(clean_arr) == 0:
            raise ValueError("No existen observaciones válidas.")

        sorted_vals = np.sort(clean_arr)
        n = len(sorted_vals)
        median_val = float(np.median(sorted_vals))

        is_even = (n % 2 == 0)
        central_indices = [n // 2 - 1, n // 2] if is_even else [n // 2]
        central_values = [round(float(sorted_vals[i]), 4) for i in central_indices]

        explanation = (
            f"Muestra par (n={n}): promedio de los dos valores centrales ({central_values[0]} y {central_values[1]})."
            if is_even else
            f"Muestra impar (n={n}): valor en la posición central ({central_values[0]})."
        )

        return {
            "sample_size": n,
            "is_even": is_even,
            "central_values": central_values,
            "median": round(median_val, 4),
            "min_value": round(float(sorted_vals[0]), 4),
            "max_value": round(float(sorted_vals[-1]), 4),
            "explanation": explanation
        }

    @staticmethod
    def compare_mean_and_median(values: List[float]) -> Dict[str, Any]:
        """Compara la media y la mediana para evaluar asimetría en la distribución comercial."""
        mean_res = StatisticalEngine.calculate_mean(values)
        median_res = StatisticalEngine.calculate_median(values)

        mean_val = mean_res["mean"]
        median_val = median_res["median"]
        diff = mean_val - median_val

        # Disparidad porcentual respecto a la mediana (o media si mediana es cero)
        base = median_val if abs(median_val) > 1e-6 else mean_val
        relative_diff_pct = (diff / base * 100.0) if abs(base) > 1e-6 else 0.0

        # Interpretación prudente basada en los fundamentos del PDF
        if abs(relative_diff_pct) < 5.0:
            distribution_shape = "Aproximadamente simétrica"
            interpretation = (
                "La media y la mediana son muy cercanas (diferencia < 5%). "
                "Los valores atípicos tienen un impacto mínimo en la muestra comercial."
            )
        elif diff > 0:
            distribution_shape = "Sesgo positivo (asimetría a la derecha)"
            interpretation = (
                f"La media ({mean_val}) es superior a la mediana ({median_val}) por {round(diff, 2)} (+{round(relative_diff_pct, 1)}%). "
                "Esto sugiere la presencia de ventas u operaciones de monto excepcionalmente alto que elevan el promedio."
            )
        else:
            distribution_shape = "Sesgo negativo (asimetría a la izquierda)"
            interpretation = (
                f"La media ({mean_val}) es menor que la mediana ({median_val}) por {round(abs(diff), 2)} ({round(relative_diff_pct, 1)}%). "
                "Esto indica una concentración de transacciones en la parte superior con algunas operaciones de monto reducido."
            )

        return {
            "sample_size": mean_res["sample_size"],
            "mean": mean_val,
            "median": median_val,
            "difference": round(diff, 4),
            "relative_difference_pct": round(relative_diff_pct, 2),
            "distribution_shape": distribution_shape,
            "interpretation": interpretation
        }

    @staticmethod
    def analyze_random_variable(observations: List[Any], variable_name: str, variable_type: str = "QUANTITATIVE_DISCRETE") -> Dict[str, Any]:
        """Modela una variable aleatoria comercial calculando soporte, frecuencias y distribución empírica."""
        if not observations:
            raise ValueError("No se proporcionaron observaciones para la variable.")

        series = pd.Series(observations)
        n = len(series)
        freq_counts = series.value_counts().sort_index()
        
        distribution = []
        expected_value = 0.0
        can_calculate_expected = (variable_type in ["QUANTITATIVE_DISCRETE", "QUANTITATIVE_CONTINUOUS"])

        for val, count in freq_counts.items():
            prob = float(count / n)
            item = {
                "value": str(val) if not isinstance(val, (int, float, np.number)) else float(val),
                "frequency": int(count),
                "probability": round(prob, 4)
            }
            distribution.append(item)
            if can_calculate_expected:
                try:
                    expected_value += float(val) * prob
                except Exception:
                    can_calculate_expected = False

        result = {
            "variable_name": variable_name,
            "variable_type": variable_type,
            "total_observations": n,
            "support_size": len(freq_counts),
            "distribution": distribution,
        }

        if can_calculate_expected:
            result["expected_value"] = round(expected_value, 4)
            result["explanation"] = f"Valor esperado E[X] = sum(x * P(x)) = {round(expected_value, 2)}."

        return result

    @staticmethod
    def calculate_bayes(
        prior_prob_a: float,
        likelihood_b_given_a: float,
        marginal_prob_b: float,
        event_a_name: str = "Evento A (Hipótesis)",
        event_b_name: str = "Evento B (Evidencia)"
    ) -> Dict[str, Any]:
        """Calcula el Teorema de Bayes:
        P(A|B) = [P(B|A) * P(A)] / P(B)
        
        Aplica validaciones matemáticas estrictas:
        - 0 <= P(A), P(B|A), P(B) <= 1
        - P(B) > 0
        - P(B|A) * P(A) <= P(B)
        """
        for name, val in [("P(A)", prior_prob_a), ("P(B|A)", likelihood_b_given_a), ("P(B)", marginal_prob_b)]:
            if not (0.0 <= val <= 1.0):
                raise ValueError(f"La probabilidad {name} debe encontrarse entre 0 y 1. Valor recibido: {val}")

        if marginal_prob_b <= 0.0:
            raise ValueError("El denominador P(B) debe ser estrictamente mayor que cero.")

        numerator = likelihood_b_given_a * prior_prob_a
        if numerator > marginal_prob_b + 1e-7:
            raise ValueError(
                f"Incoherencia probabilística: P(B|A)*P(A) ({round(numerator, 4)}) no puede superar la probabilidad marginal P(B) ({round(marginal_prob_b, 4)})."
            )

        posterior_prob = float(np.clip(numerator / marginal_prob_b, 0.0, 1.0))

        steps = (
            f"1. Probabilidad a priori: P({event_a_name}) = {prior_prob_a:.4f}\n"
            f"2. Verosimilitud: P({event_b_name} | {event_a_name}) = {likelihood_b_given_a:.4f}\n"
            f"3. Probabilidad marginal: P({event_b_name}) = {marginal_prob_b:.4f}\n"
            f"4. Numerador: P({event_b_name} | {event_a_name}) × P({event_a_name}) = {numerator:.4f}\n"
            f"5. P({event_a_name} | {event_b_name}) = {numerator:.4f} / {marginal_prob_b:.4f} = {posterior_prob:.4f}"
        )

        verbal_interpretation = (
            f"Dada la ocurrencia de '{event_b_name}', la probabilidad actualizada de '{event_a_name}' "
            f"se ajusta de {prior_prob_a * 100:.2f}% (a priori) a {posterior_prob * 100:.2f}% (a posteriori)."
        )

        return {
            "event_a_name": event_a_name,
            "event_b_name": event_b_name,
            "prior_prob_a": round(prior_prob_a, 4),
            "likelihood_b_given_a": round(likelihood_b_given_a, 4),
            "marginal_prob_b": round(marginal_prob_b, 4),
            "posterior_prob_a_given_b": round(posterior_prob, 4),
            "calculation_steps": steps,
            "verbal_interpretation": verbal_interpretation
        }
