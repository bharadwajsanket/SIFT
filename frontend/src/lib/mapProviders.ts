export interface MapProvider {
  id: string;
  displayName: string;
  isExternalDestination: boolean;
  buildSearchUrl: (query: string) => string;
  buildPlaceUrl: (title: string, lat?: number, lon?: number) => string;
}

export const MAP_PROVIDERS: Record<string, MapProvider> = {
  openstreetmap: {
    id: 'openstreetmap',
    displayName: 'OpenStreetMap',
    isExternalDestination: false,
    buildSearchUrl: (query: string) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`,
    buildPlaceUrl: (title: string, lat?: number, lon?: number) => {
      if (typeof lat === 'number' && typeof lon === 'number') {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
      }
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(title)}`;
    },
  },
  google: {
    id: 'google',
    displayName: 'Google Maps',
    isExternalDestination: true,
    buildSearchUrl: (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    buildPlaceUrl: (title: string, lat?: number, lon?: number) => {
      if (typeof lat === 'number' && typeof lon === 'number') {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      }
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;
    },
  },
  apple: {
    id: 'apple',
    displayName: 'Apple Maps',
    isExternalDestination: true,
    buildSearchUrl: (query: string) => `https://maps.apple.com/?q=${encodeURIComponent(query)}`,
    buildPlaceUrl: (title: string, lat?: number, lon?: number) => {
      if (typeof lat === 'number' && typeof lon === 'number') {
        return `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(title)}`;
      }
      return `https://maps.apple.com/?q=${encodeURIComponent(title)}`;
    },
  },
  photon: {
    id: 'photon',
    displayName: 'Photon / OSM',
    isExternalDestination: false,
    buildSearchUrl: (query: string) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`,
    buildPlaceUrl: (title: string, lat?: number, lon?: number) => {
      if (typeof lat === 'number' && typeof lon === 'number') {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
      }
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(title)}`;
    },
  },
};

export const DEFAULT_MAP_PROVIDER_ID = 'openstreetmap';

export function getMapProvider(id?: string | null): MapProvider {
  if (id && MAP_PROVIDERS[id]) {
    return MAP_PROVIDERS[id];
  }
  return MAP_PROVIDERS[DEFAULT_MAP_PROVIDER_ID];
}
