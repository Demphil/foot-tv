// assets/js/api.js

const API_KEY = (() => {
  // أولوية استيراد المفتاح من البيئات المختلفة
  if (import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  if (window.ENV?.RAPIDAPI_KEY) return window.ENV.RAPIDAPI_KEY;
  if (localStorage.getItem('RAPIDAPI_KEY')) return localStorage.getItem('RAPIDAPI_KEY');
  return 'fallback-demo-key'; // للتطوير فقط
})();

const API_HOST = 'api-football-v3.p.rapidapi.com';
const CACHE_DURATION = 15 * 60 * 1000; // 15 دقيقة

async function fetchWithCache(endpoint, params = {}) {
  const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
  const cached = sessionStorage.getItem(cacheKey);
  const now = Date.now();

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

    return data;

  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    if (cached) return JSON.parse(cached).data;
    throw error;
  }
}

export const FootballAPI = {
  getMatchesByDate: async (date) => {
    return fetchWithCache('fixtures', { date });
  },

  getLiveMatches: async () => {
    return fetchWithCache('fixtures', { live: 'all' });
  },

  getLeagues: async (season = new Date().getFullYear()) => {
    return fetchWithCache('leagues', { season });
  },

  getLeagueMatches: async (leagueId, season) => {
    return fetchWithCache('fixtures', { 
      league: leagueId, 
      season: season || new Date().getFullYear() 
    });
  },

  setApiKey: (key) => {
    localStorage.setItem('RAPIDAPI_KEY', key);
    sessionStorage.clear();
  }
};
