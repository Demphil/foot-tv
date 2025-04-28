// ملف مشترك لجميع طلبات API
const API_KEY = 'your-api-key-here'; // استبدل بمفتاح API الخاص بك
const API_HOST = 'api-football-v1.p.rapidapi.com';

// دالة عامة لجلب البيانات من API
async function fetchData(endpoint, params = {}) {
    try {
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
