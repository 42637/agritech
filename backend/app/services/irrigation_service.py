from typing import Dict, Any

CROP_WATER_SPECS: Dict[str, Dict[str, Any]] = {
    "Paddy": {
        "stage": "Vegetative Stage",
        "depth_min": 25,
        "depth_max": 30,
        "frequency_days": 5,
        "next_date": "16 Aug 2024",
        "temp": 32,
        "rainfall_7d": 0,
        "humidity": 58,
        "weather": "Clear",
        "why": "No significant rainfall for the last 7 days and high temperature. Paddy at vegetative stage requires regular irrigation to maintain soil moisture.",
        "advice": [
            "Irrigate early morning or evening to reduce evaporation.",
            "Maintain field bunds to retain water.",
            "Avoid over-irrigation to prevent nutrient loss."
        ]
    },
    "Maize": {
        "stage": "Knee-High Stage",
        "depth_min": 18,
        "depth_max": 22,
        "frequency_days": 6,
        "next_date": "17 Aug 2024",
        "temp": 32,
        "rainfall_7d": 0,
        "humidity": 55,
        "weather": "Sunny",
        "why": "Maize requires moderate soil moisture at knee-high vegetative stage. Warm temperatures increase transpiration.",
        "advice": [
            "Ensure ridge irrigation or drip lateral placement.",
            "Avoid waterlogging near root collar."
        ]
    },
    "Groundnut": {
        "stage": "Pegging Stage",
        "depth_min": 15,
        "depth_max": 18,
        "frequency_days": 7,
        "next_date": "18 Aug 2024",
        "temp": 33,
        "rainfall_7d": 0,
        "humidity": 50,
        "weather": "Clear",
        "why": "Pegging stage is critical for pod formation. Light sprinkler or drip irrigation recommended.",
        "advice": [
            "Maintain optimum topsoil looseness for peg entry.",
            "Irrigate during evening hours."
        ]
    },
    "Chilli": {
        "stage": "Flowering & Pod Set",
        "depth_min": 18,
        "depth_max": 22,
        "frequency_days": 5,
        "next_date": "16 Aug 2024",
        "temp": 32,
        "rainfall_7d": 0,
        "humidity": 60,
        "weather": "Clear",
        "why": "Chilli crops at flowering stage are sensitive to drought stress. Consistent drip irrigation prevents flower drop.",
        "advice": [
            "Use drip irrigation with fertigation.",
            "Avoid overhead splashing to prevent fungal leaf spot."
        ]
    }
}

class IrrigationService:
    def calculate_plan(self, crop: str, acreage: float, water_source: str, stage: str = "Vegetative Stage") -> Dict[str, Any]:
        spec = CROP_WATER_SPECS.get(crop, CROP_WATER_SPECS["Paddy"])

        min_depth = spec["depth_min"]
        max_depth = spec["depth_max"]

        # Liter calculation: 1 mm over 1 acre = 4,047 liters
        min_liters = min_depth * acreage * 4047
        max_liters = max_depth * acreage * 4047

        min_lakh = round(min_liters / 100000, 1)
        max_lakh = round(max_liters / 100000, 1)

        return {
            "crop": crop,
            "stage": stage or spec["stage"],
            "acreage": acreage,
            "water_source": water_source,
            "depth_min": min_depth,
            "depth_max": max_depth,
            "volume_label": f"≈ {min_lakh} – {max_lakh} lakh liters for {acreage} acres",
            "frequency_days": spec["frequency_days"],
            "next_date": spec["next_date"],
            "temp": spec["temp"],
            "rainfall_7d": spec["rainfall_7d"],
            "humidity": spec["humidity"],
            "weather": spec["weather"],
            "why_recommendation": spec["why"],
            "additional_advice": spec["advice"]
        }

irrigation_service = IrrigationService()
