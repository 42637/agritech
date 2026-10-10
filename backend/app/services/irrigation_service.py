from datetime import date, timedelta
from typing import Any, Dict, List, Optional


# These are starting ranges for planning, not fixed prescriptions. Actual water
# needs change with soil texture, planting density, crop stage, and rainfall.
STAGE_PROGRESS = {
    "Seedling Stage": 0.0,
    "Vegetative Stage": 0.15,
    "Flowering Stage": 0.4,
    "Fruiting / Pod Formation": 0.62,
    "Grain / Bulb Development": 0.76,
    "Maturity Stage": 0.9,
}

# Typical durations vary by variety, season, and transplant/direct-sowing method.
# Farmers can override these estimates in the form for their variety.
CROP_WATER_SPECS: Dict[str, Dict[str, Any]] = {
    "Paddy": {"depth_min": 20, "depth_max": 30, "frequency_days": 5, "stage": "Vegetative Stage", "cycle_days": 125, "duration_range": "110–150"},
    "Maize": {"depth_min": 18, "depth_max": 25, "frequency_days": 6, "stage": "Vegetative Stage", "cycle_days": 100, "duration_range": "85–120"},
    "Groundnut": {"depth_min": 15, "depth_max": 20, "frequency_days": 7, "stage": "Pegging Stage", "cycle_days": 112, "duration_range": "100–125"},
    "Chilli": {"depth_min": 15, "depth_max": 22, "frequency_days": 5, "stage": "Flowering & Pod Set", "cycle_days": 160, "duration_range": "120–210"},
    "Cotton": {"depth_min": 18, "depth_max": 25, "frequency_days": 7, "stage": "Vegetative Stage", "cycle_days": 165, "duration_range": "150–190"},
    "Turmeric": {"depth_min": 20, "depth_max": 30, "frequency_days": 6, "stage": "Vegetative Stage", "cycle_days": 240, "duration_range": "210–270"},
    "Sugarcane": {"depth_min": 25, "depth_max": 40, "frequency_days": 8, "stage": "Tillering Stage", "cycle_days": 365, "duration_range": "300–365"},
    "Tomato": {"depth_min": 15, "depth_max": 22, "frequency_days": 4, "stage": "Flowering & Fruiting", "cycle_days": 100, "duration_range": "90–140"},
    "Onion": {"depth_min": 12, "depth_max": 20, "frequency_days": 5, "stage": "Bulb Development", "cycle_days": 120, "duration_range": "100–150"},
    "Red Gram": {"depth_min": 15, "depth_max": 22, "frequency_days": 7, "stage": "Vegetative Stage", "cycle_days": 170, "duration_range": "150–220"},
    "Black Gram": {"depth_min": 12, "depth_max": 20, "frequency_days": 6, "stage": "Vegetative Stage", "cycle_days": 75, "duration_range": "65–90"},
    "Green Gram": {"depth_min": 12, "depth_max": 20, "frequency_days": 6, "stage": "Vegetative Stage", "cycle_days": 70, "duration_range": "55–85"},
    "Sesame": {"depth_min": 12, "depth_max": 18, "frequency_days": 7, "stage": "Vegetative Stage", "cycle_days": 95, "duration_range": "80–110"},
}

CYCLE_PHASES = [
    (0.0, "Establishment", "Check plant establishment, gaps, and soil moisture; follow the seed or transplant label and local crop calendar."),
    (0.15, "Vegetative growth", "Inspect crop growth and weeds. Use soil-test guidance for nutrition and irrigate only when root-zone moisture requires it."),
    (0.4, "Flowering", "Keep moisture as even as practical during flowering. Scout for pests and disease; confirm identification before any treatment."),
    (0.62, "Fruit, pod, or reproductive development", "Inspect crop-specific fruit, pod, or reproductive growth. Avoid moisture stress and waterlogging; act on verified field observations."),
    (0.78, "Grain, bulb, or filling stage", "Check filling or bulb development and soil moisture. Adjust irrigation to crop need and effective rainfall."),
    (0.9, "Maturation", "Reduce unnecessary irrigation as the crop approaches maturity; follow variety-specific signs and local harvest guidance."),
    (1.0, "Harvest readiness", "Confirm harvest maturity using crop and variety guidance. Plan safe harvest, drying, and storage for local conditions."),
]


def _date_in(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


class IrrigationService:
    def calculate_plan(
        self,
        crop: str,
        acreage: float,
        water_source: str,
        stage: str = "",
        weather: Optional[Dict[str, Any]] = None,
        field_update: Optional[Dict[str, Any]] = None,
        crop_duration_days: Optional[int] = None,
    ) -> Dict[str, Any]:
        spec = CROP_WATER_SPECS.get(crop, CROP_WATER_SPECS["Paddy"])
        cycle_days = crop_duration_days or spec["cycle_days"]
        current_stage_progress = STAGE_PROGRESS.get(stage, STAGE_PROGRESS.get(spec["stage"], 0.15))
        stage_day = round(cycle_days * current_stage_progress)
        weather = weather or {}
        field_update = field_update or {}
        moisture = field_update.get("soil_moisture", "unknown")
        min_depth = spec["depth_min"]
        max_depth = spec["depth_max"]
        next_date = _date_in(spec["frequency_days"])
        moisture_note = "Check root-zone moisture before irrigating; the depth is a planning estimate."

        if moisture == "wet":
            min_depth = max_depth = 0
            moisture_note = "Your field update says the soil is wet. Hold irrigation and recheck after drainage."
        elif moisture == "dry":
            moisture_note = "Your field update says the soil is dry. Check root-zone moisture and irrigate if the crop is showing water stress."

        forecast = (weather.get("forecast") or []) if weather.get("source") == "forecast" else []
        rain_soon = weather.get("source") == "forecast" and any(
            (item.get("rain_chance") or 0) >= 60
            for item in forecast[:2]
        )
        if rain_soon and moisture != "dry":
            min_depth = max_depth = 0
            moisture_note = "Rain is forecast soon. Check the field after rain and defer irrigation if root-zone moisture is adequate."

        # 1 mm across one acre is 4,046.86 litres.
        min_liters = min_depth * acreage * 4046.86
        max_liters = max_depth * acreage * 4046.86
        min_lakh = round(min_liters / 100000, 2)
        max_lakh = round(max_liters / 100000, 2)
        if max_depth == 0:
            volume_label = "No water amount scheduled yet; reassess soil moisture and rainfall."
        else:
            volume_label = f"About {min_lakh}–{max_lakh} lakh litres for {acreage:g} acres (estimate)"

        current = {
            "temperature": weather.get("current_temp"),
            "humidity": weather.get("humidity"),
            "condition": weather.get("condition"),
        } if weather.get("source") in {"forecast", "stale_forecast"} else {}
        humidity = current.get("humidity")
        temp = current.get("temperature")
        rain = weather.get("rainfall_7d_mm")
        conditions_available = bool(weather.get("updated_at"))
        return {
            "crop": crop,
            "stage": stage or spec["stage"],
            "crop_duration_days": cycle_days,
            "duration_range_days": spec["duration_range"],
            "current_stage_day": stage_day,
            "days_remaining": max(0, cycle_days - stage_day),
            "harvest_estimate_date": _date_in(max(0, cycle_days - stage_day)),
            "acreage": acreage,
            "water_source": water_source,
            "depth_min": min_depth,
            "depth_max": max_depth,
            "volume_label": volume_label,
            "frequency_days": spec["frequency_days"],
            "next_date": next_date,
            "temp": temp,
            "rainfall_7d": round(rain, 1) if weather.get("source") == "forecast" and isinstance(rain, (int, float)) else None,
            "humidity": humidity,
            "weather": current.get("condition"),
            "updated_at": weather.get("updated_at") if conditions_available else None,
            "forecast": forecast,
            "why_recommendation": moisture_note,
            "additional_advice": [
                "Check soil moisture at root depth and account for effective rain before watering.",
                "Prefer cooler hours and avoid runoff; use the selected water source efficiently.",
                "Recheck the crop after irrigation and update this plan if field conditions change.",
            ],
            "ai_generated": False,
        }

    def default_action_plan(
        self,
        crop: str,
        stage: str,
        water_source: str,
        plan: Dict[str, Any],
        field_update: Optional[Dict[str, Any]] = None,
        weather: Optional[Dict[str, Any]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        field_update = field_update or {}
        weather = weather or {}
        moisture = field_update.get("soil_moisture", "unknown")
        pest_seen = field_update.get("pest_observed", False)
        notes = field_update.get("notes", "").strip()
        first_rain = next((day for day in (weather.get("forecast") or [])[:3] if (day.get("rain_chance") or 0) >= 60), None)
        schedule: List[Dict[str, str]] = []
        tasks = [
            ("scouting", "Check crop and soil", "Walk several parts of the field; check root-zone moisture and inspect both sides of leaves and stems."),
            ("irrigation", "Review irrigation need", "Compare root-zone moisture with the forecast. Apply the estimated amount only if the crop needs water; skip if rain has wetted the root zone."),
            ("scouting", "Look for pest or disease signs", "Record the affected area, plant part, and number of plants showing symptoms; photograph unclear damage."),
            ("field_work", "Maintain water efficiency", "Check bunds, emitters, or channels for leaks and standing water; clear blockages if needed."),
            ("nutrition", "Review crop nutrition", "Use the soil test and crop stage before choosing any organic nutrient input; follow its label."),
            ("irrigation", "Recheck after forecast rain", "Inspect soil moisture after rain. Delay irrigation if the root zone is adequately moist."),
            ("scouting", "Update this field plan", "Record crop stage, moisture, pest signs, and any treatment actually used, then refresh the plan."),
        ]
        if moisture == "wet":
            tasks[1] = ("irrigation", "Hold irrigation and reassess", "Your update says the field is wet. Check drainage and do not add water until the root zone needs it.")
        if first_rain:
            tasks[1] = ("irrigation", "Check before watering", f"Rain is forecast for {first_rain.get('date', 'soon')}. Recheck field moisture after the rain before irrigating.")
        if pest_seen:
            tasks[2] = ("scouting", "Verify the reported pest", "Inspect fresh and older damage in several field areas. Get an uncertain pest identified by a local KVK or agriculture officer before choosing a treatment.")
        if notes:
            tasks[6] = ("scouting", "Review your latest field notes", "Use the observations you entered to compare new symptoms and moisture; refresh the plan if conditions have changed.")
        if language in {"te", "hi"}:
            translated = {
                "te": [
                    ("పంట, నేల తేమను పరిశీలించండి", "పొలంలోని పలు చోట్ల మొక్కలను చూడండి. వేర్ల లోతులో తేమను, ఆకులు మరియు కాండాలపై లక్షణాలను పరిశీలించండి."),
                    ("నీటి అవసరాన్ని మళ్లీ చూడండి", "వేర్ల ప్రాంతంలోని తేమను, వర్ష సూచనను పరిశీలించండి. పంటకు అవసరమైతేనే నీరు పెట్టండి; వర్షంతో నేల తడిగా ఉంటే ఆపండి."),
                    ("పురుగు లేదా తెగులు లక్షణాలు చూడండి", "ప్రభావిత భాగం, ప్రాంతం, లక్షణాలున్న మొక్కల సంఖ్యను నమోదు చేయండి. స్పష్టంగా తెలియని నష్టాన్ని ఫోటో తీయండి."),
                    ("నీటి వినియోగాన్ని సమర్థంగా ఉంచండి", "గట్లు, డ్రిప్ పైపులు లేదా కాలువల్లో లీకులు, నీరు నిల్వ ఉండటం చూడండి; అడ్డంకులు ఉంటే తొలగించండి."),
                    ("పంట పోషణను సమీక్షించండి", "సేంద్రియ పోషకాన్ని ఎంచుకునే ముందు నేల పరీక్ష, పంట దశను పరిగణించండి; ఉత్పత్తి లేబుల్‌ను అనుసరించండి."),
                    ("వర్షం తర్వాత మళ్లీ పరిశీలించండి", "వర్షం తర్వాత నేల తేమను చూడండి. వేర్ల ప్రాంతంలో తగినంత తేమ ఉంటే నీటిపారుదలను వాయిదా వేయండి."),
                    ("పొలం వివరాలను నవీకరించండి", "పంట దశ, తేమ, పురుగు లక్షణాలు, వాడిన చికిత్స వివరాలు నమోదు చేసి పరిస్థితులు మారితే ప్రణాళికను మళ్లీ పొందండి."),
                ],
                "hi": [
                    ("फसल और मिट्टी की नमी जाँचें", "खेत के कई हिस्सों में पौधों को देखें। जड़ क्षेत्र की नमी तथा पत्तियों और तनों के दोनों ओर लक्षण जाँचें."),
                    ("सिंचाई की जरूरत फिर जाँचें", "जड़ क्षेत्र की नमी और वर्षा पूर्वानुमान देखें। फसल को जरूरत हो तभी पानी दें; बारिश से मिट्टी नम हो तो रोकें."),
                    ("कीट या रोग के लक्षण देखें", "प्रभावित भाग, क्षेत्र और लक्षण वाले पौधों की संख्या दर्ज करें। नुकसान स्पष्ट न हो तो उसकी तस्वीर लें."),
                    ("पानी का कुशल उपयोग बनाए रखें", "मेड़ों, ड्रिप पाइप या नालियों में रिसाव और जलभराव देखें; रुकावट हो तो साफ करें."),
                    ("फसल पोषण की समीक्षा करें", "जैविक पोषक चुनने से पहले मिट्टी परीक्षण और फसल अवस्था देखें; उत्पाद का लेबल मानें."),
                    ("बारिश के बाद फिर जाँचें", "बारिश के बाद मिट्टी की नमी देखें। जड़ क्षेत्र पर्याप्त नम हो तो सिंचाई टालें."),
                    ("खेत की जानकारी अपडेट करें", "फसल अवस्था, नमी, कीट लक्षण और इस्तेमाल किए उपचार दर्ज करें; बदलाव होने पर योजना फिर लें."),
                ],
            }[language]
            tasks = [(category, translated[i][0], translated[i][1]) for i, (category, _, _) in enumerate(tasks)]
            if moisture == "wet":
                tasks[1] = ("irrigation", "నీటిపారుదలను ఆపి మళ్లీ పరిశీలించండి" if language == "te" else "सिंचाई रोकें और फिर जाँचें", "మీ వివరాల ప్రకారం నేల తడిగా ఉంది. నీరు అవసరమయ్యే వరకు పారుదల చూడండి; అదనపు నీరు పెట్టవద్దు." if language == "te" else "आपकी जानकारी के अनुसार मिट्टी गीली है। जल निकासी देखें और जरूरत होने तक पानी न दें.")
            if first_rain:
                rain_date = first_rain.get("date", "త్వరలో" if language == "te" else "जल्द")
                tasks[1] = ("irrigation", "నీరు పెట్టే ముందు చూడండి" if language == "te" else "पानी देने से पहले जाँचें", f"{rain_date} వర్ష సూచన ఉంది. వర్షం తర్వాత తేమను మళ్లీ చూసి నీరు పెట్టండి." if language == "te" else f"{rain_date} को बारिश की संभावना है। बारिश के बाद नमी जाँचकर ही पानी दें.")
            if pest_seen:
                tasks[2] = ("scouting", "నివేదించిన పురుగును నిర్ధారించండి" if language == "te" else "बताए गए कीट की पहचान करें", "పొలంలోని పలు చోట్ల నష్టాన్ని పరిశీలించండి. చికిత్సకు ముందు KVK లేదా వ్యవసాయ అధికారితో గుర్తింపును నిర్ధారించండి." if language == "te" else "खेत के कई हिस्सों में नुकसान देखें। उपचार से पहले स्थानीय कृषि अधिकारी या KVK से पहचान की पुष्टि करें.")
            if notes:
                tasks[6] = ("scouting", "తాజా పొలం వివరాలను చూడండి" if language == "te" else "नई खेत जानकारी देखें", "మీరు నమోదు చేసిన లక్షణాలు, తేమను పరిశీలించి పరిస్థితులు మారితే ప్రణాళికను మళ్లీ పొందండి." if language == "te" else "दर्ज लक्षण और नमी देखें; स्थिति बदलने पर योजना फिर से लें.")
        for offset, (category, title, action) in enumerate(tasks):
            schedule.append({"date": _date_in(offset), "title": title, "action": action, "category": category})

        duration = int(plan.get("crop_duration_days", CROP_WATER_SPECS.get(crop, CROP_WATER_SPECS["Paddy"])["cycle_days"]))
        current_day = int(plan.get("current_stage_day", 0))
        cycle_plan = []
        for progress, stage_name, action in CYCLE_PHASES:
            milestone_day = round(duration * progress)
            if milestone_day < current_day:
                continue
            days_from_now = max(0, milestone_day - current_day)
            cycle_plan.append({
                "stage": stage_name,
                "date": _date_in(days_from_now),
                "days_from_now": days_from_now,
                "title": stage_name,
                "action": action,
                "category": "field_work",
            })
        cycle_translations = {
            "te": {
                "Establishment": ("పంట స్థాపన", "మొక్కలు సరిగా నిలిచాయా, ఖాళీలు ఉన్నాయా, నేల తేమ ఎలా ఉందో చూడండి. మీ రకం విత్తనాలు లేదా నాట్ల సూచనలను అనుసరించండి."),
                "Vegetative growth": ("వృక్ష పెరుగుదల", "పెరుగుదల, కలుపును పరిశీలించండి. నేల పరీక్ష ఆధారంగా పోషకాలను ఎంచుకోండి; వేర్ల ప్రాంతంలో తేమ అవసరమైనప్పుడే నీరు పెట్టండి."),
                "Flowering": ("పుష్ప దశ", "పుష్ప దశలో తేమను సాధ్యమైనంత స్థిరంగా ఉంచండి. చీడపీడలను పరిశీలించి, ఏ చికిత్సకైనా ముందు వాటి గుర్తింపును నిర్ధారించండి."),
                "Fruit, pod, or reproductive development": ("కాయ/పునరుత్పత్తి అభివృద్ధి", "పంటకు తగిన కాయ లేదా పునరుత్పత్తి అభివృద్ధిని చూడండి. నీటి ఒత్తిడి, నీరు నిల్వ ఉండకుండా చూసి, నిర్ధారించిన పొలం లక్షణాలపై చర్య తీసుకోండి."),
                "Grain, bulb, or filling stage": ("గింజ/బల్బ్ అభివృద్ధి", "గింజ నింపుదల లేదా బల్బ్ పెరుగుదలను, నేల తేమను పరిశీలించండి. పంట అవసరం, వర్షాన్ని బట్టి నీటిని సర్దుబాటు చేయండి."),
                "Maturation": ("పక్వ దశ", "పంట పక్వానికి వస్తున్నప్పుడు అవసరం లేని నీటిని తగ్గించండి; రకం, స్థానిక కోత సూచనలను అనుసరించండి."),
                "Harvest readiness": ("కోతకు సిద్ధం", "పంట, రకం ఆధారంగా కోతకు సరైన పరిపక్వతను నిర్ధారించి, కోత, ఎండబెట్టడం, నిల్వను ప్లాన్ చేయండి."),
            },
            "hi": {
                "Establishment": ("फसल की स्थापना", "पौधों की स्थापना, खाली जगह और मिट्टी की नमी देखें। अपनी किस्म के बीज या रोपाई संबंधी निर्देश मानें."),
                "Vegetative growth": ("वानस्पतिक वृद्धि", "वृद्धि और खरपतवार देखें। मिट्टी परीक्षण के आधार पर पोषक चुनें और जड़ क्षेत्र को जरूरत होने पर ही पानी दें."),
                "Flowering": ("फूल आने की अवस्था", "फूल आने पर नमी यथासंभव समान रखें। कीट और रोग देखें; उपचार से पहले पहचान की पुष्टि करें."),
                "Fruit, pod, or reproductive development": ("फल/फली विकास", "फसल के अनुसार फल, फली या प्रजनन विकास देखें। जल तनाव और जलभराव से बचें; सत्यापित लक्षणों के आधार पर कदम लें."),
                "Grain, bulb, or filling stage": ("दाना/कंद विकास", "दाना भराव या बल्ब विकास और मिट्टी की नमी देखें। फसल की जरूरत और प्रभावी वर्षा के अनुसार सिंचाई बदलें."),
                "Maturation": ("पकने की अवस्था", "फसल पकने के करीब हो तो अनावश्यक सिंचाई घटाएँ; किस्म और स्थानीय कटाई सलाह मानें."),
                "Harvest readiness": ("कटाई की तैयारी", "फसल और किस्म के अनुसार परिपक्वता की पुष्टि करें, फिर सुरक्षित कटाई, सुखाने और भंडारण की योजना बनाएँ."),
            },
        }
        if language in cycle_translations:
            translations = cycle_translations[language]
            for item in cycle_plan:
                if item["stage"] in translations:
                    item["stage"], item["title"], item["action"] = translations[item["stage"]]

        pesticide_status = field_update.get("pesticide_status", "not_used")
        if pesticide_status == "used":
            no_spray = "Record the product and application date. Do not repeat treatment automatically; follow the product label and observe its re-entry and harvest intervals."
        elif pest_seen:
            no_spray = "No pesticide was reported. Continue scouting and use non-chemical measures while the pest is identified; do not spray on a calendar schedule."
        else:
            no_spray = "No pest was reported, so no pesticide is scheduled. Keep scouting and update the plan if symptoms appear."
        pest_plan = {
            "headline": "Scout first; no calendar spray is scheduled",
            "actions": [
                "Inspect a few plants in multiple parts of the field and record the affected plant part.",
                "Remove or isolate heavily affected plant material when appropriate and protect beneficial insects.",
                "If symptoms are unclear, ask a local KVK/agriculture officer to identify the pest before treatment.",
            ],
            "if_no_spray": no_spray,
            "next_check_date": _date_in(1),
        }
        if language in {"te", "hi"}:
            if language == "te":
                pest_plan.update({
                    "headline": "ముందుగా పరిశీలించండి; నిర్ణీత పురుగుమందు పిచికారీ లేదు",
                    "actions": ["పొలంలోని పలు చోట్ల మొక్కలను చూసి ప్రభావిత భాగాన్ని నమోదు చేయండి.", "సాధ్యమైనప్పుడు తీవ్రంగా ప్రభావిత భాగాలను తొలగించి ఉపయోగకర కీటకాలను కాపాడండి.", "లక్షణాలు స్పష్టంగా లేకపోతే చికిత్సకు ముందు స్థానిక KVK/వ్యవసాయ అధికారిని సంప్రదించండి."],
                    "if_no_spray": "పురుగు నిర్ధారణ అయ్యే వరకు పరిశీలన కొనసాగించండి; క్యాలెండర్ ప్రకారం పిచికారీ చేయవద్దు." if pest_seen else "పురుగు లక్షణాలు నమోదు కాలేదు; పిచికారీ సూచించడం లేదు. లక్షణాలు కనిపిస్తే ప్రణాళికను నవీకరించండి.",
                })
                summary = "నీరు పెట్టే ముందు నేల తేమ, స్థానిక వర్ష సూచనను పరిశీలించండి."
            else:
                pest_plan.update({
                    "headline": "पहले निगरानी करें; तय तारीख पर छिड़काव नहीं",
                    "actions": ["खेत के कई हिस्सों में पौधे देखकर प्रभावित भाग दर्ज करें।", "जहाँ उचित हो, अधिक प्रभावित हिस्से हटाएँ और लाभकारी कीटों की रक्षा करें।", "लक्षण स्पष्ट न हों तो उपचार से पहले स्थानीय KVK/कृषि अधिकारी से पहचान कराएँ."],
                    "if_no_spray": "कीट की पहचान होने तक निगरानी करें; कैलेंडर के अनुसार छिड़काव न करें." if pest_seen else "कीट के लक्षण दर्ज नहीं हैं; छिड़काव की सलाह नहीं है। लक्षण दिखें तो योजना अपडेट करें.",
                })
                summary = "सिंचाई से पहले मिट्टी की नमी और स्थानीय वर्षा पूर्वानुमान जाँचें."
        else:
            summary = plan.get("why_recommendation", "Check field moisture and the local forecast before irrigation.")
        return {"summary": summary, "schedule": schedule, "cultivation_plan": cycle_plan, "pest_plan": pest_plan}

    def organic_inputs(self, crop: str) -> List[Dict[str, str]]:
        common = [{
            "name": "Mature compost or vermicompost",
            "reason": "Adds organic matter; use a well-decomposed product and base quantity on a soil test or local crop guidance.",
        }]
        if crop in {"Red Gram", "Black Gram", "Green Gram", "Groundnut"}:
            common.append({
                "name": "Crop-matched Rhizobium inoculant; PSB if locally recommended",
                "reason": "A legume-appropriate biological input for seed treatment or soil use. Confirm crop compatibility, expiry, and label directions.",
            })
        else:
            common.append({
                "name": "Neem cake (only where soil-test or local advice supports it)",
                "reason": "An organic nutrient/soil amendment option. Compare composition and apply only as its label and local agronomy advice direct.",
            })
        return common


irrigation_service = IrrigationService()
