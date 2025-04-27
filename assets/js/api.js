// api.js - الإصدار النهائي للعميل (المتصفح)

// 1. تهيئة المفتاح (اختر إحدى الطرق التالية)
const API_KEY = (() => {
  // الطريقة الأولى: للاستخدام مع Vite
  if (import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  
  // الطريقة الثانية: للاستخدام مع GitHub Pages
  if (window.ENV?.RAPIDAPI_KEY) return window.ENV.RAPIDAPI_KEY;
  
  // الطريقة الثالثة: من localStorage (للتطوير المحلي)
  if (localStorage.getItem('RAPIDAPI_KEY')) return localStorage.getItem('RAPIDAPI_KEY');
  
  // قيمة افتراضية (للتطوير فقط - لا تستخدم في الإنتاج)
  return 'fallback-demo-key';
})();

const API_HOST = 'api-football-v1.p.rapidapi.com';
const FALLBACK_DATA_URL = '/data/matches.json'; // مسار ملف البيانات الاحتياطية

// 2. دالة الجلب الأساسية مع نظام Fallback الذكي
async function fetchData(endpoint, params = {}) {
  try {
    // المحاولة الأولى: جلب البيانات من API الحية
    const apiData = await fetchFromAPI(endpoint, params);
    if (apiData?.response) return apiData;
    
    throw new Error('Invalid API response structure');
    
  } catch (apiError) {
    console.warn('API request failed, trying fallback:', apiError);
    
    try {
      // المحاولة الثانية: جلب البيانات من ملف Fallback
      const fallbackResponse = await fetch(FALLBACK_DATA_URL);
      if (!fallbackResponse.ok) throw new Error('Fallback file not found');
      
      const fallbackData = await fallbackResponse.json();
      
      // تطبيق التصفية على البيانات الاحتياطية إذا كانت معلمات موجودة
      if (params.date) {
        return {
          response: fallbackData.response?.filter(match => 
            match.fixture?.date?.includes(params.date)
          ) || []
        };
      }
      
      return fallbackData;
      
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      
      // 3. Fallback يدوي في حالة فشل كل شيء
      return generateManualFallback(params);
    }
  }
}

// 3. دالة الجلب من API
async function fetchFromAPI(endpoint, params) {
  const queryString = new URLSearchParams(params).toString();
  const url = `https://${API_HOST}/v3/${endpoint}?${queryString}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': API_HOST,
      'x-rapidapi-key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 4. إنشاء بيانات Fallback يدوية
function generateManualFallback(params) {
  const today = new Date().toISOString().split('T')[0];
  const date = params.date || today;
  
  return {
    response: [
      {
        fixture: {
          id: Math.floor(Math.random() * 10000),
          date: date,
          status: { short: 'FT', long: 'Fallback Data' },
          venue: { name: 'ملعب افتراضي' }
        },
        league: {
          id: 999,
          name: 'بطولة افتراضية',
          logo: 'assets/images/default-league.png'
        },
        teams: {
          home: {
            id: 1,
            name: 'فريق افتراضي 1',
            logo: 'assets/images/default-team.png'
          },
          away: {
            id: 2,
            name: 'فريق افتراضي 2',
            logo: 'assets/images/default-team.png'
          }
        },
        goals: { home: 1, away: 1 },
        score: {
          halftime: { home: 0, away: 0 },
          fulltime: { home: 1, away: 1 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      }
    ]
  };
}

// 5. واجهة API الرئيسية
const FootballAPI = {
  getMatchesByDate: async (date) => {
    return fetchData('fixtures', { date });
  },

  getLiveMatches: async () => {
    return fetchData('fixtures', { live: 'all' });
  },

  getLeagues: async () => {
    return fetchData('leagues');
  },

  getLeagueMatches: async (leagueId, season = new Date().getFullYear()) => {
    return fetchData('fixtures', { league: leagueId, season });
  },

  // دالة مساعدة لتعيين المفتاح (للتطوير)
  setApiKey: (key) => {
    localStorage.setItem('RAPIDAPI_KEY', key);
    console.log('API key updated locally');
  }
};

export default FootballAPI;
