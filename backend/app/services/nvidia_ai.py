import httpx
import logging
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger("nvidia_ai")

SYSTEM_PROMPT = """You are AgriSmart AI, a world-class agricultural expert assistant tailored for Indian farmers, specifically in Andhra Pradesh and across India.
Your mission is to provide accurate, concise, practical, and empathetic farming advice in simple language.

Context provided includes:
- Location: Village, Mandal, District, State
- Farm Acreage & Coordinates
- Soil pH & Soil Type
- Current & Forecast Weather
- Current & Past Crops, Water Availability

Guidelines:
1. Always give actionable, grounded farming recommendations.
2. Explain 'why' behind recommendations.
3. Keep response readable, direct, and encouraging.
4. Respond in the requested language (English, Telugu, Hindi, etc.).
"""

class NVIDIAAIService:
    def __init__(self):
        self.api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL.rstrip('/')
        self.model = settings.NVIDIA_MODEL

    async def generate_agricultural_answer(
        self,
        question: str,
        farm_context: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Calls NVIDIA API chat completions with farm context and fallback."""
        
        context_str = ""
        if farm_context:
            context_str = (
                f"\n--- FARM CONTEXT ---\n"
                f"Farm Name: {farm_context.get('farm_name', 'My Farm')}\n"
                f"Location: {farm_context.get('village', '')}, {farm_context.get('district', '')}, {farm_context.get('state', 'Andhra Pradesh')}\n"
                f"Acreage: {farm_context.get('acreage', 'N/A')} acres\n"
                f"Soil pH: {farm_context.get('soil_ph', 'Not specified')}\n"
                f"Soil Type: {farm_context.get('soil_type', 'Loamy')}\n"
                f"Water Availability: {farm_context.get('water_availability', 'Moderate')}\n"
                f"Current Crops: {farm_context.get('current_crops', 'Paddy')}\n"
                f"Recent Weather: {farm_context.get('weather_summary', 'Partly Sunny')}\n"
                f"---------------------\n"
            )

        lang_instruction = f"Please answer in {language.upper()} language." if language != "en" else ""
        full_user_prompt = f"{context_str}\nFarmer Question: {question}\n{lang_instruction}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": full_user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 800
        }

        # Attempt calling NVIDIA API
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    answer_text = data['choices'][0]['message']['content']
                    return {
                        "question": question,
                        "answer": answer_text,
                        "language": language,
                        "recommendations": [
                            "Maintain optimal field drainage.",
                            "Check soil pH regularly before fertilizer application.",
                            "Consult local extension officer for severe pest threats."
                        ],
                        "evidence": "NVIDIA AI Generative Insights + Local AP Agri Data"
                    }
                else:
                    logger.warning(f"NVIDIA API status code {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"NVIDIA AI API Error: {str(e)}")

        # Rule-based fallback if NVIDIA API fails or is unreachable
        return self._rule_based_fallback(question, farm_context, language)

    def _rule_based_fallback(self, question: str, farm_context: Optional[Dict[str, Any]], language: str) -> Dict[str, Any]:
        """Provides expert deterministic agricultural responses when offline or on API failure."""
        q_lower = question.lower()
        village = farm_context.get("village", "your village") if farm_context else "your village"
        district = farm_context.get("district", "your district") if farm_context else "your district"
        ph = farm_context.get("soil_ph", 6.5) if farm_context else 6.5

        if "weather" in q_lower or "rain" in q_lower:
            answer = (
                f"For {village}, {district}, modern forecasts indicate seasonal precipitation patterns. "
                "Keep field bunds intact to capture rainwater and monitor irrigation requirements closely."
            )
        elif "soil" in q_lower or "ph" in q_lower or "fertilizer" in q_lower:
            answer = (
                f"Your farm's soil pH is recorded at {ph}. For pH between 6.0 and 7.0, NPK nutrients are highly absorbable. "
                "Apply organic compost or bio-fertilizers like Azospirillum along with recommended DAP/Urea split doses."
            )
        elif "crop" in q_lower or "seed" in q_lower or "recommend" in q_lower:
            answer = (
                f"Based on conditions in {district}, high-yielding crops include Paddy (BPT 5204 / MTU 1061), Maize, Chilli, and Pulses. "
                "Ensure proper row spacing (20cm x 15cm for Paddy) and balanced nutrient management."
            )
        elif "pest" in q_lower or "disease" in q_lower or "insects" in q_lower:
            answer = (
                "For common pests like Stem Borer or Planthoppers, maintain alternate wetting and drying in paddy fields. "
                "Use neem oil (10,000 ppm) spray as an eco-friendly preventive measure."
            )
        else:
            answer = (
                f"Hello! For your farm in {village}, {district}, ensure balanced irrigation and soil health management. "
                "Feel free to ask about crop selection, fertilizer doses, pest control, or weather forecasts!"
            )

        return {
            "question": question,
            "answer": answer,
            "language": language,
            "recommendations": [
                "Monitor crop health weekly.",
                "Ensure effective field water management.",
                "Test soil sample at nearby lab annually."
            ],
            "evidence": "AgriSmart Knowledge Base (Fallback Engine)"
        }

nvidia_ai_service = NVIDIAAIService()
