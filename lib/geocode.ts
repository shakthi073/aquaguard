const NOMINATIM_HEADERS = {
  'User-Agent': process.env.NOMINATIM_USER_AGENT || 'AquaGuard/1.0 (water body encroachment reporting)',
  Accept: 'application/json',
};

export async function reverseGeocode(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) {
    throw new Error('Reverse geocoding failed');
  }

  const data = await res.json();
  const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const city =
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.county ||
    data.address?.state_district ||
    'Unknown';
  const state = data.address?.state || 'Unknown';

  return { address, city, state, lat, lng };
}