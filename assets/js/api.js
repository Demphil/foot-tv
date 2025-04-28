// assets/js/api.js
const API_KEY = (() => {
  if (import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  if (window.ENV?.FOOTBALL_DATA_KEY) return window.ENV.FOOTBALL_DATA_KEY;
  if (localStorage.getItem('FOOTBALL_DATA_KEY')) return localStorage.getItem('FOOTBALL_DATA_KEY');
  return 'YOUR_DEFAULT_API_KEY'; // استبدله بمفتاحك من football-data.org
})();

const BASE_URL = 'https://api.football-data.org/v4';
const CACHE_DURATION = 15 * 60 * 1000; // 15 دقيقة

// معرّفات الدوريات المهمة (يجب تحديثها حسب معرّفات football-data.org)
const IMPORTANT_LEAGUES = new Set([
  'PL',    // الدوري الإنجليزي
  'PD',    // الدوري الإسباني
  'SA',    // الدوري الإيطالي
  'BL1',   // الدوري الألماني
  'FL1',   // الدوري الفرنسي
  'DZ1',   // الدوري المغربي (قد تحتاج لتأكيد المعرّف)
  'SAU'    // الدوري السعودي (قد تحتاج لتأكيد المعرّف)
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
    const url = `${BASE_URL}/${endpoint}${params ? `?${new URLSearchParams(params)}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // تصفية البيانات للدوريات المهمة
    if (endpoint.includes('matches') || endpoint.includes('competitions')) {
      data.matches = data.matches?.filter(match => 
        IMPORTANT_LEAGUES.has(match.competition?.code)
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
  // الحصول على مباريات حسب التاريخ
  getMatchesByDate: async (date) => {
    return fetchWithCache('matches', { date });
  },

  // الحصول على مباريات دوري معين
  getLeagueMatches: async (leagueCode) => {
    if (!IMPORTANT_LEAGUES.has(leagueCode)) {
      throw new Error('هذا الدوري غير مدرج في القائمة المطلوبة');
    }
    return fetchWithCache(`competitions/${leagueCode}/matches`);
  },

  // الحصول على المباريات الحية
  getLiveMatches: async () => {
    const data = await fetchWithCache('matches', { status: 'LIVE' });
    data.matches = data.matches?.filter(match => 
      IMPORTANT_LEAGUES.has(match.competition?.code)
    ) || [];
    return data;
  },

  // إدارة المفتاح API
  setApiKey: (key) => {
    localStorage.setItem('FOOTBALL_DATA_KEY', key);
    sessionStorage.clear();
  },

  // إضافة دوري جديد للقائمة المهمة
  addImportantLeague: (leagueCode) => {
    IMPORTANT_LEAGUES.add(leagueCode);
  },

  // إزالة دوري من القائمة المهمة
  removeImportantLeague: (leagueCode) => {
    IMPORTANT_LEAGUES.delete(leagueCode);
  }
};
export { FootballAPI };
