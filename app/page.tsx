"use client";

import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";

type LiveAlert = {
  id?: string;
  cat?: string;
  title?: string;
  desc?: string;
  data?: string[];
};

type HistoryAlert = {
  alertDate?: string;
  title?: string;
  data: string[];
  source?: "oref" | "redalert";
  threat?: string;
};

type RiskSource = "live" | "prealert" | "history" | "fallback" | null;

export default function SafeWalk() {
  const [minutes, setMinutes] = useState<string>("15");
  const [risk, setRisk] = useState<number | null>(null);
  const [riskSource, setRiskSource] = useState<RiskSource>(null);
  const [showNav, setShowNav] = useState(false);
  const [city, setCity] = useState<string>("מזהה מיקום...");
  const [liveAlert, setLiveAlert] = useState<LiveAlert | null>(null);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);

  const normalizeText = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/["'׳״]/g, "")
      .replace(/\s+/g, " ");

  const areaMatchesCity = (area: string, cityName: string) => {
    const normalizedArea = normalizeText(area);
    const normalizedCity = normalizeText(cityName);

    return (
      normalizedArea === normalizedCity ||
      normalizedArea.includes(normalizedCity) ||
      normalizedCity.includes(normalizedArea)
    );
  };

  const dataMatchesCity = (areas?: string[], cityName?: string) => {
    if (!areas || !cityName) return false;
    return areas.some((area) => areaMatchesCity(area, cityName));
  };

  // 1. Автоматическое определение города при загрузке
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=he`
            );

            const data = await res.json();

            const cityName =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.municipality ||
              data.address?.suburb ||
              "חולון";

            setCity(cityName);
          } catch {
            setCity("חולון");
          }
        },
        () => {
          setCity("חולון");
        }
      );
    } else {
      setCity("חולון");
    }
  }, []);

  // 2. Проверка активной тревоги / предупреждения в текущем городе
  useEffect(() => {
    const fetchLiveAlerts = async () => {
      try {
        setLoadingLive(true);

        const response = await fetch("/api/alerts-live", {
          cache: "no-store",
        });

        if (!response.ok) {
          setLiveAlert(null);
          return;
        }

        const text = await response.text();

        if (!text || !text.trim()) {
          setLiveAlert(null);
          return;
        }

        const data: LiveAlert = JSON.parse(text);

        if (dataMatchesCity(data?.data, city)) {
          setLiveAlert(data);
        } else {
          setLiveAlert(null);
        }
      } catch {
        setLiveAlert(null);
      } finally {
        setLoadingLive(false);
      }
    };

    if (city && city !== "מזהה מיקום...") {
      fetchLiveAlerts();

      const interval = setInterval(fetchLiveAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [city]);

  const calculateRisk = async (e: React.FormEvent) => {
    e.preventDefault();

    const m = parseInt(minutes);
    if (!m || m <= 0) return;

    try {
      // 1. Сначала проверяем live endpoint
      const liveResponse = await fetch("/api/alerts-live", {
        cache: "no-store",
      });

      if (liveResponse.ok) {
        const liveText = await liveResponse.text();

        if (liveText && liveText.trim()) {
          const liveData: LiveAlert = JSON.parse(liveText);
          const matchesCity = dataMatchesCity(liveData?.data, city);

          if (matchesCity && liveData?.cat === "1") {
            setRisk(100);
            setRiskSource("live");
            return;
          }

          if (matchesCity && liveData?.cat === "10") {
            setRisk(90);
            setRiskSource("prealert");
            return;
          }
        }
      }

      // 2. Если live ничего не дал — считаем по истории
      let baseRisk = 5;

      const historyResponse = await fetch(
        `/api/alerts-history?city=${encodeURIComponent(city)}`,
        {
          cache: "no-store",
        }
      );

      if (!historyResponse.ok) {
        throw new Error("History API failed");
      }

      const alerts: HistoryAlert[] = await historyResponse.json();
      const now = new Date();

      const matchedAlerts = alerts.filter((a) => dataMatchesCity(a.data, city));

      if (matchedAlerts.length > 0) {
        const sortedAlerts = matchedAlerts
          .filter((a) => a.alertDate)
          .sort(
            (a, b) =>
              new Date(b.alertDate!).getTime() -
              new Date(a.alertDate!).getTime()
          );

        const lastAlert = sortedAlerts[0];

        if (lastAlert?.alertDate) {
          const alertTime = new Date(lastAlert.alertDate);
          const diffMinutes = Math.floor(
            (now.getTime() - alertTime.getTime()) / 60000
          );

          if (diffMinutes < 30) baseRisk = 85;
          else if (diffMinutes < 120) baseRisk = 45;
          else if (diffMinutes < 360) baseRisk = 20;
          else if (diffMinutes < 1440) baseRisk = 12;
        }

        const alertsLast24h = sortedAlerts.filter((a) => {
          if (!a.alertDate) return false;

          const diffMinutes =
            (now.getTime() - new Date(a.alertDate).getTime()) / 60000;

          return diffMinutes <= 1440;
        }).length;

        baseRisk += Math.min(alertsLast24h * 4, 20);
      }

      // 3. Влияние длительности прогулки
      const durationFactor = (m / 10) * 5;
      const finalRisk = Math.min(Math.round(baseRisk + durationFactor), 100);

      setRisk(finalRisk);
      setRiskSource("history");
    } catch {
      // 4. Осторожный fallback, а не слишком оптимистичный
      setRisk(25);
      setRiskSource("fallback");
    }
  };

  const getRiskColor = () => {
    if (risk === null) return "";
    if (risk < 40) return "text-green-500";
    if (risk < 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getRiskText = () => {
    if (risk === null) return "";
    if (riskSource === "live") return "יש אזעקה פעילה עכשיו! אין לצאת";
    if (riskSource === "prealert") return "בדקות הקרובות צפויות התרעות באזור שלך";
    if (risk < 40) return "טיול בטוח יחסית";
    if (risk < 70) return "הישאר קרוב למבנה מוגן";
    return "סיכון גבוה! היזהר";
  };

  const getRiskSourceText = () => {
    if (riskSource === "live") return "מבוסס על התרעה פעילה בזמן אמת";
    if (riskSource === "prealert") return "מבוסס על אזהרה מוקדמת בזמן אמת";
    if (riskSource === "history") return "מבוסס על היסטוריית אזעקות";
    if (riskSource === "fallback") {
      return "נתוני זמן אמת אינם זמינים כרגע, מוצגת הערכה שמרנית";
    }
    return "";
  };

  // const getLiveStatusText = () => {
  //   if (loadingLive) return "טוען מצב התרעות...";
  //   if (!liveAlert) return "✅ אין התרעה פעילה כרגע באזור שלך";
  //   if (liveAlert.cat === "1") return "🚨 יש התרעה פעילה כעת באזור שלך";
  //   if (liveAlert.cat === "10") return "⚠️ צפויות להתקבל התרעות באזור שלך בדקות הקרובות";
  //   return "⚠️ התקבל עדכון התרעה באזור שלך";
  // };

  const getLiveStatusClass = () => {
    if (loadingLive) {
      return "mb-4 rounded-2xl bg-gray-100 border border-gray-300 p-3 text-gray-700 font-bold text-sm";
    }

    if (!liveAlert) {
      return "mb-4 rounded-2xl bg-green-100 border border-green-300 p-3 text-green-700 font-bold text-sm";
    }

    if (liveAlert.cat === "10") {
      return "mb-4 rounded-2xl bg-yellow-100 border border-yellow-300 p-3 text-yellow-700 font-bold text-sm";
    }

    return "mb-4 rounded-2xl bg-red-100 border border-red-300 p-3 text-red-700 font-bold text-sm";
  };

  const handleWazeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const query = encodeURIComponent("מקלט");
    window.location.href = `waze://?q=${query}&navigate=yes`;

    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = `https://www.waze.com/ul?q=${query}&navigate=yes`;
      }
    }, 500);
  };

  return (
    <div
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <Analytics />

      <div className="w-full max-w-sm bg-white p-6 rounded-[35px] shadow-xl text-center border-t-4 border-blue-600 transition-all">
        <h1 className="text-3xl font-black text-blue-600 mb-1 flex items-center justify-center gap-2">
          🐾 Safe Walk
        </h1>

        <p className="text-blue-400 text-xs font-bold mb-2">📍 {city}</p>

        {/* <div className={getLiveStatusClass()}>{getLiveStatusText()}</div> */}

        <p className="text-gray-500 text-sm mb-6 font-medium">
          כמה דקות תרצו לטייל עם הכלב?
        </p>

        <form onSubmit={calculateRisk} className="space-y-3">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="הכנס דקות..."
            className="w-full p-3 text-2xl border-2 border-gray-100 rounded-2xl text-center focus:border-blue-400 outline-none text-black font-bold placeholder:text-gray-300"
          />

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white text-xl font-bold rounded-2xl shadow-md active:scale-95 transition-all"
          >
            חשב רמת סיכון
          </button>
        </form>

        {risk !== null && (
          <div className="mt-6 animate-in fade-in zoom-in duration-300">
            <div className={`text-7xl font-black leading-none ${getRiskColor()}`}>
              {risk}%
            </div>

            <p className={`text-lg font-bold mt-2 ${getRiskColor()}`}>
              {getRiskText()}
            </p>

            <p className="text-[10px] text-gray-400 mt-1 italic">
              {getRiskSourceText()}
            </p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-dashed border-gray-200">
          <button
            onClick={() => setShowNav(!showNav)}
            className="w-full py-3 bg-zinc-900 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            📍 מצא מקלט קרוב עכשיו
          </button>

          {showNav && (
            <div className="mt-3 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-300">
              <button
                onClick={handleWazeClick}
                className="py-3 bg-[#33ccff] text-white text-sm font-extrabold rounded-xl shadow-sm text-center active:bg-[#2bb5e3]"
              >
                Waze
              </button>

              <a
                href="https://www.google.com/maps/search/%D7%9E%D7%A7%D7%9C%D7%98"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 bg-[#34a853] text-white text-sm font-extrabold rounded-xl shadow-sm text-center active:bg-[#2d9147]"
              >
                Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}