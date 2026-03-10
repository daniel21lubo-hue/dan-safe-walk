"use client";
import { useState } from 'react';

export default function DevDemo() {
  const [active, setActive] = useState(false);

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
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${active ? 'bg-red-700' : 'bg-slate-900'}`}>
      <div className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-lg w-full">
        <h1 className="text-4xl font-black mb-8 text-black tracking-tighter">DEVELOPER MODE</h1>
        
        {!active ? (
          <button 
            onClick={() => setActive(true)}
            className="w-full py-12 bg-red-600 text-white text-5xl font-black rounded-3xl shadow-2xl active:scale-90 transition-all"
          >
            🚀 TEST ALERT
          </button>
        ) : (
          <div className="space-y-6">
            <h2 className="text-6xl font-black text-red-600 animate-pulse">צבע אדום!</h2>
            <p className="text-2xl text-gray-600 font-bold">Симуляция запущена успешно</p>
            <button onClick={handleWazeClick} className="block w-full py-8 bg-[#33ccff] text-white text-4xl font-black rounded-2xl shadow-lg">Waze</button>
            <button onClick={() => setActive(false)} className="mt-6 text-gray-400 font-bold text-xl hover:text-black transition-colors">СБРОСИТЬ ТЕСТ</button>
          </div>
        )}
      </div>
    </div>
  );
}