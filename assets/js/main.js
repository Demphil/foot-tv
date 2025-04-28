import FootballAPI from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // اختبار الاتصال بالAPI
    const testData = await FootballAPI.getLiveMatches();
    console.log('API connection successful:', testData);
    
    // تهيئة العرض
    const today = new Date().toISOString().split('T')[0];
    const data = await FootballAPI.getMatchesByDate(today);
    
    // عرض المباريات
    if (data.response && data.response.length > 0) {
      const container = document.getElementById('matches-container');
      container.innerHTML = data.response.map(match => `
        <div class="match-card">
          <div class="teams">
            ${match.teams.home.name} vs ${match.teams.away.name}
          </div>
          <div class="score">
            ${match.goals.home ?? '-'} - ${match.goals.away ?? '-'}
          </div>
        </div>
      `).join('');
    }
    
  } catch (error) {
    console.error('API Error:', error);
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>حدث خطأ في تحميل البيانات</p>
          <button onclick="location.reload()">إعادة المحاولة</button>
        </div>
      `;
    }
  }
});
