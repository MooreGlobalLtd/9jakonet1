/**
 * Nigerian State Geolocation Coordinates for instant fallback
 * when browser GPS permissions are restricted or unavailable.
 */

export interface StateCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export const NIGERIAN_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Abia': { lat: 5.4527, lng: 7.5248 },
  'Abuja': { lat: 9.0765, lng: 7.3986 },
  'Adamawa': { lat: 9.3265, lng: 12.4452 },
  'Akwa Ibom': { lat: 5.0377, lng: 7.9128 },
  'Anambra': { lat: 6.2209, lng: 7.0722 },
  'Bauchi': { lat: 10.3159, lng: 9.8442 },
  'Bayelsa': { lat: 4.7719, lng: 6.0699 },
  'Benue': { lat: 7.7322, lng: 8.5214 },
  'Borno': { lat: 11.8333, lng: 13.1500 },
  'Cross River': { lat: 5.8702, lng: 8.5988 },
  'Delta': { lat: 5.7040, lng: 5.9339 },
  'Ebonyi': { lat: 6.2649, lng: 8.0137 },
  'Edo': { lat: 6.5244, lng: 5.8987 },
  'Ekiti': { lat: 7.6210, lng: 5.2209 },
  'Enugu': { lat: 6.4584, lng: 7.5464 },
  'Gombe': { lat: 10.2897, lng: 11.1673 },
  'Imo': { lat: 5.4924, lng: 7.0267 },
  'Jigawa': { lat: 12.2280, lng: 9.5616 },
  'Kaduna': { lat: 10.5105, lng: 7.4165 },
  'Kano': { lat: 12.0022, lng: 8.5920 },
  'Katsina': { lat: 12.9908, lng: 7.6018 },
  'Kebbi': { lat: 12.4504, lng: 4.1999 },
  'Kogi': { lat: 7.7337, lng: 6.6906 },
  'Kwara': { lat: 8.4799, lng: 4.5418 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Nasarawa': { lat: 8.5378, lng: 8.3243 },
  'Niger': { lat: 9.9309, lng: 5.5983 },
  'Ogun': { lat: 7.1475, lng: 3.3619 },
  'Ondo': { lat: 7.2571, lng: 5.2058 },
  'Osun': { lat: 7.5629, lng: 4.5200 },
  'Oyo': { lat: 7.3775, lng: 3.9470 },
  'Plateau': { lat: 9.2182, lng: 9.5179 },
  'Rivers': { lat: 4.8156, lng: 7.0498 },
  'Sokoto': { lat: 13.0059, lng: 5.2476 },
  'Taraba': { lat: 7.8704, lng: 9.7800 },
  'Yobe': { lat: 12.0000, lng: 11.5000 },
  'Zamfara': { lat: 12.1222, lng: 6.2236 }
};

export function getStateCoordinates(stateName: string): { lat: number; lng: number } {
  const match = NIGERIAN_STATE_COORDS[stateName];
  if (match) return match;

  // Search case-insensitively
  const lower = (stateName || '').toLowerCase().trim();
  for (const [key, val] of Object.entries(NIGERIAN_STATE_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  // Default to Lagos (economic capital)
  return { lat: 6.5244, lng: 3.3792 };
}
