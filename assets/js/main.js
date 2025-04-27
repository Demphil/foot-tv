// وظائف عامة للموقع
document.addEventListener('DOMContentLoaded', () => {
    // تحميل المباريات المميزة في الصفحة الرئيسية
    if (document.getElementById('featured-matches-container')) {
        loadFeaturedMatches();
    }

    // إضافة حدث لقائمة الهاتف
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const nav = document.querySelector('.main-nav');
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        });
    }
});

// دالة جلب المباريات المميزة
async function loadFeaturedMatches() {
    try {
        const container = document.getElementById('featured-matches-container');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        const data = await FootballAPI.getLiveMatches();
        const matches = data.response.slice(0, 4); // عرض أول 4 مباريات فقط
        
        if (matches.length === 0) {
            container.innerHTML = '<div class="no-matches">لا توجد مباريات مميزة حالياً</div>';
            return;
        }
        
        container.innerHTML = matches.map(match => `
            <div class="match-card live">
                <div class="match-header">
                    <span class="league">${match.league.name}</span>
                    <span class="status">${match.fixture.status.long}</span>
                </div>
                <div class="teams">
                    <div class="team home-team">
                        <img src="${match.teams.home.logo}" alt="${match.teams.home.name}">
                        <span>${match.teams.home.name}</span>
                    </div>
                    <div class="match-time">
                        ${match.goals.home} - ${match.goals.away}
                    </div>
                    <div class="team away-team">
                        <img src="${match.teams.away.logo}" alt="${match.teams.away.name}">
                        <span>${match.teams.away.name}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured matches:', error);
    }
}
