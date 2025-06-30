interface Match {
  id: string;
  name: string;
  photo: string;
  compatibility: number;
}

interface GeographicLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

// Exportando as interfaces
export type { Match, GeographicLocation };
