"use client";
import { useState } from 'react';

export default function SafeWalk() {
  const [minutes, setMinutes] = useState<string>("");
  const [risk, setRisk] = useState<number | null>(null);
  const [showNav, setShowNav] = useState(false);

  const calculateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseInt(minutes);
    if (!m || m <= 0) return;

    let r = 0;
    if (m <= 15) r = m * 2;
    else if (m <= 40) r = m * 2.2;
    else r = Math.min(m * 2.5, 100);
    
    setRisk(Math.floor(r));
  };

  const getRiskColor = () => {
    if (risk === null) return '';
    if (risk < 40) return 'text-green-500';
    if (risk < 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleWazeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Проверяем iOS или Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS: используем URL schemes для Waze
      window.location.href = "waze://?q=מקלט";
    } else {
      // Android: пытаемся открыть через intent, потом через обычную ссылку
      const wazeUrl = "https://waze.com/ul?q=מקלט&navigate=yes";
      
      // Пытаемся открыть нативное приложение
      const appLink = document.createElement('a');
      appLink.href = "waze://search?q=מקלט";
      appLink.click();
      
      // Если приложение не открылось за 1 секунду, открываем веб-версию
      setTimeout(() => {
        window.location.href = wazeUrl;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* Контейнер с ограничением ширины для аккуратного вида */}
      <div className="w-full max-w-sm bg-white p-6 rounded-[35px] shadow-xl text-center border-t-4 border-blue-600 transition-all">
        
        <h1 className="text-3xl font-black text-blue-600 mb-1 flex items-center justify-center gap-2">
          🐾 Safe Walk
        </h1>
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
              {/* Waze: Открывает нативное приложение или переходит на веб версию */}
              <button 
                onClick={handleWazeClick}
                className="py-3 bg-[#33ccff] text-white text-sm font-extrabold rounded-xl shadow-sm text-center active:bg-[#2bb5e3]"
              >
                Waze
              </button>

              {/* Google Maps: Ищет ближайшее убежище вокруг тебя через встроенный поиск */}
              <a 
                href="https://www.google.com/maps/search/?api=1&query=מקלט" 
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