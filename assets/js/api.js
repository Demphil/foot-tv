// assets/js/api.js

// دالة مساعدة لجلب المفتاح من مصادر مختلفة
const getApiKey = () => {
  // 1. محاولة جلب المفتاح من متغيرات بيئة Vite (للتطوير المحلي)
  if (import.meta.env?.VITE_FOOTBALL_DATA_API_KEY) {
    return import.meta.env.VITE_FOOTBALL_DATA_API_KEY;
  }

  // 2. محاولة جلب المفتاح من window.ENV (للاستضافة مثل GitHub Pages)
  if (window.ENV?.FOOTBALL_DATA_API_KEY) {
    return window.ENV.FOOTBALL_DATA_API_KEY;
  }

  // 3. محاولة جلب المفتاح من localStorage (للتخزين المحلي)
  if (localStorage.getItem('FOOTBALL_DATA_API_KEY')) {
    return localStorage.getItem('FOOTBALL_DATA_API_KEY');
  }

  // 4. استخدام مفتاح افتراضي (لأغراض التطوير فقط)
  console.warn('Warning: Using default API key - for development only');
  return 'YOUR_DEFAULT_API_KEY_HERE';
};

const API_KEY = getApiKey();
const BASE_URL = 'https://api.football-data.org/v4';
const CACHE_DURATION = 15 * 60 * 1000; // 15 دقيقة تخزين مؤقت

// معرّفات الدوريات المهمة (يجب تحديثها حسب توثيق football-data.org)
const IMPORTANT_LEAGUES = new Set([
  'PL',   // الدوري الإنجليزي الممتاز
  'PD',   // الدوري الإسباني
  'SA',   // الدوري الإيطالي
  'BL1',  // الدوري الألماني
  'FL1',  // الدوري الفرنسي
  'SAU',  // الدوري السعودي
  'MAR1'  // الدوري المغربي
]);

// دالة مساعدة للطلبات مع التخزين المؤقت
async function fetchWithCache(endpoint, params = {}) {
  const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
  const cached = sessionStorage.getItem(cacheKey);
  const now = Date.now();

  // التحقق من وجود بيانات في الذاكرة المؤقتة
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
        'Content-Type': 'application/json'
      }
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
    
    // استعادة البيانات من الذاكرة المؤقتة في حالة الخطأ
    if (cached) {
      return JSON.parse(cached).data;
    }
    
    throw error;
  }
}

// كائن API الرئيسي
const FootballAPI = {
  /**
   * جلب المباريات حسب التاريخ
   * @param {string} date - التاريخ بصيغة YYYY-MM-DD
   * @returns {Promise<Object>} - بيانات المباريات
   */
  getMatchesByDate: async (date) => {
    try {
      return await fetchWithCache('matches', { date });
    } catch (error) {
      console.error('Failed to fetch matches by date:', error);
      throw error;
    }
  },

  /**
   * جلب مباريات دوري معين
   * @param {string} leagueCode - كود الدوري (مثال: 'PL' للدوري الإنجليزي)
   * @returns {Promise<Object>} - بيانات مباريات الدوري
   */
  getLeagueMatches: async (leagueCode) => {
    if (!IMPORTANT_LEAGUES.has(leagueCode)) {
      throw new Error('الدوري المطلوب غير مدعوم');
    }
    
    try {
      return await fetchWithCache(`competitions/${leagueCode}/matches`);
    } catch (error) {
      console.error(`Failed to fetch league ${leagueCode} matches:`, error);
      throw error;
    }
  },

  /**
   * جلب المباريات الحية
   * @returns {Promise<Object>} - بيانات المباريات الجارية
   */
  getLiveMatches: async () => {
    try {
      const data = await fetchWithCache('matches', { status: 'LIVE' });
      data.matches = data.matches?.filter(match => 
        IMPORTANT_LEAGUES.has(match.competition?.code)
      ) || [];
      return data;
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      throw error;
    }
  },

  /**
   * تحديث مفتاح API
   * @param {string} key - المفتاح الجديد
   */
  setApiKey: (key) => {
    localStorage.setItem('FOOTBALL_DATA_API_KEY', key);
    sessionStorage.clear(); // مسح الذاكرة المؤقتة عند تغيير المفتاح
    console.log('API key updated successfully');
  },

  /**
   * التحقق من صحة المفتاح
   * @returns {boolean} - true إذا كان المفتاح صالحاً
   */
  checkApiKey: () => {
    if (API_KEY === 'YOUR_DEFAULT_API_KEY_HERE') {
      console.error('لم يتم تعيين مفتاح API، الرجاء إضافة المفتاح في ملف .env');
      return false;
    }
    return true;
  },

  /**
   * إضافة دوري جديد للقائمة المهمة
   * @param {string} leagueCode - كود الدوري
   */
  addImportantLeague: (leagueCode) => {
    IMPORTANT_LEAGUES.add(leagueCode);
    console.log(`تمت إضافة الدوري ${leagueCode} إلى القائمة المهمة`);
  },

  /**
   * إزالة دوري من القائمة المهمة
   * @param {string} leagueCode - كود الدوري
   */
  removeImportantLeague: (leagueCode) => {
    IMPORTANT_LEAGUES.delete(leagueCode);
    console.log(`تمت إزالة الدوري ${leagueCode} من القائمة المهمة`);
  }
};

// تصدير كائن API
export { FootballAPI };
