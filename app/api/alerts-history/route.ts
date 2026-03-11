import { NextRequest, NextResponse } from "next/server";

type HistoryAlert = {
  alertDate?: string;
  title?: string;
  data: string[];
  source?: "oref" | "redalert";
  threat?: string;
};

type OrefHistoryAlert = {
  alertDate?: string;
  title?: string;
  data?: string[];
};

type RedAlertRawItem = {
  id: number;
  date: number; // unix timestamp in seconds
  area: string;
  threat: string;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/["'׳״]/g, "")
    .replace(/\s+/g, " ");
}

function areaMatchesCity(area: string, cityName: string) {
  const normalizedArea = normalizeText(area);
  const normalizedCity = normalizeText(cityName);

  return (
    normalizedArea === normalizedCity ||
    normalizedArea.includes(normalizedCity) ||
    normalizedCity.includes(normalizedArea)
  );
}

function mapThreatToTitle(threat?: string) {
  switch (threat) {
    case "missiles":
      return "ירי רקטות וטילים";
    case "hostileAircraftIntrusion":
      return "חדירת כלי טיס עוין";
    case "terroristInfiltration":
      return "חדירת מחבלים";
    default:
      return threat || "התרעה";
  }
}

async function fetchOrefHistory(city?: string): Promise<HistoryAlert[]> {
  const response = await fetch(
    "https://www.oref.org.il/WarningMessages/History/AlertsHistory.json",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.oref.org.il/",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Oref history request failed with ${response.status}`);
  }

  const text = await response.text();

  if (!text || !text.trim()) {
    return [];
  }

  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    return [];
  }

  let alerts: HistoryAlert[] = parsed
    .filter((item: OrefHistoryAlert) => Array.isArray(item.data))
    .map((item: OrefHistoryAlert) => ({
      alertDate: item.alertDate,
      title: item.title || "התרעה",
      data: item.data || [],
      source: "oref" as const,
    }));

  if (city) {
    alerts = alerts.filter((alert) =>
      alert.data.some((area) => areaMatchesCity(area, city))
    );
  }

  return alerts;
}

async function fetchRedAlertHistory(city?: string): Promise<HistoryAlert[]> {
  const redAlertUrl =
    process.env.REDALERT_HISTORY_URL || "https://api.redalert.me/alerts";

  const response = await fetch(redAlertUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/plain, */*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RedAlert history request failed with ${response.status}`);
  }

  const text = await response.text();

  if (!text || !text.trim()) {
    return [];
  }

  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    return [];
  }

  let rows: RedAlertRawItem[] = parsed.filter(
    (item: RedAlertRawItem) =>
      typeof item?.date === "number" &&
      typeof item?.area === "string" &&
      typeof item?.threat === "string"
  );

  if (city) {
    rows = rows.filter((row) => areaMatchesCity(row.area, city));
  }

  // Группируем записи одного и того же события
  const grouped = new Map<string, HistoryAlert>();

  for (const row of rows) {
    const alertDate = new Date(row.date * 1000).toISOString();
    const title = mapThreatToTitle(row.threat);

    // ключ: время + тип угрозы
    const key = `${row.date}_${row.threat}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        alertDate,
        title,
        data: [row.area],
        source: "redalert",
        threat: row.threat,
      });
    } else {
      const existing = grouped.get(key)!;
      if (!existing.data.includes(row.area)) {
        existing.data.push(row.area);
      }
    }
  }

  return Array.from(grouped.values());
}

function dedupeAlerts(alerts: HistoryAlert[], city?: string): HistoryAlert[] {
  const deduped = new Map<string, HistoryAlert>();

  for (const alert of alerts) {
    const time = alert.alertDate
      ? Math.floor(new Date(alert.alertDate).getTime() / 60000)
      : 0;

    const normalizedTitle = normalizeText(alert.title || "התרעה");

    // если уже фильтруем по городу, то достаточно minute + title
    // чтобы не считать один и тот же event дважды из разных источников
    const key = city
      ? `${time}_${normalizedTitle}`
      : `${time}_${normalizedTitle}_${alert.data
          .map((x) => normalizeText(x))
          .sort()
          .join("|")}`;

    if (!deduped.has(key)) {
      deduped.set(key, alert);
    } else {
      const existing = deduped.get(key)!;

      // объединяем data
      for (const area of alert.data) {
        if (!existing.data.includes(area)) {
          existing.data.push(area);
        }
      }

      // предпочитаем Oref как основной источник
      if (existing.source !== "oref" && alert.source === "oref") {
        existing.source = "oref";
      }
    }
  }

  return Array.from(deduped.values());
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") || undefined;

  const results = await Promise.allSettled([
    fetchOrefHistory(city),
    fetchRedAlertHistory(city),
  ]);

  const merged: HistoryAlert[] = [];

  const orefResult = results[0];
  const redAlertResult = results[1];

  if (orefResult.status === "fulfilled") {
    merged.push(...orefResult.value);
  }

  if (redAlertResult.status === "fulfilled") {
    merged.push(...redAlertResult.value);
  }

  if (merged.length === 0) {
    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message || "Unknown error");

    return NextResponse.json(
      {
        error: "Failed to fetch alerts history from all providers",
        details: errors,
      },
      { status: 500 }
    );
  }

  const deduped = dedupeAlerts(merged, city).sort((a, b) => {
    const aTime = a.alertDate ? new Date(a.alertDate).getTime() : 0;
    const bTime = b.alertDate ? new Date(b.alertDate).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(deduped, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}