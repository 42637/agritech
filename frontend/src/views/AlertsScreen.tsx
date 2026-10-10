import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ChevronDown,
  Bell,
  Thermometer,
  CloudRain,
  Sun,
  Wind,
  Bug,
  Map,
  ChevronRight,
  Lightbulb,
  Sprout,
  Plus,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api, type Farm } from '../services/api';

interface AlertsScreenProps {
  farms?: Farm[];
  selectedFarm?: Farm | null;
  onSelectFarm?: (farm: Farm) => void;
  onAddFarm?: () => void;
  onBack: () => void;
  onViewMap?: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  farms = [],
  selectedFarm,
  onSelectFarm,
  onAddFarm,
  onBack,
  onViewMap
}) => {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const languageName = language === 'te' ? 'తెలుగు' : language === 'hi' ? 'हिंदी' : 'English';
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [alertsData, setAlertsData] = useState<any>(null);

  const defaultFarms = [
    { id: 1, village: 'Bhimavaram', acreage: 2.5 },
    { id: 2, village: 'Tanuku', acreage: 1.8 },
    { id: 3, village: 'Narsapuram', acreage: 3.2 },
    { id: 4, village: 'Eluru', acreage: 1.0 }
  ];

  const displayFarms = farms.length > 0 ? farms : defaultFarms;
  const [localFarm, setLocalFarm] = useState<any>(selectedFarm || displayFarms[0]);

  useEffect(() => {
    if (selectedFarm) {
      setLocalFarm(selectedFarm);
    }
  }, [selectedFarm]);

  const activeFarmId = localFarm?.id || displayFarms[0]?.id;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getDynamicClimateAlerts(activeFarmId, period, i18n.resolvedLanguage || i18n.language || 'en')
      .then((data) => {
        if (isMounted) {
          setAlertsData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dynamic climate alerts:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFarmId, period, i18n.resolvedLanguage, i18n.language]);


  const featured = alertsData?.analysis?.featured_risk || {
    severity: "high",
    title: "High Temperature Expected",
    timeframe: "Next 3 days",
    expected_value: "38–40°C",
    normal_value: "Normal: 32°C",
    impact_summary: "High heat stress may affect crop growth.",
    recommendation: "Irrigate early morning or evening to reduce heat stress.",
    risk_type: "temperature"
  };

  const upcoming = alertsData?.analysis?.upcoming_risks || [
    {
      severity: "medium",
      title: "Heavy Rainfall",
      timeframe: "In 2 days",
      detail: "50 – 70 mm",
      description: "Higher chance of rainfall.",
      risk_type: "rain"
    },
    {
      severity: "medium",
      title: "Dry Conditions",
      timeframe: "Next 7 days",
      detail: "Low Rainfall",
      description: "Soil moisture is low. Plan irrigation accordingly.",
      risk_type: "sun"
    },
    {
      severity: "low",
      title: "Strong Wind",
      timeframe: "In 4 days",
      detail: "30 – 40 km/h",
      description: "Wind speed rising; support standing crops.",
      risk_type: "wind"
    },
    {
      severity: "low",
      title: "Pest/Disease Risk",
      timeframe: "Favorable conditions",
      detail: "High Humidity",
      description: "High humidity may increase pest activity.",
      risk_type: "bug"
    }
  ];

  const getSeverityBadge = (sev: string) => {
    switch ((sev || '').toLowerCase()) {
      case 'high':
        return 'bg-rose-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  };

  const getRiskIcon = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'rain':
        return <CloudRain className="w-6 h-6 text-sky-500" />;
      case 'sun':
      case 'drought':
        return <Sun className="w-6 h-6 text-amber-500 fill-amber-300" />;
      case 'wind':
        return <Wind className="w-6 h-6 text-teal-600" />;
      case 'bug':
      case 'pest':
        return <Bug className="w-6 h-6 text-[#087A3D]" />;
      default:
        return <Thermometer className="w-6 h-6 text-rose-500" />;
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header bar matching Reference Image */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#102D20]" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-lg text-[#102D20] leading-tight">Climate Risk Alerts</h2>
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <p className="text-xs text-[#5A6E65]">{t('climateSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-semibold text-[#102D20]">
            <span className="mr-1 text-xs">🌐</span>
            <span>{languageName}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-500" />
          </div>
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Horizontal Farm Selector Carousel */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {displayFarms.map((farm) => {
          const isSelected = activeFarmId === farm.id;
          return (
            <button
              key={farm.id}
              onClick={() => {
                setLocalFarm(farm);
                if (onSelectFarm) onSelectFarm(farm as any);
              }}
              className={`flex-none w-32 p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-[#E7F7E4] border-[#087A3D] ring-2 ring-[#087A3D]/20'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#087A3D] shadow-2xs">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h4 className="font-extrabold text-xs text-[#102D20] truncate">{farm.village}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{farm.acreage} {t('acresUnit')}</p>
              </div>
            </button>
          );
        })}

        <button
          onClick={onAddFarm}
          className="flex-none w-24 p-2.5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-0.5 text-xs font-bold text-gray-700"
        >
          <Plus className="w-4 h-4 text-[#087A3D]" />
          <span className="text-[10px]">{t('addFarmAction')}</span>
        </button>
      </div>

      {/* Forecast-Period Selector Pill Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setPeriod('today')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === 'today'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('forecastToday')}
        </button>
        <button
          onClick={() => setPeriod('7days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '7days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('forecastSevenDays')}
        </button>
        <button
          onClick={() => setPeriod('30days')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
            period === '30days'
              ? 'bg-[#102D20] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('forecastThirtyDays')}
        </button>
      </div>

      {alertsData?.email_alert?.triggered && alertsData.email_alert.status !== 'no_actionable_risk' && (
        <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
          alertsData.email_alert.status === 'sent'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : alertsData.email_alert.status === 'duplicate_suppressed'
              ? 'bg-sky-50 border-sky-200 text-sky-800'
              : 'bg-amber-50 border-amber-200 text-amber-900'
        }`} role="status" aria-live="polite">
          {alertsData.email_alert.status === 'sent' && t('emailClimateSent')}
          {alertsData.email_alert.status === 'duplicate_suppressed' && t('emailDuplicate')}
          {alertsData.email_alert.status === 'not_configured' && t('emailNotConfigured')}
          {alertsData.email_alert.status === 'disabled' && t('emailDisabled')}
          {alertsData.email_alert.status === 'failed' && t('emailFailed')}
        </div>
      )}

      {loading ? (
        <div className="bg-[#FFF0F0] border border-rose-200/90 rounded-3xl p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-xs font-extrabold text-[#102D20]">{t('analyzingClimate')}</p>
          <p className="text-[10px] text-gray-500">{t('fetchingWeather', { village: selectedFarm?.village || displayFarms[0]?.village })}</p>
        </div>
      ) : (
        <>
          {/* Featured Climate Risk Card (Pale Pink Container matching exact image layout) */}
          <div className="bg-[#FFF0F0] border border-rose-200/90 rounded-3xl p-4 space-y-3 shadow-2xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  {getRiskIcon(featured.risk_type)}
                </div>

                <div>
                  <span className={`${getSeverityBadge(featured.severity)} font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider`}>
                    {t(`severity_${featured.severity}`, { defaultValue: t('riskLabel') })} {t('riskLabel')}
                  </span>
                  <h3 className="font-black text-base text-[#102D20] mt-1 leading-tight">
                    {featured.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold">{featured.timeframe}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2.5 pt-1 items-center">
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{t('expectedImpact')}</p>
                <p className="text-2xl font-black text-rose-600 tracking-tight">{featured.expected_value}</p>
                {featured.normal_value && (
                  <p className="text-[10px] text-gray-500 font-semibold">({featured.normal_value})</p>
                )}
                <p className="text-[10px] text-gray-700 leading-snug font-medium mt-1">
                  {featured.impact_summary}
                </p>
              </div>

              <div className="col-span-3 h-28 relative rounded-2xl overflow-hidden shadow-2xs border border-rose-200/80 bg-[#FFF5EB] flex items-center justify-center">
                <img
                  src="/assets/high_heat_alert_hero.png"
                  alt={t('climateIllustration')}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-rose-100 flex items-center justify-between text-xs font-semibold text-[#102D20] shadow-2xs">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <span className="font-bold shrink-0">{t('whatToDo')}</span>
                <span className="text-gray-600 truncate max-w-[170px]">{featured.recommendation}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="font-extrabold text-sm text-[#102D20]">{t('upcomingRisks')}</h3>
            <button
              onClick={onViewMap}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#087A3D] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              <span>{t('viewMapAction')}</span>
            </button>
          </div>

          {/* Upcoming Risks List */}
          <div className="space-y-2.5">
            {upcoming.map((risk: any, idx: number) => (
              <div
                key={idx}
                className="bg-white hover:bg-gray-50/80 border border-gray-200 rounded-3xl p-3.5 flex items-center justify-between gap-3 shadow-2xs transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-2xs">
                    {getRiskIcon(risk.risk_type)}
                  </div>
                  <div>
                    <span className={`${getSeverityBadge(risk.severity)} font-bold text-[9px] px-2 py-0.5 rounded-full uppercase`}>
                      {t(`severity_${risk.severity}`, { defaultValue: t('riskLabel') })} {t('riskLabel')}
                    </span>
                    <h4 className="font-extrabold text-xs text-[#102D20] mt-0.5">{risk.title}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">{risk.timeframe}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right max-w-[130px]">
                    <span className="font-extrabold text-xs text-[#102D20] block">{risk.detail}</span>
                    <span className="text-[10px] text-gray-500 font-medium line-clamp-1">{risk.description}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
