// assets/js/api.js
const API_KEY = (() => {
  // أولوية استيراد المفتاح من البيئات المختلفة
  if (import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  if (window.ENV?.RAPIDAPI_KEY) return window.ENV.RAPIDAPI_KEY;
  if (localStorage.getItem('RAPIDAPI_KEY')) return localStorage.getItem('RAPIDAPI_KEY');
  return '795f377634msh4be097ebbb6dce3p1bf238jsn583f1b9cf438'; // مفتاح افتراضي
})();

const API_HOST = 'sportapi7.p.rapidapi.com';
const BASE_URL = 'https://sportapi7.p.rapidapi.com/api/v1';
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

export const SportsAPI = {
  // كرة القدم
  getFootballMatchesByDate: async (date) => {
    return fetchWithCache('event/football/matches', { date });
  },

  // التنس
  getTennisEventDetails: async (eventId) => {
    return fetchWithCache(`event/${eventId}/tennis-power`);
  },

  // عام
  getLiveEvents: async (sportType = 'football') => {
    return fetchWithCache('events/live', { sport: sportType });
  },

  // إدارة المفتاح
  setApiKey: (key) => {
    localStorage.setItem('RAPIDAPI_KEY', key);
    sessionStorage.clear();
  },

  // تنظيف الكاش
  clearCache: () => {
    sessionStorage.clear();
  }
};
