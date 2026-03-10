"use client";
import { useState } from 'react';

export default function DevDemo() {
  const [active, setActive] = useState(false);

  const handleWazeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Кодируем "מקלט", чтобы ссылка была понятна навигатору
    const query = encodeURIComponent("מקלט");
    
    // Прямая ссылка на приложение (Deep Link)
    const wazeDeepLink = `waze://?q=${query}&navigate=yes`;
    
    // Ссылка для браузера (Fallback)
    const wazeWebUrl = `https://www.waze.com/ul?q=${query}&navigate=yes`;

    // 1. Пытаемся открыть приложение напрямую
    window.location.href = wazeDeepLink;

    // 2. Если приложение не перехватило управление за 500мс, открываем браузерную версию
    // На Android это часто вызывает диалог "Открыть в приложении?"
    setTimeout(() => {
      if (document.hasFocus()) {
        window.location.href = wazeWebUrl;
      }
    }, 500);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${active ? 'bg-red-700' : 'bg-slate-900'}`}>
      <div className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-lg w-full border-4 border-gray-100">
        <h1 className="text-4xl font-black mb-8 text-black tracking-tighter uppercase italic">Developer Mode</h1>
        
        {!active ? (
          <button 
            onClick={() => setActive(true)}
            className="w-full py-12 bg-red-600 text-white text-5xl font-black rounded-3xl shadow-2xl active:scale-95 transition-all hover:bg-red-500"
          >
            🚀 TEST ALERT
          </button>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <h2 className="text-6xl font-black text-red-600 animate-pulse">צבע אדום!</h2>
            <p className="text-2xl text-gray-600 font-bold">Симуляция запущена успешно</p>
            
            <button 
              onClick={handleWazeClick} 
              className="block w-full py-8 bg-[#33ccff] text-white text-4xl font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              WAZE
            </button>

            <button 
              onClick={() => setActive(false)} 
              className="mt-6 text-gray-400 font-bold text-xl hover:text-black transition-colors underline decoration-dotted"
            >
              СБРОСИТЬ ТЕСТ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}