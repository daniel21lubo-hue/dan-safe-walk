"use client";
import { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";

export default function SafeWalk() {
  const [minutes, setMinutes] = useState<string>("15");
  const [risk, setRisk] = useState<number | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [city, setCity] = useState<string>("מזהה מיקום...");

  // 1. Автоматическое определение города при загрузке
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=he`);
          const data = await res.json();
          const cityName = data.address.city || data.address.town || data.address.village || "חולון";
          setCity(cityName);
        } catch (e) {
          setCity("חולון");
        }
      });
    }
  }, []);

  const calculateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes);
    if (!m || m <= 0) return;

    let baseRisk = 5; // Базовый риск

    try {
      // 2. Проверка реальных сирен в выбранном городе
      const response = await fetch('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json');
      const alerts = await response.json();
      const now = new Date();
      
      const lastAlert = alerts.find((a: any) => a.data.includes(city));

      if (lastAlert) {
        const alertTime = new Date(lastAlert.alertDate);
        const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / 60000);

        // Логика затишья: чем меньше времени прошло с сирены, тем выше риск
        if (diffMinutes < 30) baseRisk = 85; 
        else if (diffMinutes < 120) baseRisk = 45;
        else if (diffMinutes < 360) baseRisk = 15;
      }
    } catch (error) {
      baseRisk = 10; // Если API не ответил
    }

    // 3. Влияние времени прогулки (твоя просьба: чем дольше, тем опаснее)
    const durationFactor = (m / 10) * 5;
    const finalRisk = Math.min(Math.round(baseRisk + durationFactor), 100);
    
    setRisk(finalRisk);
  };

  const getRiskColor = () => {
    if (risk === null) return '';
    if (risk < 40) return 'text-green-500';
    if (risk < 70) return 'text-yellow-500';
    return 'text-red-500';
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <Analytics />
      <div className="w-full max-w-sm bg-white p-6 rounded-[35px] shadow-xl text-center border-t-4 border-blue-600 transition-all">
        
        <h1 className="text-3xl font-black text-blue-600 mb-1 flex items-center justify-center gap-2">
          🐾 Safe Walk
        </h1>
        {/* Показываем город, который определили */}
        <p className="text-blue-400 text-xs font-bold mb-2">📍 {city}</p>
        <p className="text-gray-500 text-sm mb-6 font-medium">כמה דקות תרצו לטייל עם הכלב?</p>

        <form onSubmit={calculateRisk} className="space-y-3">
          <input 
            type="number" 
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="הכנס דקות..."
            className="w-full p-3 text-2xl border-2 border-gray-100 rounded-2xl text-center focus:border-blue-400 outline-none text-black font-bold placeholder:text-gray-300"
          />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white text-xl font-bold rounded-2xl shadow-md active:scale-95 transition-all">
            חשב רמת סיכון
          </button>
        </form>

        {risk !== null && (
          <div className="mt-6 animate-in fade-in zoom-in duration-300">
            <div className={`text-7xl font-black leading-none ${getRiskColor()}`}>
              {risk}%
            </div>
            <p className={`text-lg font-bold mt-2 ${getRiskColor()}`}>
              {risk < 40 ? "טיול בטוח יחסית" : risk < 70 ? "הישאר קרוב למבנה מוגן" : "סיכון גבוה! היזהר"}
            </p>
            {/* Добавил маленькое пояснение логики */}
            <p className="text-[10px] text-gray-400 mt-1 italic">החישוב מתבסס על היסטוריית אזעקות בזמן אמת</p>
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
                href="https://www.google.com/maps/search/%D7%9E%D7%A7%D7%9C%D7%9T" 
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