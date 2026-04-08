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
    ip.startsWith("172.") ||
    ip === "unknown"
  ) {
    return {};
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,isp,lat,lon`,
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
