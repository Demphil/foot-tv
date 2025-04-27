// ملف مشترك لجميع طلبات API
const API_KEY = '795f377634msh4be097ebbb6dce3p1bf238jsn583f1b9cf438'; // استبدل بمفتاح API الخاص بك
const API_HOST = 'api-football-v1.p.rapidapi.com';

// دالة عامة لجلب البيانات من API
// استبدال fetch بالشكل التالي:
async function fetchData(endpoint, params = {}) {
  try {
    // محاولة جلب البيانات من API أولا
    const apiResponse = await fetchFromAPI(endpoint, params);
    return apiResponse;
  } catch (apiError) {
    console.error('API Error, using fallback:', apiError);
    // استخدام البيانات المحفوظة كحل بديل
    const fallbackResponse = await fetch('/data/matches.json');
    return await fallbackResponse.json();
  }
}

async function fetchFromAPI(endpoint, params) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(
    `https://${API_HOST}/v3/${endpoint}?${queryString}`, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    }
  );
  if (!response.ok) throw new Error('API request failed');
  return response.json();
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
