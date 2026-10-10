import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Camera, CheckCircle2, LoaderCircle, ShieldCheck, Sprout, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, type CropDiseaseAssessment, type Farm } from '../services/api';

const copy = {
  en: { title: 'Crop health check', sub: 'Upload a clear photo and describe what changed.', photo: 'Crop photo', choose: 'Choose or take a photo', crop: 'Crop', symptoms: 'What are you seeing?', placeholder: 'For example: yellow spots on older leaves after rain…', analyze: 'Assess crop health', loading: 'Checking image…', photoHelp: 'JPEG, PNG or WebP · up to 6 MB', uncertainty: 'AI image checks are preliminary. Confirm serious or spreading symptoms with your local KVK or agriculture officer.', observations: 'What the photo may show', steps: 'What to do now', organic: 'Organic support options', safety: 'People and food safety', expert: 'When to get expert help', saved: 'Assessment saved to your farm records', notSaved: 'Assessment shown but not saved. Set up the Supabase farmer-tools migration to keep this record.', failed: 'Could not assess this photo.', selectPhoto: 'Select a crop photo to continue', low: 'Low confidence', medium: 'Moderate confidence' },
  te: { title: 'పంట ఆరోగ్య పరిశీలన', sub: 'స్పష్టమైన ఫోటోను అప్‌లోడ్ చేసి, మార్పులను వివరించండి.', photo: 'పంట ఫోటో', choose: 'ఫోటో ఎంచుకోండి లేదా తీయండి', crop: 'పంట', symptoms: 'మీరు ఏమి గమనించారు?', placeholder: 'ఉదా: వర్షం తర్వాత పాత ఆకులపై పసుపు మచ్చలు…', analyze: 'పంట ఆరోగ్యాన్ని పరిశీలించండి', loading: 'ఫోటోను పరిశీలిస్తున్నాం…', photoHelp: 'JPEG, PNG లేదా WebP · గరిష్ఠం 6 MB', uncertainty: 'AI ఫోటో అంచనా ప్రాథమిక సూచన మాత్రమే. లక్షణాలు వ్యాపిస్తే స్థానిక KVK లేదా వ్యవసాయ అధికారిని సంప్రదించండి.', observations: 'ఫోటోలో కనిపించవచ్చినవి', steps: 'ఇప్పుడు చేయాల్సినవి', organic: 'సేంద్రియ సహాయక ఎంపికలు', safety: 'మనుషులు మరియు ఆహార భద్రత', expert: 'నిపుణుల సహాయం ఎప్పుడు తీసుకోవాలి', saved: 'పరిశీలన మీ పొలం రికార్డుల్లో భద్రపరచబడింది', notSaved: 'ఫలితం చూపించాం, కానీ Supabase‌లో ఇంకా భద్రపరచలేదు.', failed: 'ఈ ఫోటోను పరిశీలించలేకపోయాం.', selectPhoto: 'కొనసాగించడానికి పంట ఫోటోను ఎంచుకోండి', low: 'తక్కువ నమ్మకం', medium: 'మధ్యస్థ నమ్మకం' },
  hi: { title: 'फसल स्वास्थ्य जाँच', sub: 'साफ़ फ़ोटो अपलोड करें और बदलाव का विवरण दें।', photo: 'फसल की फ़ोटो', choose: 'फ़ोटो चुनें या लें', crop: 'फसल', symptoms: 'आपको क्या दिख रहा है?', placeholder: 'उदाहरण: बारिश के बाद पुरानी पत्तियों पर पीले धब्बे…', analyze: 'फसल स्वास्थ्य जाँचें', loading: 'फ़ोटो की जाँच हो रही है…', photoHelp: 'JPEG, PNG या WebP · अधिकतम 6 MB', uncertainty: 'AI फ़ोटो जाँच शुरुआती अनुमान है। लक्षण फैलें तो स्थानीय KVK या कृषि अधिकारी से पुष्टि करें।', observations: 'फ़ोटो में संभावित संकेत', steps: 'अभी क्या करें', organic: 'जैविक सहायक विकल्प', safety: 'मानव और खाद्य सुरक्षा', expert: 'विशेषज्ञ से कब मिलें', saved: 'जाँच आपके खेत के रिकॉर्ड में सहेजी गई', notSaved: 'जाँच का परिणाम दिखाया गया है, लेकिन Supabase में सहेजा नहीं गया।', failed: 'इस फ़ोटो की जाँच नहीं हो सकी।', selectPhoto: 'जारी रखने के लिए फसल की फ़ोटो चुनें', low: 'कम भरोसा', medium: 'मध्यम भरोसा' },
} as const;

const resultCopy = {
  en: { detected: 'Possible disease detected', clear: 'No disease signs detected', uncertain: 'Disease could not be confirmed', mismatch: 'Photo does not match the selected crop', mismatchSummary: 'Select the crop shown in the photo and try again.', disease: 'Disease', pesticides: 'Pesticide recommendation', none: 'No safe, crop-matched pesticide recommendation is available. Ask your local KVK.', label: 'Use only if the current Indian label names this crop and disease. Follow its safety instructions.' },
  te: { detected: 'వ్యాధి లక్షణాలు కనిపించాయి', clear: 'వ్యాధి లక్షణాలు స్పష్టంగా లేవు', uncertain: 'వ్యాధిని నిర్ధారించలేకపోయాం', mismatch: 'ఫోటో ఎంచుకున్న పంటకు సరిపోలడం లేదు', mismatchSummary: 'ఫోటోలో కనిపిస్తున్న పంటను ఎంచుకుని, ప్రభావిత ఆకుల స్పష్టమైన దగ్గరి ఫోటోను అప్‌లోడ్ చేయండి.', disease: 'సంభావ్య వ్యాధి', pesticides: 'పురుగుమందు ఎంపికలు', none: 'ఈ ఫోటో ఆధారంగా పురుగుమందు సూచన లేదు.', label: 'ప్రస్తుత భారతీయ లేబుల్‌లో ఈ పంట, వ్యాధి రెండూ ఉన్న ఉత్పత్తినే వాడండి. లేబుల్‌లోని రక్షణ, కోతకు ముందు సూచనలు పాటించండి.' },
  hi: { detected: 'संभावित रोग के संकेत', clear: 'रोग के स्पष्ट संकेत नहीं', uncertain: 'रोग की पुष्टि नहीं हो सकी', mismatch: 'फ़ोटो चुनी गई फसल से मेल नहीं खाती', mismatchSummary: 'फ़ोटो में दिख रही फसल चुनें और प्रभावित पत्तियों की साफ़ नज़दीकी फ़ोटो अपलोड करें।', disease: 'संभावित रोग', pesticides: 'कीटनाशक विकल्प', none: 'इस फ़ोटो के आधार पर कीटनाशक नहीं सुझाया गया।', label: 'केवल वही उत्पाद लें जिसके मौजूदा भारतीय लेबल पर यही फसल और रोग दर्ज हों। सुरक्षा और कटाई-पूर्व निर्देश मानें।' },
} as const;

const crops = ['Paddy', 'Maize', 'Groundnut', 'Chilli', 'Cotton', 'Turmeric', 'Sugarcane', 'Tomato', 'Onion', 'Red Gram', 'Black Gram', 'Green Gram'];
const highConfidenceLabel: Record<string, string> = { en: 'High confidence', te: 'అధిక నమ్మకం', hi: 'उच्च विश्वास' };

export function CropHealthScreen({ selectedFarm, onBack }: { selectedFarm: Farm | null; onBack: () => void }) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] as keyof typeof copy;
  const text = copy[lang] || copy.en;
  const resultText = resultCopy[lang as keyof typeof resultCopy] || resultCopy.en;
  const [photo, setPhoto] = useState<File | null>(null);
  const [crop, setCrop] = useState(selectedFarm?.current_crops?.split(',')[0]?.trim() || 'Paddy');
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<CropDiseaseAssessment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!photo) { setError(text.selectPhoto); return; }
    if (photo.size > 6 * 1024 * 1024) { setError('Please choose an image under 6 MB.'); return; }
    setLoading(true);
    try {
      const assessment = await api.assessCropDisease({ image: photo, crop, symptoms, language: lang, farmId: selectedFarm?.id });
      setResult(assessment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.failed);
    } finally {
      setLoading(false);
    }
  };

  return <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-3">
    <div className="flex items-center gap-3"><button onClick={onBack} aria-label="Back" className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft className="h-6 w-6" /></button><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Sprout className="h-6 w-6" /></div><div><h1 className="text-lg font-extrabold">{text.title}</h1><p className="text-xs text-gray-600">{text.sub}</p></div></div>

    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <label className="block text-sm font-bold text-slate-800">{text.photo}<span className="mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 text-center">
        {preview ? <img src={preview} alt="Crop photo preview" className="max-h-64 w-full object-cover" /> : <><Camera className="mb-2 h-8 w-8 text-emerald-700" /><span className="font-bold text-emerald-900">{text.choose}</span><span className="mt-1 text-xs text-slate-600">{text.photoHelp}</span></>}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(event) => { setPhoto(event.target.files?.[0] || null); setError(''); setResult(null); }} />
      </span></label>
      <label className="block text-sm font-bold text-slate-800">{text.crop}<select value={crop} onChange={(event) => setCrop(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base font-medium">{crops.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="block text-sm font-bold text-slate-800">{text.symptoms}<textarea value={symptoms} onChange={(event) => setSymptoms(event.target.value)} maxLength={1200} rows={3} placeholder={text.placeholder} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-base font-normal placeholder:text-slate-500" /></label>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{error}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3.5 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60">{loading ? <><LoaderCircle className="h-5 w-5 animate-spin" />{text.loading}</> : <><UploadCloud className="h-5 w-5" />{text.analyze}</>}</button>
    </form>

    <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3.5 text-sm leading-relaxed text-sky-950"><ShieldCheck className="mr-1 inline h-4 w-4" />{text.uncertainty}</p>

    {result && <section className="space-y-3 rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm">
      {(() => {
        const assessment = result.assessment;
        const isMismatch = assessment.crop_match === false;
        const statusLabel = isMismatch ? resultText.mismatch : assessment.disease_present === true ? resultText.detected : assessment.disease_present === false ? resultText.clear : resultText.uncertain;
        const statusTone = assessment.disease_present === true && !isMismatch ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-sky-200 bg-sky-50 text-sky-950';
        return <>
          <div className={`rounded-2xl border p-3.5 ${statusTone}`}>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" /><p className="font-extrabold">{statusLabel}</p></div>
            {isMismatch && <p className="mt-1 text-sm leading-relaxed">{resultText.mismatchSummary}</p>}
            {assessment.disease_present === true && assessment.disease_name && <p className="mt-2 text-base font-extrabold">{resultText.disease}: {assessment.disease_name}</p>}
            {!isMismatch && <p className="mt-1 text-xs font-semibold">{assessment.confidence === 'high' ? (highConfidenceLabel[lang] || highConfidenceLabel.en) : assessment.confidence === 'medium' ? text.medium : text.low}</p>}
            <p className={`mt-1 text-xs font-semibold ${result.saved === false ? 'text-amber-800' : 'text-emerald-800'}`}>{result.saved === false ? text.notSaved : text.saved}</p>
          </div>
          {assessment.disease_present === true && <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
            <h3 className="text-sm font-extrabold text-emerald-950">{resultText.pesticides}</h3>
            {assessment.pesticide_recommendations.length > 0 ? assessment.pesticide_recommendations.map((item, index) => <article key={`${item.active_ingredient}-${index}`} className="rounded-xl border border-emerald-100 bg-white p-3">
              <p className="font-bold text-slate-900">{item.active_ingredient}</p>
              {item.target && <p className="mt-1 text-sm text-slate-700">For: {item.target}</p>}
            </article>) : <p className="rounded-xl bg-white p-3 text-sm text-slate-800">{resultText.none}</p>}
            <p className="text-xs leading-relaxed text-emerald-950">{resultText.label}</p>
          </div>}
        </>;
      })()}
    </section>}
  </div>;
}
