import { FootballAPI } from "./.api.js";;

document.addEventListener('DOMContentLoaded', async () => {
    // عناصر DOM
    const matchesContainer = document.getElementById('matches-container');
    const todayBtn = document.getElementById('today-btn');
    const tomorrowBtn = document.getElementById('tomorrow-btn');
    const weekBtn = document.getElementById('week-btn');
    const leagueSelect = document.getElementById('league-select');

    // جلب وتعبئة قائمة البطولات
    async function loadLeagues() {
        try {
            const data = await FootballAPI.getLeagues();
            const leagues = data.response;
            
            leagues.forEach(league => {
                const option = document.createElement('option');
                option.value = league.league.id;
                option.textContent = league.league.name;
                leagueSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading leagues:', error);
        }
    }

    // جلب وعرض المباريات حسب التاريخ
    async function loadMatches(date) {
        try {
            matchesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> جاري تحميل المباريات...</div>';
            
            const data = await FootballAPI.getMatchesByDate(date);
            const matches = data.response;
            
            if (matches.length === 0) {
                matchesContainer.innerHTML = '<div class="no-matches">لا توجد مباريات في هذا التاريخ</div>';
                return;
            }
            
            matchesContainer.innerHTML = matches.map(match => `
                <div class="match-card ${match.fixture.status.short === 'NS' ? 'upcoming' : match.fixture.status.short === 'LIVE' ? 'live' : 'finished'}">
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
                            ${match.fixture.status.short === 'NS' ? 
                                new Date(match.fixture.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                                match.goals.home !== undefined ? `${match.goals.home} - ${match.goals.away}` : 'VS'}
                        </div>
                        <div class="team away-team">
                            <img src="${match.teams.away.logo}" alt="${match.teams.away.name}">
                            <span>${match.teams.away.name}</span>
                        </div>
                    </div>
                    <div class="match-footer">
                        <span class="venue"><i class="fas fa-map-marker-alt"></i> ${match.fixture.venue.name}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            matchesContainer.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ في جلب البيانات. يرجى المحاولة لاحقاً</p>
                    <button onclick="location.reload()">إعادة المحاولة</button>
                </div>
            `;
            console.error('Error loading matches:', error);
        }
    }

    // معالجة أحداث الأزرار
    todayBtn.addEventListener('click', () => {
        todayBtn.classList.add('active');
        tomorrowBtn.classList.remove('active');
        weekBtn.classList.remove('active');
        const today = new Date().toISOString().split('T')[0];
        loadMatches(today);
    });

    tomorrowBtn.addEventListener('click', () => {
        tomorrowBtn.classList.add('active');
        todayBtn.classList.remove('active');
        weekBtn.classList.remove('active');
        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
        loadMatches(tomorrow);
    });

    weekBtn.addEventListener('click', () => {
        weekBtn.classList.add('active');
        todayBtn.classList.remove('active');
        tomorrowBtn.classList.remove('active');
        // هنا يمكنك إضافة دالة لجلب مباريات الأسبوع
    });

    // معالجة حدث تغيير البطولة
    leagueSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'all') {
            const currentDate = document.querySelector('.date-filter button.active').id.split('-')[0];
            const date = currentDate === 'today' ? 
                new Date().toISOString().split('T')[0] : 
                new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
            
            // جلب مباريات البطولة المحددة
            // يمكنك تطوير هذه الوظيفة حسب احتياجاتك
        }
    });

    // تحميل البيانات الأولية
    await loadLeagues();
    const today = new Date().toISOString().split('T')[0];
    loadMatches(today);
});
