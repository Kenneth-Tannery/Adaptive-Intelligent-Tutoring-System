from typing import Dict

DEFAULT_BKT_PARAMS: Dict[str, float] = {
    "guess": 0.2,
    "slip": 0.1,
    "transit": 0.15,
}


def _clamp_prob(value: float) -> float:
    if value is None:
        return 0.0
    if value < 0.0:
        return 0.0
    if value > 1.0:
        return 1.0
    return float(value)


def update_mastery(
    prior: float,
    correct: bool,
    guess: float = DEFAULT_BKT_PARAMS["guess"],
    slip: float = DEFAULT_BKT_PARAMS["slip"],
    transit: float = DEFAULT_BKT_PARAMS["transit"],
) -> float:
    prior = _clamp_prob(prior)
    guess = _clamp_prob(guess)
    slip = _clamp_prob(slip)
    transit = _clamp_prob(transit)

    if correct:
        numerator = prior * (1.0 - slip)
        denominator = numerator + (1.0 - prior) * guess
    else:
        numerator = prior * slip
        denominator = numerator + (1.0 - prior) * (1.0 - guess)

    posterior = prior if denominator == 0 else numerator / denominator
    next_mastery = posterior + (1.0 - posterior) * transit
    return _clamp_prob(next_mastery)


def main() -> None:
    print("bkt module ready")


if __name__ == "__main__":
    main()
