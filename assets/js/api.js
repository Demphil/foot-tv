// ملف مشترك لجميع طلبات API
const API_KEY = process.env.RAPIDAPI_KEY || 'fallback-key';
 // احذر! لا تضع المفتاح هنا مباشرة في الإنتاج
const API_HOST = 'api-football-v1.p.rapidapi.com';

// دالة مساعدة للطلب من API
async function fetchFromAPI(endpoint, params = {}) {
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

    return await response.json();
}

// دالة رئيسية مع نظام Fallback
async function fetchData(endpoint, params = {}) {
    try {
        // المحاولة الأولى: جلب البيانات من API الحية
        return await fetchFromAPI(endpoint, params);
    } catch (apiError) {
        console.error('Failed to fetch from API, trying fallback:', apiError);
        
        try {
            // المحاولة الثانية: جلب البيانات من ملف محلي
            const fallbackResponse = await fetch('/data/matches.json');
            
            if (!fallbackResponse.ok) {
                throw new Error('Fallback file not found');
            }
            
            const fallbackData = await fallbackResponse.json();
            
            // تطبيق التصفية على البيانات المحلية إذا كانت معلمات موجودة
            if (params.date) {
                return {
                    response: fallbackData.response.filter(match => 
                        match.fixture.date.includes(params.date)
                    )
                };
            }
            
            return fallbackData;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error('Both API and fallback failed');
        }
    }
}

// واجهة API للاستخدام في الملفات الأخرى
const FootballAPI = {
    getMatchesByDate: async (date) => {
        return await fetchData('fixtures', { date });
    },

    getLiveMatches: async () => {
        return await fetchData('fixtures', { live: 'all' });
    },

    getLeagues: async () => {
        return await fetchData('leagues');
    },

    getLeagueMatches: async (leagueId, season) => {
        return await fetchData('fixtures', { league: leagueId, season });
    }
};

