// assets/js/api.js

// دالة مساعدة لجلب المفتاح من مصادر مختلفة
const getApiKey = () => {
  // 1. جلب المفتاح من متغيرات بيئة Vite (للتطوير المحلي)
  if (import.meta.env?.VITE_FOOTBALL_DATA_KEY) {
    return import.meta.env.VITE_FOOTBALL_DATA_KEY;
  }

  // 2. جلب المفتاح من window.ENV (للإنتاج مثل GitHub Pages)
  if (window.ENV?.FOOTBALL_DATA_KEY) {
    return window.ENV.FOOTBALL_DATA_KEY;
  }

  // 3. جلب المفتاح من localStorage
  if (localStorage.getItem('FOOTBALL_DATA_KEY')) {
    return localStorage.getItem('FOOTBALL_DATA_KEY');
  }

  // 4. استخدام مفتاح افتراضي (للتطوير فقط)
  console.warn('Using default API key - for development only');
  return 'FOOTBALL_DATA_KEY_HERE';
};

const API_KEY = getApiKey();
const BASE_URL = 'https://api.football-data.org/v4';
const CACHE_DURATION = 15 * 60 * 1000; // 15 دقيقة تخزين مؤقت

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// الدوال الخاصة بالمباريات
export const FootballAPI = {
    // جلب المباريات حسب التاريخ
    getMatchesByDate: async (date) => {
        return await fetchData('fixtures', { date });
    },

    // جلب المباريات الحية
    getLiveMatches: async () => {
        return await fetchData('fixtures', { live: 'all' });
    },

    // جلب البطولات
    getLeagues: async () => {
        return await fetchData('leagues');
    },

    // جلب مباريات بطولة معينة
    getLeagueMatches: async (leagueId, season) => {
        return await fetchData('fixtures', { league: leagueId, season });
    }
};
