import { NextResponse } from 'next/server';

export async function GET() {
  console.log('API /alerts: Starting fetch from oref.org.il');
  try {
    const response = await fetch('https://www.oref.org.il/WarningMessages/History/AlertsHistory.json', {
      headers: {
        'Referer': 'https://www.oref.org.il/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // Чтобы данные всегда были свежими, а не из кэша
    });

    if (!response.ok) {
      console.error('API /alerts: Failed to fetch alerts, status:', response.status);
      throw new Error('Failed to fetch alerts');
    }

    const data = await response.json();
    console.log('API /alerts: Successfully fetched', data.length, 'alerts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API /alerts: Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to connect to army API' }, { status: 500 });
  }
}