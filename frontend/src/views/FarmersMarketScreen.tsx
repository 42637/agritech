import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Handshake, LoaderCircle, MapPin, PackagePlus, Phone, ShoppingBasket, Sprout, Store, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, type Farm, type ProduceListing } from '../services/api';

const copy = {
  en: { title: 'Farmers’ direct market', subtitle: 'Farmer-set prices · Buy directly from the grower', browse: 'Browse crops', sell: 'Sell your crop', crop: 'Crop name', quantity: 'Available quantity (kg)', price: 'Your price (₹ per kg)', name: 'Farmer name', phone: 'Phone for direct contact', location: 'Village / market location', harvest: 'Expected harvest date', grade: 'Quality / grade', details: 'Crop details (optional)', publish: 'Publish listing', loading: 'Saving…', listings: 'Available from farmers', empty: 'No crop listings yet. Be the first to list produce.', buy: 'Request to buy directly', buyer: 'Buyer name', buyerPhone: 'Buyer phone', buyQty: 'Quantity to buy (kg)', submitBuy: 'Place direct order request', submitting: 'Submitting…', total: 'Estimated total', direct: 'No marketplace middleman. Buyer and farmer contact each other directly.', saved: 'Listing saved to Supabase.', requested: 'Order request saved. Contact the farmer directly to arrange pickup and payment.', error: 'Could not complete that action.', perKg: '/ kg', available: 'Available', gradeLabel: 'Grade', harvestLabel: 'Harvest', contact: 'Call farmer', noOrders: 'A request reserves the quantity and connects buyer and seller directly; payment and delivery are arranged between them.' },
  te: { title: 'రైతుల ప్రత్యక్ష మార్కెట్', subtitle: 'రైతు నిర్ణయించిన ధర · పండించిన రైతు నుంచే కొనండి', browse: 'పంటలు చూడండి', sell: 'మీ పంట అమ్మండి', crop: 'పంట పేరు', quantity: 'అందుబాటులో ఉన్న పరిమాణం (కిలోలు)', price: 'మీ ధర (₹ / కిలో)', name: 'రైతు పేరు', phone: 'ప్రత్యక్ష సంప్రదింపు ఫోన్', location: 'గ్రామం / మార్కెట్ స్థలం', harvest: 'అంచనా కోత తేదీ', grade: 'నాణ్యత / గ్రేడ్', details: 'పంట వివరాలు (ఐచ్ఛికం)', publish: 'జాబితాను ప్రచురించండి', loading: 'భద్రపరుస్తున్నాం…', listings: 'రైతుల వద్ద అందుబాటులో ఉన్నవి', empty: 'ఇంకా పంట జాబితాలు లేవు. మొదట మీ పంటను జాబితా చేయండి.', buy: 'నేరుగా కొనుగోలు కోరండి', buyer: 'కొనుగోలుదారు పేరు', buyerPhone: 'కొనుగోలుదారు ఫోన్', buyQty: 'కొనాలనుకునే పరిమాణం (కిలోలు)', submitBuy: 'నేరుగా ఆర్డర్ కోరండి', submitting: 'పంపిస్తున్నాం…', total: 'అంచనా మొత్తం', direct: 'మధ్యవర్తి లేకుండా రైతు, కొనుగోలుదారు నేరుగా మాట్లాడతారు.', saved: 'జాబితా Supabaseలో భద్రపరచబడింది.', requested: 'ఆర్డర్ అభ్యర్థన భద్రపరచబడింది. సరుకు, చెల్లింపుల కోసం రైతును నేరుగా సంప్రదించండి.', error: 'ఈ చర్యను పూర్తి చేయలేకపోయాం.', perKg: '/ కిలో', available: 'అందుబాటులో', gradeLabel: 'గ్రేడ్', harvestLabel: 'కోత', contact: 'రైతుకు కాల్ చేయండి', noOrders: 'ఈ అభ్యర్థన పరిమాణాన్ని నిల్వ ఉంచుతుంది. చెల్లింపు, డెలివరీని కొనుగోలుదారు మరియు రైతు నేరుగా నిర్ణయించుకుంటారు.' },
  hi: { title: 'किसानों का सीधा बाज़ार', subtitle: 'किसान तय करे दाम · उत्पादक से सीधे खरीदें', browse: 'फसल देखें', sell: 'अपनी फसल बेचें', crop: 'फसल का नाम', quantity: 'उपलब्ध मात्रा (किलो)', price: 'आपका भाव (₹ / किलो)', name: 'किसान का नाम', phone: 'सीधे संपर्क का फ़ोन', location: 'गाँव / मंडी स्थान', harvest: 'अनुमानित कटाई तिथि', grade: 'गुणवत्ता / ग्रेड', details: 'फसल का विवरण (वैकल्पिक)', publish: 'लिस्टिंग प्रकाशित करें', loading: 'सहेज रहे हैं…', listings: 'किसानों की उपलब्ध फसल', empty: 'अभी कोई फसल सूची नहीं है। अपनी फसल पहले सूचीबद्ध करें।', buy: 'सीधे खरीदने का अनुरोध', buyer: 'खरीदार का नाम', buyerPhone: 'खरीदार का फ़ोन', buyQty: 'खरीद मात्रा (किलो)', submitBuy: 'सीधा ऑर्डर अनुरोध दें', submitting: 'भेज रहे हैं…', total: 'अनुमानित कुल', direct: 'कोई बिचौलिया नहीं। खरीदार और किसान सीधे संपर्क करते हैं।', saved: 'लिस्टिंग Supabase में सहेजी गई।', requested: 'ऑर्डर अनुरोध सहेजा गया। सामान और भुगतान के लिए किसान से सीधे बात करें।', error: 'यह काम पूरा नहीं हो सका।', perKg: '/ किलो', available: 'उपलब्ध', gradeLabel: 'ग्रेड', harvestLabel: 'कटाई', contact: 'किसान को कॉल करें', noOrders: 'अनुरोध मात्रा सुरक्षित करता है। भुगतान और डिलीवरी खरीदार व किसान सीधे तय करते हैं।' },
} as const;

export function FarmersMarketScreen({ selectedFarm, onBack }: { selectedFarm: Farm | null; onBack: () => void }) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0] as keyof typeof copy;
  const text = copy[lang] || copy.en;
  const [tab, setTab] = useState<'browse' | 'sell'>('browse');
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [filter, setFilter] = useState('');
  const [buyerFor, setBuyerFor] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerQuantity, setBuyerQuantity] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(selectedFarm ? `${selectedFarm.village}, ${selectedFarm.district}` : '');
  const [harvestDate, setHarvestDate] = useState('');
  const [quality, setQuality] = useState('Not graded');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadListings = async (crop = filter) => {
    try { setListings(await api.getProduceListings(crop)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : text.error); }
  };
  useEffect(() => { void loadListings(''); }, []);

  const publish = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      await api.createProduceListing({
        seller_name: farmerName, seller_phone: farmerPhone, crop_name: cropName,
        quantity_kg: Number(quantity), price_per_kg: Number(price), location,
        harvest_date: harvestDate || null, quality_grade: quality || 'Not graded', details,
        farm_id: selectedFarm?.id,
      });
      setNotice(text.saved); setTab('browse'); setFilter(''); await loadListings('');
      setCropName(''); setQuantity(''); setPrice(''); setHarvestDate(''); setQuality('Not graded'); setDetails('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : text.error); }
    finally { setLoading(false); }
  };

  const buy = async (event: FormEvent, listing: ProduceListing) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('');
    try {
      await api.requestProducePurchase(listing.id, { buyer_name: buyerName, buyer_phone: buyerPhone, quantity_kg: Number(buyerQuantity) });
      setNotice(text.requested); setBuyerFor(null); setBuyerName(''); setBuyerPhone(''); setBuyerQuantity(''); await loadListings();
    } catch (cause) { setError(cause instanceof Error ? cause.message : text.error); }
    finally { setLoading(false); }
  };

  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base font-medium text-slate-900 placeholder:text-slate-500';

  return <div className="mx-auto max-w-md space-y-4 px-4 pb-28 pt-3">
    <div className="flex items-center gap-3"><button onClick={onBack} aria-label="Back" className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft className="h-6 w-6" /></button><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><Handshake className="h-6 w-6" /></div><div><h1 className="text-lg font-extrabold">{text.title}</h1><p className="text-xs text-slate-600">{text.subtitle}</p></div></div>
    <div className="flex gap-2 rounded-2xl bg-slate-100 p-1"><button onClick={() => { setTab('browse'); setError(''); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-extrabold ${tab === 'browse' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}><Store className="h-4 w-4" />{text.browse}</button><button onClick={() => { setTab('sell'); setError(''); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-extrabold ${tab === 'sell' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'}`}><PackagePlus className="h-4 w-4" />{text.sell}</button></div>
    <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-relaxed text-emerald-950"><Sprout className="mr-1 inline h-4 w-4" />{text.direct}</p>
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-white p-3 text-sm font-bold text-emerald-900">{text.saved === notice ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : null}{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{error}</p>}

    {tab === 'sell' ? <form onSubmit={publish} className="space-y-3 rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
      <Field label={text.name} value={farmerName} onChange={setFarmerName} required maxLength={100} className={inputClass} />
      <Field label={text.phone} value={farmerPhone} onChange={setFarmerPhone} required type="tel" maxLength={20} className={inputClass} />
      <Field label={text.crop} value={cropName} onChange={setCropName} required maxLength={100} placeholder="Paddy" className={inputClass} />
      <div className="grid grid-cols-2 gap-3"><Field label={text.quantity} value={quantity} onChange={setQuantity} required type="number" min="0.01" step="0.01" className={inputClass} /><Field label={text.price} value={price} onChange={setPrice} required type="number" min="0.01" step="0.01" className={inputClass} /></div>
      <Field label={text.location} value={location} onChange={setLocation} required maxLength={180} className={inputClass} />
      <div className="grid grid-cols-2 gap-3"><Field label={text.harvest} value={harvestDate} onChange={setHarvestDate} type="date" className={inputClass} /><Field label={text.grade} value={quality} onChange={setQuality} maxLength={80} placeholder="Grade A" className={inputClass} /></div>
      <label className="block text-sm font-bold text-slate-800">{text.details}<textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={1200} className={inputClass} /></label>
      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">Your price and phone number will be visible to buyers so they can contact you directly.</p>
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3.5 text-base font-extrabold text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Tag className="h-5 w-5" />}{loading ? text.loading : text.publish}</button>
    </form> : <>
      <div className="flex items-end gap-2"><label className="flex-1 text-sm font-bold text-slate-800">{text.crop}<input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="All crops" className={inputClass} /></label><button onClick={() => { void loadListings(); }} className="mb-0.5 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Search</button></div>
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><ShoppingBasket className="h-5 w-5 text-emerald-700" />{text.listings}</h2>
      {listings.length === 0 && !error && <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">{text.empty}</p>}
      <div className="space-y-3">{listings.map((listing) => <article key={listing.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-extrabold text-slate-950">{listing.crop_name}</h3><p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-slate-700"><MapPin className="h-4 w-4 shrink-0 text-emerald-700" />{listing.location}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">{listing.quality_grade}</span></div>
        <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-900">₹{Number(listing.price_per_kg).toLocaleString('en-IN')}<span className="ml-1 text-xs font-bold">{text.perKg}</span></p><p className="mt-1 text-sm font-semibold text-slate-800">{text.available}: {Number(listing.quantity_kg).toLocaleString('en-IN')} kg</p></div>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-700"><p><span className="font-bold">{text.name}:</span> {listing.seller_name}</p>{listing.harvest_date && <p><span className="font-bold">{text.harvestLabel}:</span> {listing.harvest_date}</p>}</div>
        {listing.details && <p className="text-sm leading-relaxed text-slate-700">{listing.details}</p>}
        <a href={`tel:${listing.seller_phone.replace(/[^+\d]/g, '')}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white py-2.5 text-sm font-bold text-emerald-900"><Phone className="h-4 w-4" />{text.contact}</a>
        {buyerFor === listing.id ? <form onSubmit={(event) => { void buy(event, listing); }} className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3"><Field label={text.buyer} value={buyerName} onChange={setBuyerName} required maxLength={100} className={inputClass} /><Field label={text.buyerPhone} value={buyerPhone} onChange={setBuyerPhone} required type="tel" maxLength={20} className={inputClass} /><label className="block text-sm font-bold text-slate-800">{text.buyQty}<input value={buyerQuantity} onChange={(event) => setBuyerQuantity(event.target.value)} required type="number" min="0.01" max={listing.quantity_kg} step="0.01" className={inputClass} />{Number(buyerQuantity) > 0 && <span className="mt-1 block text-xs font-bold text-emerald-900">{text.total}: ₹{(Number(buyerQuantity) * Number(listing.price_per_kg)).toLocaleString('en-IN')}</span>}</label><p className="text-xs leading-relaxed text-slate-700">{text.noOrders}</p><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-extrabold text-white disabled:opacity-60">{loading && <LoaderCircle className="h-4 w-4 animate-spin" />}{loading ? text.submitting : text.submitBuy}</button></form> : <button onClick={() => { setBuyerFor(listing.id); setError(''); setNotice(''); }} className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-extrabold text-white hover:bg-emerald-900">{text.buy}</button>}
      </article>)}</div>
    </>}
  </div>;
}

function Field({ label, value, onChange, className, ...props }: { label: string; value: string; onChange: (value: string) => void; className: string; [key: string]: any }) {
  return <label className="block text-sm font-bold text-slate-800">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className={className} {...props} /></label>;
}
