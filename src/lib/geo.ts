export interface GeoData {
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  lat?: number;
  lon?: number;
}

/**
 * Look up geolocation for an IP address using ip-api.com (free, no key required).
 * Returns an empty object if the lookup fails or the IP is private.
 */
export async function lookupGeo(ip: string): Promise<GeoData> {
  // Skip lookup for private / loopback addresses
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip === "unknown"
  ) {
    return {};
  }
  // 172.16.0.0/12 private range (172.16.x.x – 172.31.x.x)
  const parts = ip.split(".");
  if (parts[0] === "172") {
    const second = parseInt(parts[1] ?? "", 10);
    if (!isNaN(second) && second >= 16 && second <= 31) return {};
  }

  try {
    const res = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,isp,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as {
      status: string;
      country?: string;
      regionName?: string;
      city?: string;
      isp?: string;
      lat?: number;
      lon?: number;
    };
    if (data.status !== "success") return {};
    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return {};
  }
}
