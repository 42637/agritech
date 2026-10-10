import logging
import json
import base64
import urllib.request
import re
import unicodedata
import asyncio
import urllib.error
from datetime import date
from typing import Dict, Any, Optional, Tuple
from ..config import settings

logger = logging.getLogger("gemini_ai")

SYSTEM_PROMPT = """You are AgriSmart AI, a world-class agricultural expert assistant tailored for Indian farmers (specifically in Andhra Pradesh & across India).

CRITICAL DOMAIN GUARDRAIL RULES:
1. Your domain is EXCLUSIVELY agriculture, crop cultivation, farming, soil health, fertilizers, pest and disease management, weather advisories, irrigation, livestock, agricultural prices, and government farming schemes.
2. If the user asks a question that is COMPLETELY UNRELATED to agriculture, farming, crops, soil, weather, or livestock (such as general politics, who is PM/President, movies, actors, sports, cricket, or general non-farming trivia), you MUST POLITELY DECLINE to answer the off-topic question.
   When declining, respond with:
   "Namaste! As AgriSmart AI, I am specialized exclusively in agriculture and farming guidance. Please ask me any questions about your crops, soil, fertilizers, pest management, or weather advisories."
3. For ALL agricultural and farming questions (including questions about regional crops across India like Kashmir, Andhra Pradesh, Punjab, Kerala, etc., crop protection, soil pH, or fertilizers), provide detailed, accurate, empathetic, and practical farming advice in simple language.
"""

class GeminiAIService:
    def __init__(self):
        # API credentials are supplied only through the local environment.
        self.api_key = settings.GEMINI_API_KEY
        self.primary_model = "gemini-3.5-flash-lite"
        self.fallback_model = "gemini-3.8-flash"

    async def generate_irrigation_actions(
        self,
        farm: Dict[str, Any],
        crop: str,
        stage: str,
        water_source: str,
        weather: Dict[str, Any],
        baseline: Dict[str, Any],
        field_update: Optional[Dict[str, Any]],
        language: str = "en",
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        """Return a weather-aware 7-day field plan as validated structured JSON."""
        api_key = (settings.GEMINI_API_KEY or "").strip()
        if not api_key:
            return None, "missing_key"

        language_name = {"en": "English", "te": "Telugu", "hi": "Hindi"}.get(language, "English")
        schema = {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "cultivation_plan": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "stage": {"type": "string"},
                            "title": {"type": "string"},
                            "action": {"type": "string"},
                            "category": {"type": "string", "enum": ["irrigation", "scouting", "nutrition", "field_work"]},
                        },
                        "required": ["stage", "title", "action", "category"],
                    },
                },
                "pest_plan": {
                    "type": "object",
                    "properties": {
                        "headline": {"type": "string"},
                        "actions": {"type": "array", "items": {"type": "string"}},
                        "if_no_spray": {"type": "string"},
                        "next_check_date": {"type": "string"},
                    },
                    "required": ["headline", "actions", "if_no_spray", "next_check_date"],
                },
                "organic_fertilizers": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "timing": {"type": "string"},
                            "purpose": {"type": "string"},
                            "nutrient_profile": {"type": "string"},
                        },
                        "required": ["name", "timing", "purpose", "nutrient_profile"],
                    },
                },
            },
            "required": ["summary", "cultivation_plan", "pest_plan", "organic_fertilizers"],
        }
        today = date.today()
        prompt = f"""
You are an Indian crop advisory assistant. Write in {language_name}; keep dates, units, and JSON keys unchanged.
Today is {today.isoformat()}. Prepare a full crop-cycle milestone plan from the selected current stage through expected harvest, using the farmer's expected crop duration. Use only supplied facts; treat weather as a forecast, not certainty.
Do not invent soil measurements, pest observations, pesticide products, doses, or spray dates.
Never schedule a pesticide application. Recommend daily/regular scouting and non-chemical integrated pest management.
If the farmer reports a pest, ask them to verify the pest and damage with a local KVK/agriculture officer. Any chemical control must be chosen only after identification, checked against the current crop-and-pest label approved in India, and applied exactly as that label directs. Do not name a chemical or dose.
If no spray was used, state that the plan is still actionable: record crop condition, moisture, and pest signs, then reassess; do not compensate with an automatic spray.
Use irrigation depths from the supplied baseline only as provisional estimates. Shift or defer irrigation when useful rain is forecast; advise checking root-zone moisture before applying water.
For cultivation_plan, return exactly one item for each milestone in the supplied baseline cultivation_plan, in the same order and preserving each stage value. Do not omit stages. The dates and offsets are calculated by the application; focus on crop-safe, stage-relevant actions. State that duration is variety-dependent where appropriate.
For organic_fertilizers, return 2 or 3 generic organic input types suitable for this crop and current stage. Include a practical application window expressed as a crop stage or month (do not invent a calendar date), the purpose, and a general nutrient/material profile without percentages. Prefer mature compost/vermicompost and crop-matched biofertilizers where appropriate. Do not give rates, brand names, or unsupported product ingredients. Never claim a product is free of harmful chemicals or certified organic: exact formulation and contaminants require checking the selected package label and valid certification. Do not present a pesticide as fertilizer.

Farm: {farm.get('farm_name', 'Farm')} at {farm.get('village', '')}, {farm.get('district', '')}, {farm.get('state', 'Andhra Pradesh')}; area {farm.get('acreage', 0)} acres.
Crop: {crop}. Growth stage: {stage}. Water source/method: {water_source}.
Current weather and 7-day forecast: {json.dumps(weather, ensure_ascii=False)}
Provisional irrigation estimate: {json.dumps(baseline, ensure_ascii=False)}
Latest farmer field update: {json.dumps(field_update or {}, ensure_ascii=False)}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": 4096,
                "thinkingConfig": {"thinkingLevel": "low"},
                "responseMimeType": "application/json",
                "responseSchema": schema,
            },
        }
        try:
            models = list(dict.fromkeys([settings.GEMINI_MODEL, self.primary_model]))
            data = None
            used_fallback_model = False

            def send_request(model: str):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                request = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
                )
                with urllib.request.urlopen(request, timeout=20) as response:
                    return response.status, json.loads(response.read().decode("utf-8"))

            status = 0
            for model_index, model in enumerate(models):
                try:
                    status, data = await asyncio.to_thread(send_request, model)
                    used_fallback_model = model_index > 0
                    break
                except urllib.error.HTTPError as response:
                    try:
                        error_data = json.loads(response.read().decode("utf-8"))
                    except Exception:
                        error_data = {}
                    api_error = error_data.get("error", {}) if isinstance(error_data, dict) else {}
                    error_reason = f"{api_error.get('status', '')} {api_error.get('message', '')}".lower()
                    logger.warning("Gemini irrigation plan returned HTTP %s (%s) for %s", response.code, api_error.get("status", "unknown"), model)
                    if response.code == 429 and model_index + 1 < len(models):
                        logger.info("Gemini quota exhausted for primary model; retrying with %s", models[model_index + 1])
                        continue
                    if response.code in {401, 403} or "api_key_invalid" in error_reason or "api key not valid" in error_reason:
                        return None, "invalid_key"
                    if response.code == 429:
                        return None, "quota"
                    if response.code == 404:
                        return None, "model_not_found"
                    return None, f"api_error_{response.code}"
            if status != 200:
                logger.warning("Gemini irrigation plan returned HTTP %s", status)
                return None, "api_error"
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = next((part.get("text", "") for part in parts if part.get("text")), "")
            if not text:
                logger.warning("Gemini irrigation plan response contained no text")
                return None, "empty_response"
            parsed = json.loads(text)
            cultivation_plan = parsed.get("cultivation_plan")
            pest_plan = parsed.get("pest_plan")
            organic_fertilizers = parsed.get("organic_fertilizers")
            base_cycle = baseline.get("cultivation_plan", [])
            if (not isinstance(cultivation_plan, list) or len(cultivation_plan) != len(base_cycle)
                    or not isinstance(pest_plan, dict)
                    or not isinstance(organic_fertilizers, list) or not 2 <= len(organic_fertilizers) <= 3
                    or not isinstance(pest_plan.get("actions"), list) or len(pest_plan["actions"]) < 2
                    or not isinstance(pest_plan.get("headline"), str) or not pest_plan["headline"].strip()
                    or not isinstance(pest_plan.get("if_no_spray"), str) or not pest_plan["if_no_spray"].strip()):
                logger.warning("Gemini irrigation plan did not match the expected schema")
                return None, "invalid_response"
            for item in organic_fertilizers:
                if not isinstance(item, dict) or not all(isinstance(item.get(key), str) and item[key].strip() for key in ("name", "timing", "purpose", "nutrient_profile")):
                    return None, "invalid_response"
            for index, item in enumerate(cultivation_plan):
                expected = base_cycle[index]
                if item.get("category") not in {"irrigation", "scouting", "nutrition", "field_work"}:
                    return None, "invalid_response"
                # Keep dates and phase order grounded in the app's variety-duration estimate.
                item["stage"] = expected["stage"]
                item["date"] = expected["date"]
                item["days_from_now"] = expected["days_from_now"]
            # Keep pesticide products and doses out of generated advice even if the model ignores the prompt.
            unsafe = re.compile(r"\b(spray|pesticide|insecticide|fungicide|herbicide|\d+\s*(ml|g|kg|litre|liter))\b", re.I)
            for item in cultivation_plan:
                if unsafe.search(f"{item.get('title', '')} {item.get('action', '')}"):
                    return None, "unsafe_response"
            if unsafe.search(" ".join(pest_plan.get("actions", []))):
                return None, "unsafe_response"
            return parsed, "generated_fallback_model" if used_fallback_model else "generated"
        except urllib.error.URLError as error:
            if isinstance(error.reason, TimeoutError):
                logger.warning("Gemini irrigation plan timed out")
                return None, "timeout"
            logger.warning("Gemini irrigation plan network failure: %s", type(error.reason).__name__)
            return None, "network_error"
        except TimeoutError:
            logger.warning("Gemini irrigation plan timed out")
            return None, "timeout"
        except Exception as error:
            logger.warning("Gemini irrigation plan unavailable: %s", type(error).__name__)
            return None, "invalid_response"

    @staticmethod
    def _matches_requested_language(text: str, language: str) -> bool:
        """Reject clearly wrong-script answers (for example Malayalam for Telugu)."""
        ranges = {
            "te": (0x0C00, 0x0C7F),
            "hi": (0x0900, 0x097F),
        }
        if language == "en":
            letters = [char for char in text if unicodedata.category(char).startswith("L")]
            latin_letters = sum(ord(char) < 128 for char in letters)
            return latin_letters >= 8 and latin_letters / max(len(letters), 1) >= 0.65
        code_range = ranges.get(language)
        if not code_range:
            return False
        native_letters = 0
        other_indic_letters = 0
        all_letters = 0
        for char in text:
            if not unicodedata.category(char).startswith("L"):
                continue
            all_letters += 1
            codepoint = ord(char)
            if code_range[0] <= codepoint <= code_range[1]:
                native_letters += 1
            elif 0x0900 <= codepoint <= 0x0D7F:
                other_indic_letters += 1
        return native_letters >= 8 and other_indic_letters == 0 and native_letters / max(all_letters, 1) >= 0.65

    def transcribe_farmer_audio(self, audio: bytes, mime_type: str, language: str = "en") -> str:
        """Transcribe farmer audio using Sarvam AI Speech-to-Text API."""
        import uuid
        import os

        sarvam_key = getattr(settings, "SARVAM_API_KEY", "") or os.getenv("SARVAM_API_KEY") or "sk_weu5hd6x_iE1cVmwA66Ing0n2BRFYiaaK"
        if not sarvam_key:
            raise RuntimeError("Sarvam STT API key is not configured")

        lang_codes = {"te": "te-IN", "hi": "hi-IN", "en": "en-IN"}
        lang_code = lang_codes.get(language.lower(), "en-IN")

        url = "https://api.sarvam.ai/speech-to-text"
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"

        clean_mime = mime_type.split(";", 1)[0].strip().lower() if mime_type else "audio/webm"
        if clean_mime not in {"audio/wav", "audio/webm", "audio/mp4", "audio/m4a", "audio/ogg", "audio/mp3", "audio/mpeg"}:
            clean_mime = "audio/webm"

        ext = "webm"
        if "wav" in clean_mime: ext = "wav"
        elif "mp3" in clean_mime or "mpeg" in clean_mime: ext = "mp3"
        elif "mp4" in clean_mime or "m4a" in clean_mime: ext = "m4a"
        elif "ogg" in clean_mime: ext = "ogg"

        CRLF = b"\r\n"
        body_parts = []

        # File field
        body_parts.append(f"--{boundary}".encode() + CRLF)
        body_parts.append(f'Content-Disposition: form-data; name="file"; filename="farmer_voice.{ext}"'.encode() + CRLF)
        body_parts.append(f"Content-Type: {clean_mime}".encode() + CRLF)
        body_parts.append(CRLF)
        body_parts.append(audio + CRLF)

        # model field
        body_parts.append(f"--{boundary}".encode() + CRLF)
        body_parts.append(b'Content-Disposition: form-data; name="model"' + CRLF)
        body_parts.append(CRLF)
        body_parts.append(b"saaras:v3" + CRLF)

        # language_code field
        body_parts.append(f"--{boundary}".encode() + CRLF)
        body_parts.append(b'Content-Disposition: form-data; name="language_code"' + CRLF)
        body_parts.append(CRLF)
        body_parts.append(lang_code.encode() + CRLF)

        # Closing boundary
        body_parts.append(f"--{boundary}--".encode() + CRLF)

        payload = b"".join(body_parts)

        headers = {
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "api-subscription-key": sarvam_key,
        }

        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            transcript = data.get("transcript", "").strip()
            return transcript
        except urllib.error.HTTPError as err:
            try:
                err_body = err.read().decode("utf-8")
                logger.error("Sarvam STT HTTP %s: %s", err.code, err_body)
            except Exception:
                logger.error("Sarvam STT HTTP %s: %s", err.code, err.reason)
            return ""
        except Exception as err:
            logger.error("Sarvam STT Error: %s", err)
            return ""


    async def generate_agricultural_answer(
        self,
        question: str,
        farm_context: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Calls live Google Gemini API directly with semantic agricultural guardrails."""
        
        context_str = ""
        if farm_context:
            context_str = (
                f"\n--- FARM CONTEXT ---\n"
                f"Farm Name: {farm_context.get('farm_name', 'My Farm')}\n"
                f"Location: {farm_context.get('village', 'Bhimavaram')}, {farm_context.get('district', 'West Godavari')}, {farm_context.get('state', 'Andhra Pradesh')}\n"
                f"Acreage: {farm_context.get('acreage', 2.5)} acres\n"
                f"Soil pH: {farm_context.get('soil_ph', '6.5')}\n"
                f"Soil Type: {farm_context.get('soil_type', 'Loamy')}\n"
                f"Water Availability: {farm_context.get('water_availability', 'Moderate')}\n"
                f"Current Crops: {farm_context.get('current_crops', 'Paddy')}\n"
                f"---------------------\n"
            )

        language_names = {"en": "English", "te": "Telugu (తెలుగు)", "hi": "Hindi (हिंदी)"}
        selected_language = language.lower() if language.lower() in language_names else "en"
        lang_instruction = (
            f"\nMANDATORY RESPONSE LANGUAGE: {language_names[selected_language]}. "
            "Write the entire answer and every recommendation in this language using its native script. "
            "Do not use greetings or words from another Indian language, and do not include an English translation "
            "or English headings. First give a direct answer in 1-3 short farmer-friendly sentences. If useful, "
            "put up to three practical actions after it, each on its own line and numbered 1., 2., 3. Do not add "
            "a heading unless it is written in the selected language. Do not use Markdown bold or tables. Do not "
            "repeat explanatory facts in the action steps. "
            "Answer only what the farmer asked. Include farm details only when relevant to the question. Do not promise a yield "
            "or invent facts. Prefer common farmer vocabulary; keep technical names in parentheses only when useful."
        )
        full_user_prompt = f"{SYSTEM_PROMPT}\n{context_str}\nFarmer Question: {question}\n{lang_instruction}"

        # Try live Gemini API models; reject outputs in an unrelated script.
        for model in [self.primary_model, self.fallback_model, "gemini-3.6-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": full_user_prompt}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 1000
                    }
                }

                req_data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(
                    url,
                    data=req_data,
                    headers={'Content-Type': 'application/json', 'x-goog-api-key': self.api_key}
                )

                with urllib.request.urlopen(req, timeout=12) as res:
                    if res.status == 200:
                        data = json.loads(res.read().decode('utf-8'))
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                answer_text = parts[0].get("text", "")
                                if not self._matches_requested_language(answer_text, selected_language):
                                    logger.warning("Gemini returned the wrong script for requested language %s", selected_language)
                                    correction_prompt = (
                                        f"Rewrite the answer below fully in {language_names[selected_language]}, "
                                        "using that language's native script. No Malayalam, English translation, "
                                        "or other language. Preserve the farming facts and practical advice.\n\n"
                                        f"Answer to rewrite:\n{answer_text}"
                                    )
                                    correction_payload = {
                                        "contents": [{"parts": [{"text": correction_prompt}]}],
                                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1000},
                                    }
                                    correction_req = urllib.request.Request(
                                        url,
                                        data=json.dumps(correction_payload).encode("utf-8"),
                                        headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
                                    )
                                    try:
                                        with urllib.request.urlopen(correction_req, timeout=12) as correction_res:
                                            correction_data = json.loads(correction_res.read().decode("utf-8"))
                                            correction_parts = correction_data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                                            corrected = correction_parts[0].get("text", "").strip() if correction_parts else ""
                                            if self._matches_requested_language(corrected, selected_language):
                                                answer_text = corrected
                                            else:
                                                continue
                                    except Exception as correction_error:
                                        logger.warning("Gemini language correction failed: %s", correction_error)
                                        continue
                                recommendations = self._extract_recommendations(answer_text, selected_language)
                                return {
                                    "question": question,
                                    "answer": answer_text,
                                    "language": selected_language,
                                    "recommendations": recommendations,
                                    "evidence": f"Google Gemini API ({model})"
                                }
            except Exception as e:
                logger.warning(f"Gemini API model {model} attempt failed: {e}")

        # Basic fallback in case network connection to API is completely cut
        return {
            "question": question,
            "answer": ({
                "te": "మీ ప్రశ్నకు ప్రస్తుతం సమాధానం రూపొందించలేకపోయాను. దయచేసి పంటలు, నేల, ఎరువులు లేదా వాతావరణం గురించి మళ్లీ అడగండి.",
                "hi": "अभी आपके प्रश्न का उत्तर तैयार नहीं हो पाया। कृपया फसल, मिट्टी, उर्वरक या मौसम के बारे में फिर से पूछें।",
            }.get(selected_language) or "I could not prepare an answer just now. Please ask again about crops, soil, fertilizers, or weather."),
            "language": selected_language,
            "recommendations": ({
                "te": ["ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి", "వ్యవసాయ సంబంధిత ప్రశ్న అడగండి"],
                "hi": ["इंटरनेट कनेक्शन जाँचें", "कृषि से जुड़ा प्रश्न पूछें"],
            }.get(selected_language) or ["Check network connection", "Ask an agriculture question"]),
            "evidence": "Network Error"
        }

    async def generate_farm_insights(self, farm_context: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        """Generates dynamic AI insights for Farm Insights section powered by Gemini API."""
        language_name = {"en": "English", "te": "Telugu (తెలుగు)", "hi": "Hindi (हिंदी)"}.get(language, "English")
        prompt = f"""
Given farm details:
- Farm: {farm_context.get('farm_name', 'Bhimavaram Farm')}
- Location: {farm_context.get('village', 'Bhimavaram')}, {farm_context.get('district', 'West Godavari')}
- Acreage: {farm_context.get('acreage', 2.5)} acres
- Soil pH: {farm_context.get('soil_ph', 6.8)}
- Current Crop: {farm_context.get('current_crops', 'Paddy')}

Return strict JSON object with fields:
{{
  "quick_insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4"],
  "irrigation_tip": "Specific irrigation tip",
  "growth_tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],
  "comparison": "Yield comparison message"
}}
Return ONLY JSON.
Write every JSON string value in {language_name}, using its native script. Keep JSON keys unchanged and do not include English translations.
"""
        for model in [self.primary_model, self.fallback_model]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                req_data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json', 'x-goog-api-key': self.api_key})
                with urllib.request.urlopen(req, timeout=10) as res:
                    if res.status == 200:
                        txt = json.loads(res.read().decode('utf-8'))["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if txt.startswith("```json"):
                            txt = txt.replace("```json", "").replace("```", "").strip()
                        parsed = json.loads(txt)
                        text_values = []
                        for value in parsed.values():
                            text_values.extend(value if isinstance(value, list) else [value])
                        if all(isinstance(value, str) and self._matches_requested_language(value, language) for value in text_values):
                            return parsed
                        logger.warning("Gemini farm insights used the wrong script for %s", language)
            except Exception as e:
                logger.warning(f"Gemini insights error with {model}: {e}")

        # Simple structured return if offline
        ph = farm_context.get('soil_ph', 6.8) or 6.8
        fallback_insights = {
            "te": {
                "quick_insights": [
                    f"మీ నేల pH {ph}. పంటకు సరైన pH పరిధితో దీన్ని పోల్చండి.",
                    "పంట ఎదుగుదల దశకు తగిన నీటి మట్టాన్ని ఉంచండి.",
                    "నీరు పెట్టే ముందు నేల తేమను, వాతావరణ సూచనను చూడండి.",
                    "ఆకులు, కాండాలపై చీడపీడల లక్షణాలను గమనించండి.",
                ],
                "irrigation_tip": "నీటి ఆవిరి తగ్గేందుకు ఉదయం లేదా సాయంత్రం నీరు పెట్టండి.",
                "growth_tips": [
                    "పంట దశకు తగిన నీటి మట్టాన్ని కొనసాగించండి.",
                    "ఎరువులను సూచించిన మోతాదులో విడతలుగా వేయండి.",
                    "పంట ప్రారంభ దశలో కలుపును తొలగించండి.",
                    "పంటలో కనిపించే చీడపీడల లక్షణాలను తరచూ పరిశీలించండి.",
                ],
                "comparison": "దిగుబడిని పోల్చడానికి స్థానిక దిగుబడి సమాచారం అందుబాటులో లేదు.",
            },
            "hi": {
                "quick_insights": [
                    f"आपकी मिट्टी का pH {ph} है। इसे फसल के उपयुक्त pH से मिलाएँ।",
                    "फसल की अवस्था के अनुसार खेत में पानी का स्तर रखें।",
                    "सिंचाई से पहले मिट्टी की नमी और मौसम देखें।",
                    "पत्तियों और तनों पर कीट के लक्षण देखें।",
                ],
                "irrigation_tip": "पानी का वाष्पीकरण घटाने के लिए सुबह या शाम सिंचाई करें।",
                "growth_tips": [
                    "फसल की अवस्था के अनुसार पानी का स्तर बनाए रखें।",
                    "खाद की सुझाई गई मात्रा को किस्तों में दें।",
                    "शुरुआती अवस्था में खेत से खरपतवार हटाएँ।",
                    "फसल में कीट के लक्षणों की नियमित जाँच करें।",
                ],
                "comparison": "उपज की तुलना के लिए स्थानीय उपज का आँकड़ा उपलब्ध नहीं है।",
            },
        }
        if language in fallback_insights:
            return fallback_insights[language]
        return {
            "quick_insights": [
                f"Soil pH is {ph}. Compare it with the preferred range for your crop.",
                "Keep field water at the level recommended for the crop stage.",
                "Check soil moisture and the forecast before irrigating.",
                "Watch leaves and stems for signs of pests.",
            ],
            "irrigation_tip": "Irrigate in the morning or evening to reduce water loss.",
            "growth_tips": [
                "Maintain water levels suitable for the crop stage.",
                "Apply fertilizer in the recommended split doses.",
                "Remove weeds during early crop growth.",
                "Check crops regularly for visible pest symptoms.",
            ],
            "comparison": "Local yield data is unavailable for a reliable comparison.",
        }

    async def generate_climate_risk_analysis(
        self,
        farm_context: Dict[str, Any],
        weather_data: Dict[str, Any],
        period: str = "today",
        language: str = "en",
    ) -> Dict[str, Any]:
        """Generates dynamic AI climate risk analysis using live Gemini API based on farm context and climate forecast."""
        prompt = f"""
You are AgriSmart AI climate risk analyzer. Analyze the farm location, crop, and current weather/forecast data to output dynamic climate risk assessment.

FARM DETAILS:
- Farm Name: {farm_context.get('farm_name', 'My Farm')}
- Location: {farm_context.get('village', 'Bhimavaram')}, {farm_context.get('district', 'West Godavari')}, {farm_context.get('state', 'Andhra Pradesh')}
- Acreage: {farm_context.get('acreage', 2.5)} acres
- Current Crop: {farm_context.get('current_crops', 'Paddy')}

LIVE WEATHER & CLIMATE DATA ({period.upper()} PERIOD):
- Temperature: {weather_data.get('current_temp', 34)}°C (High: {weather_data.get('temp_high', 38)}°C, Low: {weather_data.get('temp_low', 26)}°C)
- Humidity: {weather_data.get('humidity', 75)}%
- Rainfall Prediction: {weather_data.get('rainfall', '0.0')} mm ({weather_data.get('rain_probability', 20)}% probability)
- Wind Speed: {weather_data.get('wind_speed', 12)} km/h
- Weather Condition: {weather_data.get('condition', 'Partly Cloudy')}
- Period Focus: {period} (today, 7days, or 30days)

Analyze potential climate risks to {farm_context.get('current_crops', 'Paddy')} crops in {farm_context.get('village', 'Bhimavaram')} for the timeframe '{period}'.

Return STRICT JSON only matching this schema:
{{
  "featured_risk": {{
    "severity": "high",
    "title": "High Temperature Expected",
    "timeframe": "Next 3 days",
    "expected_value": "38–40°C",
    "normal_value": "Normal: 32°C",
    "impact_summary": "High heat stress may affect crop growth and flowering.",
    "recommendation": "Irrigate early morning or evening to reduce crop heat stress.",
    "risk_type": "temperature"
  }},
  "upcoming_risks": [
    {{
      "severity": "medium",
      "title": "Heavy Rainfall",
      "timeframe": "In 2 days",
      "detail": "50 – 70 mm",
      "description": "Higher chance of heavy downpour causing waterlogging.",
      "risk_type": "rain"
    }},
    {{
      "severity": "medium",
      "title": "Dry Conditions",
      "timeframe": "Next 7 days",
      "detail": "Low Rainfall",
      "description": "Soil moisture decreasing. Plan irrigation accordingly.",
      "risk_type": "sun"
    }},
    {{
      "severity": "low",
      "title": "Strong Wind",
      "timeframe": "In 4 days",
      "detail": "30 – 40 km/h",
      "description": "Wind speed rising; support tall standing crops.",
      "risk_type": "wind"
    }},
    {{
      "severity": "low",
      "title": "Pest/Disease Risk",
      "timeframe": "Favorable conditions",
      "detail": "High Humidity",
      "description": "High humidity may increase fungal & pest activity.",
      "risk_type": "bug"
    }}
  ]
}}

Ensure severity values are strictly one of: "high", "medium", "low".
Ensure risk_type is one of: "temperature", "rain", "sun", "wind", "bug".
Return ONLY raw JSON, no markdown backticks.
"""
        for model in [self.primary_model, self.fallback_model, "gemini-3.6-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                req_data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json', 'x-goog-api-key': self.api_key})
                with urllib.request.urlopen(req, timeout=10) as res:
                    if res.status == 200:
                        txt = json.loads(res.read().decode('utf-8'))["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if txt.startswith("```json"):
                            txt = txt.replace("```json", "").replace("```", "").strip()
                        elif txt.startswith("```"):
                            txt = txt.replace("```", "").strip()
                        parsed = json.loads(txt)
                        if "featured_risk" in parsed and "upcoming_risks" in parsed:
                            localized_fields = [
                                parsed["featured_risk"].get(key, "")
                                for key in ("title", "impact_summary", "recommendation")
                            ]
                            localized_fields.extend(
                                item.get(key, "")
                                for item in parsed["upcoming_risks"]
                                for key in ("title", "description")
                            )
                            if all(self._matches_requested_language(value, language) for value in localized_fields):
                                return parsed
                            logger.warning("Gemini climate analysis used the wrong script for %s", language)
            except Exception as e:
                logger.warning(f"Gemini climate risk error with model {model}: {e}")

        # Fallback structured JSON based on weather parameters
        temp = weather_data.get('current_temp', 34)
        rain = float(weather_data.get('rainfall', 0) or 0)
        crop = farm_context.get('current_crops', 'Paddy')
        village = farm_context.get('village', 'Bhimavaram')

        return {
            "featured_risk": {
                "severity": "high" if temp > 35 else "medium",
                "title": f"Heat & Climate Stress Alert for {crop}",
                "timeframe": f"Next 3 days ({period})",
                "expected_value": f"{temp}°C - {temp+4}°C",
                "normal_value": "Normal: 31°C",
                "impact_summary": f"Temperature trend in {village} may impact soil moisture & crop transpiration.",
                "recommendation": "Irrigate early morning or late evening hours to protect crop roots.",
                "risk_type": "temperature"
            },
            "upcoming_risks": [
                {
                    "severity": "medium" if rain > 20 else "low",
                    "title": "Precipitation Alert",
                    "timeframe": "Next 48 hours",
                    "detail": f"{rain} - {rain+30} mm",
                    "description": "Monitor field drainage to prevent localized waterlogging.",
                    "risk_type": "rain"
                },
                {
                    "severity": "medium",
                    "title": "Soil Moisture Depletion",
                    "timeframe": "Next 7 days",
                    "detail": "Moderate Evaporation",
                    "description": "Evaporation rates are elevated due to sunshine.",
                    "risk_type": "sun"
                },
                {
                    "severity": "low",
                    "title": "Breeze & Wind Activity",
                    "timeframe": "Next 3 days",
                    "detail": f"{weather_data.get('wind_speed', 12)} km/h",
                    "description": "Normal seasonal wind velocity expected.",
                    "risk_type": "wind"
                },
                {
                    "severity": "low",
                    "title": "Pest Surveillance",
                    "timeframe": "Ongoing",
                    "detail": f"Humidity {weather_data.get('humidity', 75)}%",
                    "description": "Monitor leaf surfaces for early pest infestation.",
                    "risk_type": "bug"
                }
            ]
        }

    async def generate_climate_risk_analysis(
        self,
        farm_context: Dict[str, Any],
        weather_data: Dict[str, Any],
        period: str = "today",
        language: str = "en",
    ) -> Dict[str, Any]:
        """Generates dynamic AI climate risk analysis using live Gemini API based on farm context and climate forecast."""
        village = farm_context.get('village', 'Bhimavaram')
        crop = farm_context.get('current_crops', 'Paddy')
        language_name = {"en": "English", "hi": "Hindi", "te": "Telugu"}.get(language, "English")
        temp = weather_data.get('current_temp', 34)
        rain_probability = weather_data.get('rain_chance', 0)
        wind = weather_data.get('wind_speed', 12)
        humidity = weather_data.get('humidity', 75)
        forecast = weather_data.get("forecast") or []
        forecast_window = forecast[:1] if period == "today" else forecast[:7]
        forecast_summary = "; ".join(
            f"{day.get('date', day.get('day', 'Forecast day'))}: high {day.get('max_temp')} C, "
            f"low {day.get('min_temp')} C, rain chance {day.get('rain_chance')}%"
            for day in forecast_window
        ) or "No daily forecast details available"
        forecast_highs = [
            float(day["max_temp"]) for day in forecast_window
            if day.get("max_temp") is not None
        ]
        forecast_high = max(forecast_highs, default=weather_data.get("max_temp", temp))
        period_label = {
            "en": {"today": "Today", "7days": "Next 7 days", "30days": "Next 7 days; 30-day forecast unavailable"},
            "hi": {"today": "आज", "7days": "अगले 7 दिन", "30days": "अगले 7 दिन; 30 दिन का अनुमान उपलब्ध नहीं"},
            "te": {"today": "ఈరోజు", "7days": "తదుపరి 7 రోజులు", "30days": "తదుపరి 7 రోజులు; 30 రోజుల అంచనా అందుబాటులో లేదు"},
        }.get(language, {}).get(period, period)

        prompt = f"""
You are AgriSmart AI climate risk analyzer. Analyze the following farm and weather data to generate a dynamic climate risk analysis tailored specifically to {crop} farming in {village}.

FARM DETAILS:
- Farm Name: {farm_context.get('farm_name', village + ' Farm')}
- Village: {village}
- District: {farm_context.get('district', 'West Godavari')}
- State: {farm_context.get('state', 'Andhra Pradesh')}
- Acreage: {farm_context.get('acreage', 2.5)} acres
- Current Crop: {crop}

LIVE CLIMATE DATA ({period.upper()} FOCUS):
- Current temperature: {temp}°C
- Today's forecast high/low: {weather_data.get('max_temp', 'not available')}°C / {weather_data.get('min_temp', 'not available')}°C
- Humidity: {humidity}%
- Chance of rain today: {rain_probability}% (probability only; no rainfall amount was supplied)
- Wind Speed: {wind} km/h
- Condition: {weather_data.get('condition', 'Clear Sky')}
- Available daily forecast: {forecast_summary}

Analyze the climate risk specifically for {crop} in {village} for the timeframe '{period}'.
Write all text values in {language_name}, using short everyday sentences a farmer can understand. Avoid technical words and explain the likely effect on the crop in plain language. Give one clear, practical action based on the weather data. Do not invent measurements, certainty, rainfall amounts, or actions unsupported by the provided data. Use only the supplied forecast dates; do not claim forecasts beyond those dates. Rain chance is not rainfall amount. Do not claim soil moisture or pest risk without supporting data. Keep severity and risk_type values in English exactly as required by the schema.

Return STRICT JSON matching this schema structure:
{{
  "featured_risk": {{
    "severity": "high",
    "title": "High Temperature Warning for {crop} in {village}",
    "timeframe": "{period_label}",
    "expected_value": "Forecast high: {forecast_high}°C",
    "normal_value": "",
    "impact_summary": "Heat stress in {village} may impact {crop} growth and moisture absorption.",
    "recommendation": "Irrigate early morning or evening to reduce heat stress on {crop}.",
    "risk_type": "temperature"
  }},
  "upcoming_risks": [
    {{
      "severity": "medium",
      "title": "Precipitation & Rainfall Risk",
      "timeframe": "Today",
      "detail": "{rain_probability}% chance of rain",
      "description": "Rain is possible. Check local conditions and field drainage.",
      "risk_type": "rain"
    }},
    {{
      "severity": "medium",
      "title": "Soil Evaporation Alert",
      "timeframe": "Next 7 days",
      "detail": "Only include if the supplied forecast supports it",
      "description": "Do not include a dry-soil risk without supporting data.",
      "risk_type": "sun"
    }},
    {{
      "severity": "low",
      "title": "Breeze & Wind Activity",
      "timeframe": "In 4 days",
      "detail": "Current wind speed: {wind} km/h",
      "description": "Wind speeds in {village} require field bund inspection.",
      "risk_type": "wind"
    }},
    {{
      "severity": "low",
      "title": "Pest & Fungal Risk",
      "timeframe": "High Humidity Phase",
      "detail": "Only include if supported by supplied data",
      "description": "Do not claim a pest risk from humidity alone.",
      "risk_type": "bug"
    }}
  ]
}}

Ensure severity values are strictly one of: "high", "medium", "low".
Ensure risk_type is one of: "temperature", "rain", "sun", "wind", "bug".
Return ONLY valid raw JSON, without markdown formatting.
"""
        for model in [self.primary_model, self.fallback_model, "gemini-3.6-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                req_data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json', 'x-goog-api-key': self.api_key})
                with urllib.request.urlopen(req, timeout=10) as res:
                    if res.status == 200:
                        txt = json.loads(res.read().decode('utf-8'))["candidates"][0]["content"]["parts"][0]["text"].strip()
                        if txt.startswith("```json"):
                            txt = txt.replace("```json", "").replace("```", "").strip()
                        elif txt.startswith("```"):
                            txt = txt.replace("```", "").strip()
                        parsed = json.loads(txt)
                        if "featured_risk" in parsed and "upcoming_risks" in parsed:
                            return parsed
            except Exception as e:
                logger.warning(f"Gemini climate risk error with model {model}: {e}")

        # Dynamic fallback tailored to exact farm & location
        is_high_temp = float(forecast_high) >= 33
        simple_fallback = {
            "en": {
                "heat_title": "Hot weather warning for {crop}",
                "heat_impact": "Hot weather may dry the soil faster and stress the crop.",
                "heat_action": "Check soil moisture. If the soil is dry, water early in the morning or evening.",
                "rain_title": "Rain forecast for {village}",
                "rain_impact": "Rain chance today is {probability}%. If rain is likely, check that field drains are clear.",
                "dry_title": "Soil may dry faster",
                "dry_impact": "Warm, sunny weather can dry the topsoil. Check soil moisture before watering.",
                "forecast_high": "Forecast high: {value}°C",
                "dry_timeframe": "Next 7 days",
                "moisture_unavailable": "Soil moisture reading unavailable",
                "wind_title": "Seasonal wind activity",
                "wind_timeframe": "Next 3 days",
                "wind_detail": "Wind speed: {wind} km/h",
                "wind_impact": "Moderate winds in {village}; support standing crops where needed.",
                "pest_title": "Crop inspection",
                "ongoing": "Ongoing",
                "humidity_detail": "Humidity {humidity}%",
                "pest_impact": "Check {crop} regularly for visible pest activity.",
            },
            "hi": {
                "heat_title": "{crop} के लिए गर्मी की चेतावनी",
                "heat_impact": "गर्मी से मिट्टी जल्दी सूख सकती है और फसल पर असर पड़ सकता है।",
                "heat_action": "पहले मिट्टी की नमी देखें। मिट्टी सूखी हो तो सुबह जल्दी या शाम को पानी दें।",
                "rain_title": "{village} में बारिश का अनुमान",
                "rain_impact": "आज बारिश की संभावना {probability}% है। बारिश होने पर खेत से पानी निकलने का रास्ता देखें।",
                "dry_title": "मिट्टी जल्दी सूख सकती है",
                "dry_impact": "धूप और गर्मी से ऊपर की मिट्टी सूख सकती है। पानी देने से पहले नमी देखें।",
                "forecast_high": "अधिकतम तापमान: {value}°C",
                "dry_timeframe": "अगले 7 दिन",
                "moisture_unavailable": "मिट्टी की नमी का माप उपलब्ध नहीं है",
                "wind_title": "मौसमी हवा की जानकारी",
                "wind_timeframe": "अगले 3 दिन",
                "wind_detail": "हवा की गति: {wind} किमी/घंटा",
                "wind_impact": "{village} में मध्यम हवा चल सकती है। ज़रूरत पड़ने पर खड़ी फसल को सहारा दें।",
                "pest_title": "फसल की नियमित जाँच",
                "ongoing": "जारी",
                "humidity_detail": "नमी {humidity}%",
                "pest_impact": "{crop} में दिखने वाले कीटों के लिए नियमित जाँच करें।",
            },
            "te": {
                "heat_title": "{crop} పంటకు వేడి వాతావరణ హెచ్చరిక",
                "heat_impact": "వేడి వల్ల నేల త్వరగా ఎండిపోవచ్చు; పంటపై ప్రభావం ఉండవచ్చు.",
                "heat_action": "ముందుగా నేల తేమను చూడండి. నేల ఎండిపోయి ఉంటే ఉదయం లేదా సాయంత్రం నీరు పెట్టండి.",
                "rain_title": "{village}లో వర్ష సూచన",
                "rain_impact": "ఈ రోజు వర్షం వచ్చే అవకాశం {probability}%. వర్షం వస్తే పొలంలో నీరు బయటకు వెళ్లే మార్గాన్ని చూడండి.",
                "dry_title": "నేల త్వరగా ఎండిపోవచ్చు",
                "dry_impact": "ఎండ, వేడి వల్ల పై మట్టి ఎండిపోవచ్చు. నీరు పెట్టే ముందు నేల తేమను చూడండి.",
                "forecast_high": "గరిష్ఠ ఉష్ణోగ్రత: {value}°C",
                "dry_timeframe": "తదుపరి 7 రోజులు",
                "moisture_unavailable": "నేల తేమ కొలత అందుబాటులో లేదు",
                "wind_title": "కాలానుగుణ గాలుల సమాచారం",
                "wind_timeframe": "తదుపరి 3 రోజులు",
                "wind_detail": "గాలి వేగం: {wind} కి.మీ/గం",
                "wind_impact": "{village} ప్రాంతంలో మోస్తరు గాలులు ఉండవచ్చు. అవసరమైతే నిలువు పంటలకు ఆధారం ఇవ్వండి.",
                "pest_title": "పంటను క్రమం తప్పకుండా పరిశీలించండి",
                "ongoing": "కొనసాగుతోంది",
                "humidity_detail": "గాలిలో తేమ {humidity}%",
                "pest_impact": "{crop} పంటలో కనిపించే చీడపీడల కోసం క్రమం తప్పకుండా పరిశీలించండి.",
            },
        }.get(language)
        if simple_fallback is None:
            simple_fallback = {
                "heat_title": "Hot weather warning for {crop}",
                "heat_impact": "Hot weather may dry the soil faster and stress the crop.",
                "heat_action": "Check soil moisture. If the soil is dry, water early in the morning or evening.",
                "rain_title": "Rain forecast for {village}",
                "rain_impact": "Rain chance today is {probability}%. If rain is likely, check that field drains are clear.",
                "dry_title": "Soil may dry faster",
                "dry_impact": "Warm, sunny weather can dry the topsoil. Check soil moisture before watering.",
            }
        return {
            "featured_risk": {
                "severity": "high" if is_high_temp else "medium",
                "title": simple_fallback["heat_title"].format(crop=crop, village=village),
                "timeframe": period_label,
                "expected_value": simple_fallback["forecast_high"].format(value=forecast_high),
                "normal_value": "",
                "impact_summary": simple_fallback["heat_impact"],
                "recommendation": simple_fallback["heat_action"],
                "risk_type": "temperature"
            },
            "upcoming_risks": [
                {
                    "severity": "medium" if rain_probability >= 40 else "low",
                    "title": simple_fallback["rain_title"].format(crop=crop, village=village),
                    "timeframe": period_label,
                    "detail": f"{rain_probability}%",
                    "description": simple_fallback["rain_impact"].format(probability=rain_probability),
                    "risk_type": "rain"
                },
                {
                    "severity": "low",
                    "title": simple_fallback["dry_title"],
                    "timeframe": simple_fallback["dry_timeframe"],
                    "detail": simple_fallback["moisture_unavailable"],
                    "description": simple_fallback["dry_impact"],
                    "risk_type": "sun"
                },
                {
                    "severity": "low",
                    "title": simple_fallback["wind_title"],
                    "timeframe": simple_fallback["wind_timeframe"],
                    "detail": simple_fallback["wind_detail"].format(wind=wind),
                    "description": simple_fallback["wind_impact"].format(village=village),
                    "risk_type": "wind"
                },
                {
                    "severity": "low",
                    "title": simple_fallback["pest_title"],
                    "timeframe": simple_fallback["ongoing"],
                    "detail": simple_fallback["humidity_detail"].format(humidity=humidity),
                    "description": simple_fallback["pest_impact"].format(crop=crop),
                    "risk_type": "bug"
                }
            ]
        }

    def _extract_recommendations(self, text: str, language: str = "en") -> list:
        lines = text.split("\n")
        recs = []
        for line in lines:
            line_str = line.strip()
            if line_str.startswith(("-", "*", "•", "1.", "2.", "3.", "4.")):
                clean_line = re.sub(r"^[-*•\d.]+\s*", "", line_str).strip()
                clean_line = re.sub(r"\*\*|\*", "", clean_line).strip()
                if clean_line and len(clean_line) > 10 and len(recs) < 3:
                    recs.append(clean_line)
        action_verbs = {
            "en": ("apply", "check", "keep", "inspect", "ensure", "use", "contact", "avoid", "irrigate", "monitor", "remove", "test"),
            "te": ("చేయండి", "పెట్టండి", "వేయండి", "పరిశీలించండి", "గమనించండి", "తనిఖీ చేయండి", "సంప్రదించండి", "వాడండి", "ఉపయోగించండి"),
            "hi": ("करें", "रखें", "डालें", "जाँचें", "देखें", "लगाएँ", "अपनाएँ", "संपर्क करें", "उपयोग करें"),
        }
        if language in action_verbs:
            recs = [item for item in recs if any(verb in item.lower() for verb in action_verbs[language])]
        if recs and language != "en" and not all(self._matches_requested_language(item, language) for item in recs):
            recs = []
        return recs

gemini_ai_service = GeminiAIService()
