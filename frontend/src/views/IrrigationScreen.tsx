import React, { useState } from 'react';
import {
  ArrowLeft,
  Droplet,
  Check,
  ChevronRight,
  Sprout,
  Sun,
  CloudRain,
  Thermometer,
  Calendar,
  MapPin,
  Sparkles,
  Bug,
  Leaf,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import type { Farm, SupabaseStatus } from '../services/api';
import { CropIconMapper } from '../components/CropIcons';

interface IrrigationScreenProps {
  farms?: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onBack: () => void;
}

const irrigationCopy: Record<'en' | 'te' | 'hi', Record<string, string>> = {
  en: {
    stage: 'Crop growth stage', soil: 'Soil moisture today', unknown: 'Not sure', dry: 'Dry', normal: 'Moist', wet: 'Wet',
    getPlan: 'Build crop-cycle plan', updatePlan: 'Save field update & refresh plan', loading: 'Preparing plan…', planError: 'Could not load the plan. Check that the backend is running and try again.',
    current: 'Current conditions', weatherUnavailable: 'Live weather unavailable', weatherStale: 'Showing last available weather data; it may be outdated', rain: 'Rain next 7 days', humidity: 'Humidity', temperature: 'Temperature',
    recommendation: 'Irrigation estimate', amount: 'Water per irrigation', frequency: 'Usual interval', next: 'Next check', reason: 'Plan summary',
    pest: 'Pest scouting & response', noSpray: 'No calendar spray is scheduled. Scout first; only consider a treatment after the pest is identified.',
    fieldUpdate: 'Update from your field', updateHelp: 'Share what you see today. The next plan will use these observations.', pestFound: 'Have you seen pest or disease symptoms?', yes: 'Yes', no: 'No', pestDetails: 'What did you see? (optional)',
    pesticide: 'Pesticide use since last plan', notUsed: 'Not used', used: 'Used', unsure: 'Not sure', product: 'Product name (optional)', applicationDate: 'Application date', fieldNotes: 'Other crop observations', notesPlaceholder: 'Growth, leaf color, standing water, or anything that changed…',
    organic: 'Organic nutrient options', shop: 'Compare stores', quality: 'Compare delivered price per kg, seller rating, product composition, expiry, and valid organic/FCO documentation. Prices and availability change by location.',
    inputs: 'Suggested inputs', scheduleSource: 'Gemini crop-cycle plan', rainChance: 'Rain chance', notAvailable: '—', fieldArea: 'Field area', selectStage: 'Select current stage',
    about: 'About every', days: 'days', checkBeforeWatering: 'Check soil before watering', waterCaution: 'Depth and interval are estimates. Confirm soil moisture, effective rain, and local crop guidance before watering.',
  },
  te: {
    stage: 'పంట పెరుగుదల దశ', soil: 'ఈ రోజు నేల తేమ', unknown: 'తెలియదు', dry: 'పొడి', normal: 'తేమగా', wet: 'చాలా తడి',
    getPlan: 'పంట కాల ప్రణాళిక పొందండి', updatePlan: 'పొలం వివరాలు సేవ్ చేసి ప్రణాళిక మార్చండి', loading: 'ప్రణాళిక సిద్ధమవుతోంది…', planError: 'ప్రణాళిక తెరవలేకపోయాం. బ్యాకెండ్ నడుస్తుందో చూసి మళ్లీ ప్రయత్నించండి.',
    current: 'ప్రస్తుత పరిస్థితులు', weatherUnavailable: 'ప్రత్యక్ష వాతావరణ సమాచారం అందుబాటులో లేదు', rain: 'తదుపరి 7 రోజుల వర్షం', humidity: 'తేమ', temperature: 'ఉష్ణోగ్రత',
    recommendation: 'నీటిపారుదల అంచనా', amount: 'ఒక్కసారి నీటి పరిమాణం', frequency: 'సాధారణ విరామం', next: 'తదుపరి తనిఖీ', reason: 'ప్రణాళిక వివరణ',
    pest: 'చీడపీడల పరిశీలన మరియు చర్యలు', noSpray: 'తేదీ ప్రకారం మందు పిచికారీ సూచించలేదు. ముందుగా చీడపీడను గుర్తించి, తర్వాతే చర్యను పరిశీలించండి.',
    fieldUpdate: 'పొలం నుంచి తాజా సమాచారం', updateHelp: 'ఈ రోజు పొలంలో కనిపిస్తున్న పరిస్థితులను నమోదు చేయండి. తదుపరి ప్రణాళిక వాటిని పరిగణిస్తుంది.', pestFound: 'చీడపీడ లేదా వ్యాధి లక్షణాలు కనిపించాయా?', yes: 'అవును', no: 'లేదు', pestDetails: 'ఏ లక్షణాలు కనిపించాయి? (ఐచ్ఛికం)',
    pesticide: 'గత ప్రణాళిక తర్వాత మందు వాడకం', notUsed: 'వాడలేదు', used: 'వాడాను', unsure: 'నిశ్చయం లేదు', product: 'మందు పేరు (ఐచ్ఛికం)', applicationDate: 'వాడిన తేదీ', fieldNotes: 'ఇతర పంట పరిశీలనలు', notesPlaceholder: 'పెరుగుదల, ఆకుల రంగు, నిలిచిన నీరు లేదా మారిన పరిస్థితులు…',
    organic: 'సేంద్రియ పోషక ఎంపికలు', shop: 'దుకాణాల్లో ధరలను పోల్చండి', quality: 'డెలివరీతో కలిపిన కిలో ధర, విక్రేత రేటింగ్, పదార్థాల వివరాలు, గడువు, సేంద్రియ/FCO పత్రాలను పోల్చండి. ప్రాంతాన్ని బట్టి ధరలు మారుతాయి.',
    inputs: 'సూచించిన పదార్థాలు', scheduleSource: 'Gemini పంట కాల ప్రణాళిక', rainChance: 'వర్ష అవకాశం', notAvailable: '—', fieldArea: 'పొలం విస్తీర్ణం', selectStage: 'ప్రస్తుత దశ ఎంచుకోండి',
    about: 'సుమారు ప్రతి', days: 'రోజులకు', checkBeforeWatering: 'నీరు పెట్టే ముందు నేల చూడండి', waterCaution: 'నీటి లోతు, విరామం అంచనాలు మాత్రమే. నీరు పెట్టే ముందు నేల తేమ, వర్షం, స్థానిక పంట సలహా పరిశీలించండి.',
  },
  hi: {
    stage: 'फसल की वृद्धि अवस्था', soil: 'आज मिट्टी की नमी', unknown: 'पता नहीं', dry: 'सूखी', normal: 'नम', wet: 'गीली',
    getPlan: 'पूरी फसल अवधि की योजना बनाएं', updatePlan: 'खेत की जानकारी सहेजें और योजना बदलें', loading: 'योजना तैयार हो रही है…', planError: 'योजना नहीं खुल सकी। बैकएंड की स्थिति जाँचकर फिर प्रयास करें।',
    current: 'मौजूदा स्थिति', weatherUnavailable: 'लाइव मौसम उपलब्ध नहीं', rain: 'अगले 7 दिनों की बारिश', humidity: 'नमी', temperature: 'तापमान',
    recommendation: 'सिंचाई का अनुमान', amount: 'हर सिंचाई में पानी', frequency: 'सामान्य अंतराल', next: 'अगली जाँच', reason: 'योजना का कारण',
    pest: 'कीट निगरानी और कार्रवाई', noSpray: 'किसी तय तारीख पर छिड़काव नहीं रखा गया है। पहले कीट की पहचान करें, फिर कार्रवाई पर विचार करें।',
    fieldUpdate: 'खेत से नई जानकारी', updateHelp: 'आज खेत में जो दिख रहा है, उसे दर्ज करें। अगली योजना इन बातों को ध्यान में रखेगी।', pestFound: 'क्या कीट या बीमारी के लक्षण दिखे?', yes: 'हाँ', no: 'नहीं', pestDetails: 'क्या लक्षण दिखे? (वैकल्पिक)',
    pesticide: 'पिछली योजना के बाद कीटनाशक का उपयोग', notUsed: 'नहीं किया', used: 'किया', unsure: 'निश्चित नहीं', product: 'उत्पाद का नाम (वैकल्पिक)', applicationDate: 'उपयोग की तारीख', fieldNotes: 'फसल के अन्य निरीक्षण', notesPlaceholder: 'वृद्धि, पत्तियों का रंग, खेत में पानी या कोई बदलाव…',
    organic: 'जैविक पोषण विकल्प', shop: 'दुकानों की तुलना करें', quality: 'डिलीवरी सहित प्रति किलो कीमत, विक्रेता रेटिंग, संरचना, समाप्ति तिथि और वैध जैविक/FCO दस्तावेज़ जाँचें। कीमत और उपलब्धता स्थान के अनुसार बदलती है।',
    inputs: 'सुझाए गए इनपुट', scheduleSource: 'Gemini फसल-अवधि योजना', rainChance: 'बारिश की संभावना', notAvailable: '—', fieldArea: 'खेत का क्षेत्रफल', selectStage: 'मौजूदा अवस्था चुनें',
    about: 'लगभग हर', days: 'दिन', checkBeforeWatering: 'पानी देने से पहले मिट्टी जाँचें', waterCaution: 'पानी की मात्रा और अंतराल अनुमान हैं। सिंचाई से पहले मिट्टी की नमी, प्रभावी बारिश और स्थानीय फसल सलाह जाँचें।',
  },
};

const DEFAULT_CROP_DURATIONS: Record<string, number> = {
  Paddy: 125, Maize: 100, Groundnut: 112, Chilli: 160, Cotton: 165,
  Turmeric: 240, Sugarcane: 365, Tomato: 100, Onion: 120,
  'Red Gram': 170, 'Black Gram': 75, 'Green Gram': 70, Sesame: 95,
};
const CROP_DURATION_RANGES: Record<string, string> = {
  Paddy: '110–150', Maize: '85–120', Groundnut: '100–125', Chilli: '120–210', Cotton: '150–190',
  Turmeric: '210–270', Sugarcane: '300–365', Tomato: '90–140', Onion: '100–150',
  'Red Gram': '150–220', 'Black Gram': '65–90', 'Green Gram': '55–85', Sesame: '80–110',
};

const CYCLE_PHASES = [
  { progress: 0, stage: 'Establishment', title: 'Establish the crop', action: 'Check plant establishment, gaps, and soil moisture; use the seed or transplant guidance for your variety.' },
  { progress: 0.15, stage: 'Vegetative growth', title: 'Support vegetative growth', action: 'Inspect growth and weeds. Base nutrient choices on a soil test and water only when root-zone moisture requires it.' },
  { progress: 0.4, stage: 'Flowering', title: 'Protect flowering', action: 'Keep moisture as even as practical. Scout for pests and disease and confirm identification before treatment.' },
  { progress: 0.62, stage: 'Reproductive development', title: 'Check fruit, pod, or reproductive growth', action: 'Inspect crop-specific development. Avoid water stress and waterlogging; respond to verified field observations.' },
  { progress: 0.78, stage: 'Filling / bulb development', title: 'Monitor filling or bulb growth', action: 'Check soil moisture and crop development. Adjust irrigation for crop need and effective rainfall.' },
  { progress: 0.9, stage: 'Maturation', title: 'Prepare for maturity', action: 'Avoid unnecessary irrigation as the crop approaches maturity; follow variety-specific local harvest guidance.' },
  { progress: 1, stage: 'Harvest readiness', title: 'Check harvest readiness', action: 'Confirm maturity using crop and variety guidance, then plan safe harvest, drying, and storage.' },
];

const STAGE_PROGRESS: Record<string, number> = {
  'Seedling Stage': 0, 'Vegetative Stage': 0.15, 'Flowering Stage': 0.4,
  'Fruiting / Pod Formation': 0.62, 'Grain / Bulb Development': 0.76, 'Maturity Stage': 0.9,
};

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildLocalCyclePlan = (duration: number, stage: string) => {
  const currentDay = Math.round(duration * (STAGE_PROGRESS[stage] ?? 0.15));
  return CYCLE_PHASES
    .map((phase) => ({ ...phase, days_from_now: Math.max(0, Math.round(duration * phase.progress) - currentDay) }))
    .filter((phase) => Math.round(duration * phase.progress) >= currentDay)
    .map((phase) => ({ ...phase, date: addDays(phase.days_from_now), category: 'field_work' }));
};

const buildLocalWeekPlan = () => [
  ['scouting', 'Check crop and soil moisture', 'Inspect several parts of the field and check moisture around the active roots.'],
  ['irrigation', 'Review irrigation need', 'Use the crop estimate only as a guide; irrigate only if soil moisture and crop condition call for it.'],
  ['scouting', 'Scout for pest or disease signs', 'Record affected plants and plant parts; seek local identification if symptoms are unclear.'],
  ['field_work', 'Check the water system', 'Look for leaks, blocked emitters or channels, runoff, and standing water.'],
  ['nutrition', 'Review crop nutrition', 'Use a soil test and crop stage before choosing an input; follow the product label.'],
  ['irrigation', 'Recheck soil moisture', 'Account for effective rain and avoid watering a wet root zone.'],
  ['scouting', 'Update field observations', 'Record crop stage, moisture, symptoms, and any treatment actually used.'],
].map(([category, title, action], index) => ({ category, title, action, date: addDays(index) }));

const WeatherMetric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-2.5 text-center shadow-2xs">
    {icon}
    <p className="mt-1 text-sm font-extrabold text-[#102D20]">{value}</p>
    <p className="text-[10px] font-medium text-gray-500">{label}</p>
  </div>
);

export const IrrigationScreen: React.FC<IrrigationScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onBack,
}) => {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] as 'en' | 'te' | 'hi';
  const copy = irrigationCopy[language] || irrigationCopy.en;
  const aiStatusText: Record<string, Record<string, string>> = {
    generated: { en: 'Gemini AI generated this plan', te: 'Gemini AI ఈ ప్రణాళికను రూపొందించింది', hi: 'यह योजना Gemini AI ने बनाई' },
    generated_fallback_model: { en: 'Gemini Flash-Lite generated this plan after primary quota ran out', te: 'ప్రధాన మోడల్ పరిమితి తర్వాత Gemini Flash-Lite ఈ ప్రణాళికను రూపొందించింది', hi: 'मुख्य मॉडल की सीमा पर Gemini Flash-Lite ने यह योजना बनाई' },
    missing_key: { en: 'Gemini API key is missing', te: 'Gemini API కీ లేదు', hi: 'Gemini API key उपलब्ध नहीं है' },
    invalid_key: { en: 'Gemini API key was rejected', te: 'Gemini API కీ తిరస్కరించబడింది', hi: 'Gemini API key अस्वीकार हुई' },
    network_error: { en: 'Gemini could not be reached', te: 'Gemini సేవను చేరుకోలేకపోయాం', hi: 'Gemini सेवा से संपर्क नहीं हो पाया' },
    timeout: { en: 'Gemini request timed out', te: 'Gemini అభ్యర్థనకు సమయం ముగిసింది', hi: 'Gemini अनुरोध का समय समाप्त हुआ' },
    quota: { en: 'Gemini API quota reached', te: 'Gemini API వినియోగ పరిమితి చేరింది', hi: 'Gemini API की उपयोग सीमा पूरी हुई' },
    model_not_found: { en: 'Gemini model is unavailable', te: 'Gemini మోడల్ అందుబాటులో లేదు', hi: 'Gemini मॉडल उपलब्ध नहीं है' },
    invalid_response: { en: 'Gemini returned an unusable plan', te: 'Gemini ప్రణాళికను ఉపయోగించలేకపోయాం', hi: 'Gemini की योजना उपयोग योग्य नहीं थी' },
    unsafe_response: { en: 'Gemini response was withheld for safety', te: 'భద్రత కోసం Gemini సమాధానం చూపలేదు', hi: 'सुरक्षा के लिए Gemini का उत्तर रोका गया' },
    empty_response: { en: 'Gemini returned no plan text', te: 'Gemini ప్రణాళికను ఇవ్వలేదు', hi: 'Gemini ने योजना नहीं दी' },
    api_error: { en: 'Gemini API returned an error', te: 'Gemini API లోపం ఇచ్చింది', hi: 'Gemini API ने त्रुटि दी' },
    api_error_400: { en: 'Gemini rejected the request (HTTP 400)', te: 'Gemini అభ్యర్థనను తిరస్కరించింది (HTTP 400)', hi: 'Gemini ने अनुरोध अस्वीकार किया (HTTP 400)' },
    backend_outdated: { en: 'Plan generated locally; restart backend for Gemini status', te: 'స్థానిక ప్రణాళిక; Gemini స్థితి కోసం బ్యాకెండ్‌ను పునఃప్రారంభించండి', hi: 'स्थानीय योजना; Gemini स्थिति के लिए बैकएंड पुनः चालू करें' },
  };
  const [selectedCrop, setSelectedCrop] = useState<string>('Paddy');
  const [cropDurationDays, setCropDurationDays] = useState<number>(DEFAULT_CROP_DURATIONS.Paddy);
  const [waterSource, setWaterSource] = useState<string>('Canal');
  const [growthStage, setGrowthStage] = useState<string>('Vegetative Stage');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [planData, setPlanData] = useState<any>(null);
  const [supabaseConnectionStatus, setSupabaseConnectionStatus] = useState<'connected' | 'not_configured' | 'authentication_failed' | 'unreachable' | 'unknown'>('unknown');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldUpdate, setFieldUpdate] = useState({
    soil_moisture: 'unknown' as 'dry' | 'normal' | 'wet' | 'unknown',
    pest_observed: false,
    pest_description: '',
    pesticide_status: 'not_used' as 'not_used' | 'used' | 'not_sure',
    pesticide_name: '',
    last_application_date: '',
    notes: '',
  });
  const aiStatus = planData?.ai_status || 'api_error';
  const aiStatusLabel = (aiStatusText[aiStatus] || (aiStatus.startsWith('api_error_')
    ? { en: `Gemini API error (HTTP ${aiStatus.slice('api_error_'.length)})`, te: `Gemini API లోపం (HTTP ${aiStatus.slice('api_error_'.length)})`, hi: `Gemini API त्रुटि (HTTP ${aiStatus.slice('api_error_'.length)})` }
    : aiStatusText.api_error))[language] || aiStatusText.api_error.en;
  const cycleLabels = language === 'te'
    ? { title: 'పూర్తి పంట సాగు ప్రణాళిక', duration: 'సాధారణ పంట కాలం', remaining: 'ఇంకా మిగిలిన రోజులు', harvest: 'అంచనా కోత తేదీ', estimate: 'రకం, సీజన్ ఆధారంగా అంచనా; స్థానిక సలహాతో నిర్ధారించండి.', source: 'దశల వారీ అంచనా' }
    : language === 'hi'
      ? { title: 'पूरी फसल अवधि की योजना', duration: 'सामान्य फसल अवधि', remaining: 'शेष दिन', harvest: 'अनुमानित कटाई तारीख', estimate: 'किस्म और मौसम के अनुसार अनुमान; स्थानीय सलाह से पुष्टि करें.', source: 'अवस्था के अनुसार अनुमान' }
      : { title: 'Full crop-cycle plan', duration: 'Typical crop duration', remaining: 'Days remaining', harvest: 'Estimated harvest date', estimate: 'Duration is an estimate by variety and season; confirm with local crop guidance.', source: 'Stage-based estimate' };

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5 },
    { id: 2, village: 'Tanuku', acreage: 1.8 },
    { id: 3, village: 'Narsapuram', acreage: 3.2 },
    { id: 4, village: 'Eluru', acreage: 1.0 }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const activeFarm = selectedFarm || displayFarms[0];
  const weatherIsCurrent = planData?.weather_source === 'forecast';
  const weatherIsStale = planData?.weather_source === 'stale_forecast';
  const weatherHasValues = weatherIsCurrent || weatherIsStale;
  const weatherStaleText = copy.weatherStale || 'Showing last available weather data; it may be outdated';
  const supabaseBadgeText = planData?.supabase_saved === true
    ? 'Irrigation plan saved to Supabase'
    : planData?.supabase_saved === false
      ? supabaseConnectionStatus === 'connected'
        ? 'Supabase connected; plan save failed'
        : supabaseConnectionStatus === 'not_configured'
          ? 'Supabase not configured on backend'
          : supabaseConnectionStatus === 'authentication_failed'
            ? 'Supabase key rejected'
            : 'Supabase connection unavailable'
      : supabaseConnectionStatus === 'connected'
        ? 'Supabase connected'
        : supabaseConnectionStatus === 'not_configured'
          ? 'Supabase not configured on backend'
          : supabaseConnectionStatus === 'authentication_failed'
            ? 'Supabase key rejected'
            : supabaseConnectionStatus === 'unreachable'
              ? 'Supabase host unreachable'
              : 'Supabase status unavailable';
  const supabaseBadgeConnected = planData?.supabase_saved === true || supabaseConnectionStatus === 'connected';

  const crops = [
    { id: 'Paddy', name: 'Paddy', color: 'amber' },
    { id: 'Maize', name: 'Maize', color: 'yellow' },
    { id: 'Groundnut', name: 'Groundnut', color: 'orange' },
    { id: 'Chilli', name: 'Chilli', color: 'red' },
    { id: 'Cotton', name: 'Cotton', color: 'slate' },
    { id: 'Turmeric', name: 'Turmeric', color: 'amber' },
    { id: 'Sugarcane', name: 'Sugarcane', color: 'green' },
    { id: 'Tomato', name: 'Tomato', color: 'red' },
    { id: 'Onion', name: 'Onion', color: 'purple' },
    { id: 'Red Gram', name: 'Red Gram', color: 'rose' },
    { id: 'Black Gram', name: 'Black Gram', color: 'slate' },
    { id: 'Green Gram', name: 'Green Gram', color: 'emerald' }
  ];

  const waterSources = [
    { id: 'Canal', name: 'Canal' },
    { id: 'Borewell', name: 'Borewell' },
    { id: 'Tank/Pond', name: 'Tank/Pond' },
    { id: 'Drip System', name: 'Drip System' }
  ];
  const growthStages = ['Seedling Stage', 'Vegetative Stage', 'Flowering Stage', 'Fruiting / Pod Formation', 'Grain / Bulb Development', 'Maturity Stage'];

  const handleGetPlan = async (update: typeof fieldUpdate | undefined = undefined) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getIrrigationPlan(activeFarm.id || 1, selectedCrop, waterSource, growthStage, language, update, cropDurationDays);
      try {
        const status: SupabaseStatus = await api.getSupabaseStatus();
        const url = status.url?.trim() || '';
        const urlConfigured = /^https:\/\//i.test(url) && !url.toLowerCase().includes('your-supabase-project');
        if (status.status === 'connected' && status.connected === true && urlConfigured) {
          setSupabaseConnectionStatus('connected');
        } else if (status.status === 'not_configured' || !urlConfigured) {
          // Older backend versions reported `ready` even with the example URL.
          setSupabaseConnectionStatus('not_configured');
        } else if (status.status === 'authentication_failed') {
          setSupabaseConnectionStatus('authentication_failed');
        } else if (status.status === 'unreachable') {
          setSupabaseConnectionStatus('unreachable');
        } else {
          setSupabaseConnectionStatus('unknown');
        }
      } catch {
        setSupabaseConnectionStatus('unknown');
      }
      const localizedFallback = language === 'te'
        ? {
            pestHeadline: 'ముందుగా పంటను పరిశీలించండి; చీడపీడ నిర్ధారణ లేకుండా మందు పిచికారీ చేయవద్దు.',
            pestActions: ['పొలంలోని వేర్వేరు ప్రాంతాల్లో మొక్కలను పరిశీలించి, ప్రభావిత భాగం మరియు లక్షణాలను నమోదు చేయండి.', 'లక్షణాలు స్పష్టంగా లేకపోతే స్థానిక KVK లేదా వ్యవసాయ అధికారిని సంప్రదించి చీడపీడను గుర్తించండి.', 'ఉపయోగకరమైన కీటకాలను కాపాడండి; నిర్ధారణకు ముందే పురుగుమందు వాడకండి.'],
            next: 'లక్షణాలు కనిపిస్తే వాటి వివరాలను నమోదు చేసి, స్థానిక వ్యవసాయ అధికారితో నిర్ధారించండి.',
            chemical: 'ఏ మందునూ షెడ్యూల్ చేయలేదు. పంట, చీడపీడకు అనుమతించిన లేబుల్ మరియు స్థానిక KVK సలహాను అనుసరించండి.',
            compost: 'బాగా కుళ్లిన కంపోస్ట్ / వర్మీకంపోస్ట్', timing: 'నేల పరీక్ష మరియు స్థానిక పంట దశ సలహా ప్రకారం.', purpose: 'సేంద్రియ పదార్థాన్ని పెంచి నేల నిర్మాణానికి తోడ్పడుతుంది.', nutrients: 'పోషకాలు మూలం, తయారీని బట్టి మారుతాయి; ప్యాకెట్ విశ్లేషణ చూడండి.',
            neem: 'వేపపిండి (స్థానిక సలహా ఉంటే మాత్రమే)', neemPurpose: 'నేల సవరణకు సేంద్రియ ఎంపిక; నేల పరీక్ష లేదా స్థానిక సిఫార్సు ఉన్నప్పుడే వాడండి.',
          }
        : language === 'hi'
          ? {
              pestHeadline: 'पहले फसल की निगरानी करें; कीट की पुष्टि से पहले छिड़काव न करें।',
              pestActions: ['खेत के अलग-अलग हिस्सों में पौधे देखकर प्रभावित भाग और लक्षण दर्ज करें।', 'लक्षण स्पष्ट न हों तो स्थानीय KVK या कृषि अधिकारी से कीट की पहचान कराएँ।', 'लाभकारी कीटों की रक्षा करें; पहचान से पहले कीटनाशक न डालें।'],
              next: 'लक्षण दिखें तो उनका विवरण दर्ज करें और स्थानीय कृषि अधिकारी से पुष्टि लें।',
              chemical: 'कोई दवा तय नहीं की गई है। फसल और कीट के लिए अनुमोदित लेबल तथा स्थानीय KVK सलाह मानें।',
              compost: 'अच्छी तरह पकी कम्पोस्ट / वर्मी-कम्पोस्ट', timing: 'मिट्टी जाँच और स्थानीय फसल-अवस्था सलाह के अनुसार।', purpose: 'जैविक पदार्थ बढ़ाने और मिट्टी की संरचना में मदद के लिए।', nutrients: 'पोषक तत्व स्रोत और उत्पाद के अनुसार बदलते हैं; पैकेट का विश्लेषण देखें।',
              neem: 'नीम खली (केवल स्थानीय सलाह पर)', neemPurpose: 'मिट्टी सुधार का जैविक विकल्प; मिट्टी जाँच या स्थानीय सिफारिश पर ही उपयोग करें।',
            }
          : {
              pestHeadline: 'Scout the crop first; do not spray before the pest is identified.',
              pestActions: ['Inspect plants in several parts of the field and record the affected plant part and symptoms.', 'If symptoms are unclear, ask a local KVK or agriculture officer to identify the pest.', 'Protect beneficial insects and avoid pesticide use before identification.'],
              next: 'If symptoms appear, record them and confirm the cause with a local agriculture officer.',
              chemical: 'No pesticide is scheduled. Follow the current label approved for this crop and pest, and local KVK advice.',
              compost: 'Well-decomposed compost / vermicompost', timing: 'At a crop-stage window confirmed by a soil test or local advice.', purpose: 'Adds organic matter and can support soil structure.', nutrients: 'Nutrient content varies by source and product; check the package analysis.',
              neem: 'Neem cake (only if locally recommended)', neemPurpose: 'An organic soil-amendment option; use only when supported by soil-test or local advice.',
            };
      data.pest_plan ||= {};
      if (typeof data.pest_plan.headline !== 'string' || !data.pest_plan.headline.trim()) data.pest_plan.headline = localizedFallback.pestHeadline;
      data.pest_plan.actions = Array.isArray(data.pest_plan.actions)
        ? data.pest_plan.actions.filter((action: unknown): action is string => typeof action === 'string' && action.trim().length > 0)
        : [];
      if (data.pest_plan.actions.length === 0) data.pest_plan.actions = localizedFallback.pestActions;
      if (typeof data.pest_plan.if_no_spray !== 'string' || !data.pest_plan.if_no_spray.trim() || data.pest_plan.if_no_spray.trim() === data.pest_plan.headline.trim()) {
        data.pest_plan.if_no_spray = localizedFallback.next;
      }
      data.pest_plan.chemical_guidance ||= localizedFallback.chemical;
      if (Array.isArray(data.organic_fertilizers)) {
        data.organic_fertilizers = data.organic_fertilizers.filter((item: any) => item && ['name', 'timing', 'purpose', 'nutrient_profile'].every((key) => typeof item[key] === 'string' && item[key].trim().length > 0));
      }
      if (!Array.isArray(data.organic_fertilizers) || data.organic_fertilizers.length === 0) {
        data.organic_fertilizers = [
          { name: localizedFallback.compost, timing: localizedFallback.timing, purpose: localizedFallback.purpose, nutrient_profile: localizedFallback.nutrients },
          { name: localizedFallback.neem, timing: localizedFallback.timing, purpose: localizedFallback.neemPurpose, nutrient_profile: localizedFallback.nutrients },
        ];
        data.fertilizer_plan_source = 'local_estimate';
      }
      const duration = Number(data?.crop_duration_days) || cropDurationDays;
      data.crop_duration_days = duration;
      data.duration_range_days ||= `${DEFAULT_CROP_DURATIONS[selectedCrop] || duration}`;
      data.days_remaining ??= Math.max(0, duration - Math.round(duration * (STAGE_PROGRESS[growthStage] ?? 0.15)));
      data.harvest_estimate_date ||= addDays(data.days_remaining);
      if (!Array.isArray(data.schedule) || data.schedule.length === 0) data.schedule = buildLocalWeekPlan();
      if (!Array.isArray(data.cultivation_plan) || data.cultivation_plan.length === 0) {
        data.cultivation_plan = buildLocalCyclePlan(duration, growthStage);
        data.cultivation_plan_source = 'local_estimate';
      }
      const nextIrrigation = data.next_date ? new Date(`${String(data.next_date).slice(0, 10)}T00:00:00`) : null;
      if (!nextIrrigation || Number.isNaN(nextIrrigation.getTime()) || nextIrrigation.getTime() < new Date().setHours(0, 0, 0, 0)) {
        data.next_date = addDays(Number(data.frequency_days) || 5);
      }
      data.ai_status ||= 'backend_outdated';
      setPlanData(data);
      setShowResults(true);
    } catch (err) {
      console.error('Irrigation plan error', err);
      setErrorMessage(copy.planError);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof typeof fieldUpdate>(key: K, value: (typeof fieldUpdate)[K]) => {
    setFieldUpdate((current) => ({ ...current, [key]: value }));
  };

  const formatDate = (value?: string) => {
    if (!value) return copy.notAvailable;
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (showResults ? setShowResults(false) : onBack())}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-[#102D20]" />
        </button>
        <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
          <Droplet className="w-6 h-6 fill-sky-500" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Smart Irrigation</h2>
          <p className="text-xs text-[#5A6E65]">
            {showResults ? 'Optimal irrigation for better yield' : 'Optimize water usage • Healthier crops'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {displayFarms.map((farm) => {
          const isSelected = activeFarm.id === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => onSelectFarm && onSelectFarm(farm as any)}
              className={`flex-none w-32 p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                isSelected
                  ? 'bg-white border-[#087A3D] ring-2 ring-[#087A3D]/20 shadow-xs'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#087A3D] shrink-0" />
              <div className="truncate">
                <h4 className="font-extrabold text-xs text-[#102D20] truncate">{farm.village}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{farm.acreage} acres</p>
              </div>
            </button>
          );
        })}
      </div>

      {!showResults ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#087A3D]" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Select Crop</h3>
            </div>
            <p className="text-xs text-gray-500">Choose the crop you want to irrigate</p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {crops.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    onClick={() => { setSelectedCrop(crop.id); setCropDurationDays(DEFAULT_CROP_DURATIONS[crop.id] || 100); }}
                    className={`bg-white border rounded-2xl p-3 text-center transition-all relative flex flex-col items-center justify-center gap-2 shadow-2xs h-28 ${
                      isSelected
                        ? 'border-[#087A3D] bg-[#E7F7E4]/40 ring-2 ring-[#087A3D]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#087A3D] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    <CropIconMapper cropId={crop.id} />

                    <span className="font-extrabold text-xs text-[#102D20]">{crop.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-sky-600" />
              <h3 className="font-extrabold text-sm text-[#102D20]">Select Water Source</h3>
            </div>
            <p className="text-xs text-gray-500">Choose the main water source for this crop</p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {waterSources.map((source) => {
                const isSelected = waterSource === source.id;
                return (
                  <button
                    key={source.id}
                    onClick={() => setWaterSource(source.id)}
                    className={`bg-white border rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                      isSelected
                        ? 'border-[#087A3D] bg-[#E7F7E4] font-extrabold text-[#087A3D]'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <Droplet className={`w-5 h-5 ${isSelected ? 'text-[#087A3D]' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-bold leading-tight">{source.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block rounded-2xl border border-gray-200 bg-white p-3 shadow-2xs">
            <span className="mb-2 block text-xs font-bold text-[#102D20]">{copy.stage}</span>
            <select value={growthStage} onChange={(event) => setGrowthStage(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-[#102D20] outline-none focus:border-[#087A3D]">
              {growthStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </label>

          <label className="block rounded-2xl border border-gray-200 bg-white p-3 shadow-2xs">
            <span className="mb-1 block text-xs font-bold text-[#102D20]">{language === 'te' ? 'ఈ రకం పంట కాలం (రోజులు)' : language === 'hi' ? 'इस किस्म की फसल अवधि (दिन)' : 'Expected crop duration for this variety (days)'}</span>
            <span className="mb-2 block text-[10px] leading-relaxed text-gray-500">{language === 'te' ? 'రకం, సీజన్‌ను బట్టి సాధారణ అంచనా మారవచ్చు. విత్తన ప్యాకెట్ లేదా స్థానిక సలహా ఆధారంగా సవరించండి.' : language === 'hi' ? 'किस्म और मौसम के अनुसार अवधि बदलती है। बीज पैकेट या स्थानीय सलाह के अनुसार इसे बदलें.' : `Typical range for ${selectedCrop}: ${CROP_DURATION_RANGES[selectedCrop] || 'varies by variety'} days. Adjust for your seed variety and local crop advice.`}</span>
            <input type="number" min={30} max={800} step={1} value={cropDurationDays} onChange={(event) => setCropDurationDays(Math.min(800, Math.max(30, Number(event.target.value) || DEFAULT_CROP_DURATIONS[selectedCrop] || 100)))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-[#102D20] outline-none focus:border-[#087A3D]" />
          </label>

          {errorMessage && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMessage}</p>}

          <button
            onClick={() => { void handleGetPlan(); }}
            disabled={loading}
            className="w-full bg-[#07552F] hover:bg-[#087A3D] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors mt-4"
          >
            <span>{loading ? copy.loading : copy.getPlan}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <CropIconMapper cropId={planData?.crop || selectedCrop} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-[#102D20]">{planData?.crop || selectedCrop}</h3>
                  <span className="bg-[#E7F7E4] border border-green-300 text-[#087A3D] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    {planData?.stage || 'Vegetative Stage'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Field area: {planData?.acreage || activeFarm.acreage || 2.5} acres
                </p>
                <span role="status" className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${planData?.ai_generated ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                  {aiStatusLabel}
                </span>
                <span role="status" className={`ml-1 mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${supabaseBadgeConnected ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {supabaseBadgeText}
                </span>
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#102D20]"><Sparkles className="w-4 h-4 text-[#087A3D]" /><span>{copy.current}</span></div>
              <div className="max-w-[58%] text-right text-[10px] font-semibold text-gray-600"><div className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3 text-[#087A3D]" />{planData?.village || activeFarm.village}</div><div>{weatherIsCurrent ? planData?.updated_at : weatherIsStale ? `${planData?.updated_at} · ${weatherStaleText}` : copy.weatherUnavailable}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <WeatherMetric icon={<Thermometer className="w-5 h-5 text-rose-500 mx-auto" />} label={copy.temperature} value={weatherHasValues && planData?.temp != null ? `${planData.temp}°C` : copy.notAvailable} />
              <WeatherMetric icon={<CloudRain className="w-5 h-5 text-sky-500 mx-auto" />} label={copy.rain} value={weatherIsCurrent && planData?.rainfall_7d != null ? `${planData.rainfall_7d} mm` : copy.notAvailable} />
              <WeatherMetric icon={<Droplet className="w-5 h-5 text-emerald-500 mx-auto" />} label={copy.humidity} value={weatherHasValues && planData?.humidity != null ? `${planData.humidity}%` : copy.notAvailable} />
              <WeatherMetric icon={<Sun className="w-5 h-5 text-amber-400 mx-auto" />} label="Weather" value={weatherHasValues ? planData?.weather || copy.notAvailable : copy.notAvailable} />
            </div>
            {weatherIsStale && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-950">{weatherStaleText}</p>}
            {!weatherHasValues && <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-semibold leading-relaxed text-sky-950">{language === 'te' ? 'ప్రత్యక్ష వాతావరణ సమాచారం అందలేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి; అంచనా సంఖ్యలతో నీటిపారుదల నిర్ణయం తీసుకోవద్దు.' : language === 'hi' ? 'लाइव मौसम डेटा नहीं मिला। थोड़ी देर बाद फिर कोशिश करें; अनुमानित आँकड़ों के आधार पर सिंचाई न करें।' : 'The live weather service did not return data. Try again shortly; do not use guessed weather values to decide irrigation.'}</p>}
            {weatherIsCurrent && planData?.forecast?.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{planData.forecast.slice(0, 7).map((day: any, index: number) => <div key={`${day.date}-${index}`} className="min-w-[82px] rounded-xl border border-sky-100 bg-sky-50/70 p-2 text-center"><p className="text-[10px] font-bold text-gray-600">{day.date}</p><p className="text-xs font-extrabold text-[#102D20]">{day.max_temp != null ? `${day.max_temp}°` : '—'} / {day.min_temp != null ? `${day.min_temp}°C` : '—'}</p><p className="text-[10px] text-sky-700">{copy.rainChance} {day.rain_chance != null ? `${day.rain_chance}%` : '—'}</p></div>)}</div>}
          </section>

          <section className="rounded-3xl border border-sky-100 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2"><Droplet className="w-5 h-5 text-sky-600 fill-sky-300" /><h3 className="font-extrabold text-sm text-[#102D20]">{copy.recommendation}</h3></div>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-800">{waterSource}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div><p className="text-[10px] font-semibold text-gray-500">{copy.amount}</p><p className="mt-1 text-lg font-black text-sky-700">{planData?.depth_max === 0 ? copy.checkBeforeWatering : `${planData?.depth_min ?? 0}–${planData?.depth_max ?? 0} mm`}</p><p className="mt-1 text-[10px] font-medium text-gray-600">{planData?.volume_label || copy.notAvailable}</p></div>
              <div className="border-l border-gray-100 pl-3"><p className="text-[10px] font-semibold text-gray-500">{copy.frequency}</p><p className="mt-1 text-lg font-black text-[#087A3D]">{copy.about} {planData?.frequency_days ?? '?'} {copy.days}</p><div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-gray-600"><Calendar className="w-3.5 h-3.5 text-rose-500" />{copy.next}: {formatDate(planData?.next_date)}</div></div>
            </div>
            <p className="rounded-2xl bg-sky-50 p-3 text-xs leading-relaxed text-[#183f58]">{planData?.summary || planData?.why_recommendation}</p>
            <p className="flex gap-2 text-[10px] leading-relaxed text-gray-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{copy.waterCaution}</p>
          </section>

          <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-violet-700" /><h3 className="font-extrabold text-sm text-[#102D20]">{cycleLabels.title}</h3></div>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold text-violet-800">{planData?.cultivation_plan_source === 'gemini' ? copy.scheduleSource : cycleLabels.source}</span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">{cycleLabels.estimate}</p>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-violet-50/70 p-3 text-center">
              <div><p className="text-[9px] text-gray-500">{cycleLabels.duration}</p><p className="text-sm font-extrabold text-violet-900">{planData?.crop_duration_days || cropDurationDays} {copy.days}</p><p className="text-[9px] text-gray-500">{planData?.duration_range_days || CROP_DURATION_RANGES[selectedCrop]} {copy.days}</p></div>
              <div><p className="text-[9px] text-gray-500">{cycleLabels.remaining}</p><p className="text-sm font-extrabold text-violet-900">{planData?.days_remaining ?? '—'} {copy.days}</p></div>
              <div><p className="text-[9px] text-gray-500">{cycleLabels.harvest}</p><p className="text-[10px] font-extrabold text-violet-900">{formatDate(planData?.harvest_estimate_date)}</p></div>
            </div>
            <div className="space-y-2">
              {(planData?.cultivation_plan || []).map((item: any, index: number) => <article key={`${item.stage}-${index}`} className="flex gap-3 rounded-2xl border border-violet-100 bg-[#fcfbff] p-3"><div className="min-w-[72px] rounded-xl bg-violet-50 px-2 py-1 text-center"><span className="block text-[9px] font-bold uppercase text-violet-700">{item.days_from_now === 0 ? (language === 'te' ? 'ఇప్పుడు' : language === 'hi' ? 'अब' : 'Now') : `${item.days_from_now} ${copy.days}`}</span><span className="block text-[10px] font-extrabold text-[#102D20]">{formatDate(item.date)}</span></div><div className="min-w-0"><p className="text-[10px] font-bold text-violet-700">{item.stage}</p><p className="text-xs font-extrabold text-[#102D20]">{item.title}</p><p className="mt-1 text-[11px] leading-relaxed text-gray-600">{item.action}</p></div></article>)}
              {(!planData?.cultivation_plan || planData.cultivation_plan.length === 0) && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{language === 'te' ? 'పంట దశల ప్రణాళిక అందుబాటులో లేదు. బ్యాకెండ్‌ను పునఃప్రారంభించి మళ్లీ ప్రణాళిక పొందండి.' : language === 'hi' ? 'फसल-अवस्था योजना उपलब्ध नहीं है। बैकएंड पुनः चालू करके योजना फिर लें.' : 'The crop-cycle plan is unavailable. Restart the backend and request the plan again.'}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2"><Bug className="h-6 w-6 text-amber-700" /><h3 className="font-extrabold text-base text-[#102D20]">{copy.pest}</h3></div>
            <p className="rounded-2xl bg-white p-4 text-sm font-semibold leading-relaxed text-amber-950">{planData?.pest_plan?.headline || copy.noSpray}</p>
            <ul className="space-y-2">{(planData?.pest_plan?.actions || []).map((action: string, index: number) => <li key={index} className="flex gap-2.5 rounded-xl bg-white/80 p-3 text-sm leading-relaxed text-gray-800"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />{action}</li>)}</ul>
            <div className="rounded-2xl border border-amber-200 bg-white p-4"><p className="text-sm font-extrabold text-amber-950">{language === 'te' ? 'తదుపరి చర్య' : language === 'hi' ? 'अगला कदम' : 'What to do next'}</p><p className="mt-1 text-sm leading-relaxed text-gray-800">{planData?.pest_plan?.if_no_spray || copy.noSpray}</p><p className="mt-2 text-sm font-semibold leading-relaxed text-gray-800">{planData?.pest_plan?.chemical_guidance}</p></div>

            <div className="border-t border-amber-200 pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Leaf className="h-6 w-6 text-emerald-700" /><h4 className="text-base font-extrabold text-[#102D20]">{copy.organic}</h4></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-900">{planData?.fertilizer_plan_source === 'gemini' ? copy.scheduleSource : (language === 'te' ? 'వ్యవసాయ అంచనా' : language === 'hi' ? 'कृषि अनुमान' : 'Agronomy estimate')}</span></div>
              <p className="mb-3 text-sm leading-relaxed text-gray-800">{language === 'te' ? 'పంట దశకు సరిపోయే సేంద్రియ పోషక ఎంపికలు. ఖచ్చితమైన మోతాదుకు నేల పరీక్ష మరియు స్థానిక సలహాను అనుసరించండి.' : language === 'hi' ? 'फसल अवस्था के अनुसार जैविक पोषण विकल्प। सही मात्रा के लिए मिट्टी जाँच और स्थानीय सलाह लें।' : 'Organic nutrient options matched to the crop stage. Use a soil test and local advice to confirm the rate.'}</p>
              <div className="space-y-3">{(planData?.organic_fertilizers || []).map((input: any, index: number) => {
                const query = encodeURIComponent(input.name || 'organic fertilizer');
                const stores = [
                  { name: 'BigHaat', url: `https://www.bighaat.com/search?q=${query}` },
                  { name: 'Amazon India', url: `https://www.amazon.in/s?k=${query}&s=price-asc-rank` },
                  { name: 'Flipkart', url: `https://www.flipkart.com/search?q=${query}&sort=price_asc` },
                ];
                return <article key={`${input.name}-${index}`} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <h5 className="text-base font-extrabold text-[#102D20]">{input.name}</h5>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">{language === 'te' ? 'ఎప్పుడు' : language === 'hi' ? 'कब दें' : 'When to apply'}</p><p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900">{input.timing}</p></div>
                    <div className="rounded-xl bg-sky-50 p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-sky-900">{language === 'te' ? 'ఉద్దేశ్యం' : language === 'hi' ? 'उद्देश्य' : 'Purpose'}</p><p className="mt-1 text-sm leading-relaxed text-gray-900">{input.purpose}</p></div>
                  </div>
                  <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3"><p className="text-xs font-extrabold uppercase tracking-wide text-gray-800">{language === 'te' ? 'పోషకాలు / పదార్థాలు' : language === 'hi' ? 'पोषक तत्व / सामग्री' : 'Nutrients / materials'}</p><p className="mt-1 text-sm leading-relaxed text-gray-800">{input.nutrient_profile}</p><p className="mt-2 text-sm font-bold leading-relaxed text-rose-800">{language === 'te' ? 'హానికర రసాయనాల స్థితి: ఉత్పత్తి లేబుల్‌తో ధృవీకరించాలి. సేంద్రియం అని మాత్రమే చూసి రసాయనరహితం అని భావించవద్దు.' : language === 'hi' ? 'हानिकारक रसायन स्थिति: उत्पाद के लेबल से जाँचें। केवल जैविक लिखे होने से रसायन-मुक्त न मानें।' : 'Harmful-chemical status: not verified for a specific product. Check its label and certification; “organic” alone does not prove chemical-free.'}</p></div>
                  <div className="mt-3"><p className="mb-2 text-xs font-extrabold text-gray-800">{language === 'te' ? 'దుకాణాల్లో పోల్చి కొనండి' : language === 'hi' ? 'दुकानों पर तुलना करके खरीदें' : 'Compare stores and buy'}</p><div className="flex flex-wrap gap-2">{stores.map((store) => <a key={store.name} href={store.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100"><ShoppingBag className="h-4 w-4" />{store.name}<ExternalLink className="h-3.5 w-3.5" /></a>)}</div></div>
                </article>;
              })}
              {(!planData?.organic_fertilizers || planData.organic_fertilizers.length === 0) && <p className="rounded-xl border border-amber-300 bg-white p-3 text-sm font-semibold text-amber-950">{language === 'te' ? 'సేంద్రియ ఎరువుల ప్రణాళిక అందుబాటులో లేదు. మళ్లీ ప్రణాళిక పొందండి.' : language === 'hi' ? 'जैविक खाद योजना उपलब्ध नहीं है। योजना फिर से बनाएँ।' : 'Organic fertilizer recommendations are not available. Request the plan again.'}</p>}</div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
            <div><div className="flex items-center gap-2"><Sprout className="h-5 w-5 text-[#087A3D]" /><h3 className="font-extrabold text-sm text-[#102D20]">{copy.fieldUpdate}</h3></div><p className="mt-1 text-[11px] leading-relaxed text-gray-500">{copy.updateHelp}</p></div>
            <form onSubmit={(event) => { event.preventDefault(); void handleGetPlan(fieldUpdate); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-gray-600">{copy.stage}<select value={growthStage} onChange={(event) => setGrowthStage(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2.5 text-xs font-semibold text-[#102D20]"><option>Seedling Stage</option><option>Vegetative Stage</option><option>Flowering Stage</option><option>Fruiting / Pod Formation</option><option>Grain / Bulb Development</option><option>Maturity Stage</option></select></label>
                <label className="text-[11px] font-bold text-gray-600">{copy.soil}<select value={fieldUpdate.soil_moisture} onChange={(event) => updateField('soil_moisture', event.target.value as typeof fieldUpdate.soil_moisture)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2.5 text-xs font-semibold text-[#102D20]"><option value="unknown">{copy.unknown}</option><option value="dry">{copy.dry}</option><option value="normal">{copy.normal}</option><option value="wet">{copy.wet}</option></select></label>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-xs font-semibold text-[#102D20]"><input type="checkbox" checked={fieldUpdate.pest_observed} onChange={(event) => updateField('pest_observed', event.target.checked)} className="h-4 w-4 accent-[#087A3D]" />{copy.pestFound}</label>
              {fieldUpdate.pest_observed && <input value={fieldUpdate.pest_description} onChange={(event) => updateField('pest_description', event.target.value)} maxLength={300} placeholder={copy.pestDetails} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:border-[#087A3D]" />}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-gray-600">{copy.pesticide}<select value={fieldUpdate.pesticide_status} onChange={(event) => updateField('pesticide_status', event.target.value as typeof fieldUpdate.pesticide_status)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2.5 text-xs font-semibold text-[#102D20]"><option value="not_used">{copy.notUsed}</option><option value="used">{copy.used}</option><option value="not_sure">{copy.unsure}</option></select></label>
                {fieldUpdate.pesticide_status === 'used' ? <label className="text-[11px] font-bold text-gray-600">{copy.applicationDate}<input type="date" value={fieldUpdate.last_application_date} onChange={(event) => updateField('last_application_date', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold" /></label> : <div />}
              </div>
              {fieldUpdate.pesticide_status === 'used' && <input value={fieldUpdate.pesticide_name} onChange={(event) => updateField('pesticide_name', event.target.value)} maxLength={120} placeholder={copy.product} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:border-[#087A3D]" />}
              <label className="block text-[11px] font-bold text-gray-600">{copy.fieldNotes}<textarea value={fieldUpdate.notes} onChange={(event) => updateField('notes', event.target.value)} maxLength={600} rows={3} placeholder={copy.notesPlaceholder} className="mt-1 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#087A3D]" /></label>
              {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{errorMessage}</p>}
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07552F] px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#087A3D] disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{loading ? copy.loading : copy.updatePlan}</button>
            </form>
          </section>

        </div>
      )}
    </div>
  );
};
