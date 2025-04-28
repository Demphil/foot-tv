// assets/js/api.js
const API_KEY = (() => {
  // أولوية استيراد المفتاح من البيئات المختلفة
  if (import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  if (window.ENV?.RAPIDAPI_KEY) return window.ENV.RAPIDAPI_KEY;
  if (localStorage.getItem('RAPIDAPI_KEY')) return localStorage.getItem('RAPIDAPI_KEY');
  return '795f377634msh4be097ebbb6dce3p1bf238jsn583f1b9cf438'; // مفتاح افتراضي للتطوير
})();

const API_HOST = 'sportapi7.p.rapidapi.com';
const BASE_URL = 'https://sportapi7.p.rapidapi.com/api/v1';
const CACHE_DURATION = 15 * 60 * 1000; // 15 دقيقة

// معرّفات الدوريات المهمة
const IMPORTANT_LEAGUES = new Set([
  // الدوريات الأوروبية
  39,    // الدوري الإنجليزي
  140,   // الدوري الإسباني
  135,   // الدوري الإيطالي
  78,    // الدوري الألماني
  61,    // الدوري الفرنسي
  
  // دوريات أخرى مطلوبة
  564,   // الدوري السعودي
  350    // الدوري المغربي
]);

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
    const url = `${BASE_URL}/${endpoint}?${new URLSearchParams(params)}`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Host': API_HOST,
        'X-RapidAPI-Key': API_KEY
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // تصفية البيانات للدوريات المهمة فقط إذا كانت استجابة المباريات
    if (endpoint.includes('matches') || endpoint.includes('fixtures')) {
      data.response = data.response?.filter(event => 
        IMPORTANT_LEAGUES.has(event.league?.id)
      ) || [];
    }

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
  // الحصول على مباريات حسب التاريخ مع تصفية الدوريات
  getMatchesByDate: async (date) => {
    return fetchWithCache('event/football/matches', { date });
  },

  // الحصول على مباريات الدوري المحدد
  getLeagueMatches: async (leagueId, season = new Date().getFullYear()) => {
    if (!IMPORTANT_LEAGUES.has(Number(leagueId))) {
      throw new Error('هذا الدوري غير مدرج في القائمة المطلوبة');
    }
    return fetchWithCache('event/football/matches', { 
      league: leagueId,
      season
    });
  },

  // الحصول على المباريات الحية (الدوريات المهمة فقط)
  getLiveMatches: async () => {
    const data = await fetchWithCache('events/live', { sport: 'football' });
    data.response = data.response?.filter(event => 
      IMPORTANT_LEAGUES.has(event.league?.id)
    ) || [];
    return data;
  },

  // إدارة المفتاح API
  setApiKey: (key) => {
    localStorage.setItem('RAPIDAPI_KEY', key);
    sessionStorage.clear();
  },

  // إضافة دوري جديد للقائمة المهمة
  addImportantLeague: (leagueId) => {
    IMPORTANT_LEAGUES.add(Number(leagueId));
  },

  // إزالة دوري من القائمة المهمة
  removeImportantLeague: (leagueId) => {
    IMPORTANT_LEAGUES.delete(Number(leagueId));
  }
};
