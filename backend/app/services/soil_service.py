from typing import Dict, Any, List

class SoilService:
    def analyze_soil(
        self,
        ph: float,
        soil_type: str = "Loamy",
        water_availability: str = "Moderate",
        district: str = "West Godavari"
    ) -> Dict[str, Any]:
        """Analyzes soil pH and generates agricultural guidance and crop recommendations."""
        
        # pH interpretation
        if ph < 5.5:
            ph_category = "Strongly Acidic"
            ph_status = "May restrict phosphorus availability. Consider agricultural lime application."
        elif 5.5 <= ph < 6.5:
            ph_category = "Slightly Acidic"
            ph_status = "Slightly acidic (suitable for many crops)"
        elif 6.5 <= ph <= 7.5:
            ph_category = "Neutral"
            ph_status = "Optimal neutral soil pH (highly suitable for most crops)"
        elif 7.5 < ph <= 8.5:
            ph_category = "Slightly Alkaline"
            ph_status = "Slightly alkaline. Ensure micro-nutrient (Zinc/Iron) application."
        else:
            ph_category = "Strongly Alkaline"
            ph_status = "High alkalinity. Organic manure and gypsum treatment advised."

        # Soil Guidance items
        guidance = [
            {
                "title": "Check pH against your crop's preferred range",
                "message": "Different crops grow well in different pH ranges. Paddy and maize thrive well in slightly acidic to neutral soils.",
                "action": "View Crop pH Chart"
            },
            {
                "title": "Use recent soil-test NPK values for nutrient advice",
                "message": "pH is only one part of soil health. Ensure balanced Nitrogen, Phosphorus, and Potassium (NPK) fertilization.",
                "action": "View NPK Advice"
            },
            {
                "title": "Consider rainfall and water availability before irrigation",
                "message": "Soil moisture and recent rainfall affect nutrient availability and root uptake.",
                "action": "Check Irrigation Plan"
            }
        ]

        # Recommended crops with preferences matching Reference Image 3
        crops = [
            {
                "id": "paddy",
                "name": "Paddy",
                "suitability": "Highly Suitable",
                "reason": "Suitable in current season and pH range",
                "preferred_ph": "5.5 - 7.0",
                "water_need": "High",
                "icon": "sprout",
                "color": "green"
            },
            {
                "id": "maize",
                "name": "Maize",
                "suitability": "Highly Suitable",
                "reason": "Suitable in current season and pH range",
                "preferred_ph": "6.0 - 7.5",
                "water_need": "Moderate",
                "icon": "corn",
                "color": "amber"
            },
            {
                "id": "groundnut",
                "name": "Groundnut",
                "suitability": "Suitable",
                "reason": "Suitable in current season and pH range",
                "preferred_ph": "6.0 - 7.0",
                "water_need": "Moderate",
                "icon": "peanut",
                "color": "brown"
            },
            {
                "id": "chilli",
                "name": "Chilli",
                "suitability": "Suitable",
                "reason": "Well suited for well-drained loamy soils",
                "preferred_ph": "6.0 - 7.0",
                "water_need": "Moderate",
                "icon": "chilli",
                "color": "red"
            },
            {
                "id": "pulses",
                "name": "Pulses (Blackgram)",
                "suitability": "Suitable",
                "reason": "Fixes nitrogen and improves soil fertility",
                "preferred_ph": "6.5 - 7.5",
                "water_need": "Low",
                "icon": "beans",
                "color": "emerald"
            }
        ]

        return {
            "ph": ph,
            "ph_category": ph_category,
            "ph_status": ph_status,
            "last_updated": "12 Aug 2024",
            "farm_factors": {
                "soil_type": soil_type,
                "water_availability": water_availability,
                "recent_rainfall": "42 mm (last 30 days)",
                "season": "Kharif (Jun - Sep)",
                "past_crops": "Paddy, Maize (last 3 years)",
                "recent_fertilizers": "Urea, DAP (last 6 months)"
            },
            "guidance": guidance,
            "recommended_crops": crops
        }

soil_service = SoilService()
