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
try {
    // بناء URL الطلب
    const url = `${BASE_URL}/${endpoint}${params ? `?${new URLSearchParams(params)}` : ''}`;
    
    // إرسال الطلب إلى API
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    // معالجة الأخطاء
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // معالجة البيانات الناجحة
    const data = await response.json();

    // تصفية المباريات حسب الدوريات المهمة
    if (endpoint.includes('matches') || endpoint.includes('competitions')) {
      data.matches = data.matches?.filter(match => 
        IMPORTANT_LEAGUES.has(match.competition?.code)
      ) || [];
    }

    // تخزين البيانات في الذاكرة المؤقتة
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: now
    }));
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
