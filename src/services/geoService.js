import axios from 'axios';

/**
 * Risolve un nome di località in coordinate (lat, lon) usando Nominatim.
 * @param {string} locationName - Nome della città o località.
 * @returns {Promise<{lat: number, lon: number, display_name: string}>}
 */
export async function getCoordinates(locationName) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'SkyCast-AI-Orchestrator-PoC'
      },
      timeout: 8000
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        display_name
      };
    } else {
      throw new Error(`Località non trovata: ${locationName}`);
    }
  } catch (error) {
    console.error('Errore in GeoService:', error.message);
    throw error;
  }
}
