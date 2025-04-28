import { FootballAPI } from './api.js';

// تعريف الكائن
const MatchRenderer = {
    elements: {
        todayContainer: null,
        tomorrowContainer: null,
        loadingIndicator: null,
        errorContainer: null,
        dateFilter: null,
        leagueFilter: null
    },

    // معرّفات الدوريات المهمة
    IMPORTANT_LEAGUES: new Set([
        39,    // الدوري الإنجليزي
        140,   // الدوري الإسباني
        135,   // الدوري الإيطالي
        78,    // الدوري الألماني
        61,    // الدوري الفرنسي
        564,   // الدوري السعودي
        2,     // دوري أبطال آسيا
        350    // الدوري المغربي
    ]),

    init: async function() {
        this.cacheElements();
        await this.loadMatches();
        this.setupEventListeners();
    },

    cacheElements: function() {
        this.elements = {
            todayContainer: document.getElementById('today-matches'),
            tomorrowContainer: document.getElementById('tomorrow-matches'),
            loadingIndicator: document.getElementById('loading-indicator'),
            errorContainer: document.getElementById('error-container'),
            dateFilter: document.getElementById('date-filter'),
            leagueFilter: document.getElementById('league-filter')
        };
    },

    setupEventListeners: function() {
        if (this.elements.dateFilter) {
            this.elements.dateFilter.addEventListener('change', (e) => this.handleDateFilter(e));
        }
        
        if (this.elements.leagueFilter) {
            this.elements.leagueFilter.addEventListener('change', (e) => this.handleLeagueFilter(e));
        }
    },

    handleDateFilter: async function(e) {
        const date = e.target.value;
        await this.renderMatches(date);
    },

    handleLeagueFilter: async function(e) {
        const leagueId = e.target.value;
        await this.renderMatches(null, leagueId);
    },

    loadMatches: async function() {
        try {
            this.showLoading();
            
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const [todayMatches, tomorrowMatches] = await Promise.all([
                this.getFilteredMatches(this.formatDate(today)),
                this.getFilteredMatches(this.formatDate(tomorrow))
            ]);
            
            this.renderMatchesByDate(todayMatches, 'today');
            this.renderMatchesByDate(tomorrowMatches, 'tomorrow');
            
        } catch (error) {
            console.error('Failed to load matches:', error);
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    },

    // دالة جديدة لتصفية المباريات
    getFilteredMatches: async function(date) {
        try {
            const response = await FootballAPI.getMatchesByDate(date);
            return response.response?.filter(match => 
                this.IMPORTANT_LEAGUES.has(match.league?.id)
            ) || [];
        } catch (error) {
            console.error('Error fetching matches:', error);
            return this.getFallbackMatches();
        }
    },

    // بيانات احتياطية عند فشل الاتصال
    getFallbackMatches: function() {
        return [
            {
                league: { 
                    id: 564, 
                    name: "الدوري السعودي",
                    logo: "assets/images/default-league.png"
                },
                teams: { 
                    home: { 
                        name: "الهلال",
                        logo: "assets/images/default-team.png"
                    }, 
                    away: { 
                        name: "النصر",
                        logo: "assets/images/default-team.png"
                    } 
                },
                fixture: {
                    date: new Date().toISOString(),
                    status: { short: "FT", long: "مباراة افتراضية" },
                    venue: { name: "ملعب الملك فهد" }
                },
                goals: { home: 0, away: 0 }
            }
        ];
    },

    renderMatchesByDate: function(matches, type) {
        const container = type === 'today' 
            ? this.elements.todayContainer 
            : this.elements.tomorrowContainer;
        
        if (!container) {
            console.error(`Container not found for ${type}`);
            return;
        }
        
        if (!matches || matches.length === 0) {
            container.innerHTML = this.getNoMatchesHTML();
            return;
        }
        
        container.innerHTML = matches.map(match => this.getMatchHTML(match)).join('');
    },

    getMatchHTML: function(match) {
        const leagueLogo = match.league.logo || 'assets/images/default-league.png';
        const homeLogo = match.teams.home.logo || 'assets/images/default-team.png';
        const awayLogo = match.teams.away.logo || 'assets/images/default-team.png';
        const venueName = match.fixture.venue?.name || 'ملعب غير معروف';

        const matchTime = new Date(match.fixture.date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const statusClass = match.fixture.status.short.toLowerCase();
        let score = '-';
        if (match.goals.home !== null && match.goals.away !== null) {
            score = `${match.goals.home} - ${match.goals.away}`;
        }

        return `
            <div class="match-card ${statusClass}">
                <div class="match-header">
                    <span class="league">
                        <img src="${leagueLogo}" 
                            alt="${match.league.name}"
                            onerror="this.src='assets/images/default-league.png'">
                        ${match.league.name}
                    </span>
                    <span class="status">${match.fixture.status.long}</span>
                </div>
                <div class="teams">
                    <div class="team home-team">
                        <img src="${homeLogo}" 
                            alt="${match.teams.home.name}"
                            onerror="this.src='assets/images/default-team.png'">
                        <span>${match.teams.home.name}</span>
                    </div>
                    <div class="score">
                        ${score}
                    </div>
                    <div class="team away-team">
                        <img src="${awayLogo}" 
                            alt="${match.teams.away.name}"
                            onerror="this.src='assets/images/default-team.png'">
                        <span>${match.teams.away.name}</span>
                    </div>
                </div>
                <div class="match-footer">
                    <span class="time">
                        <i class="far fa-clock"></i>
                        ${matchTime}
                    </span>
                    <span class="venue">
                        <i class="fas fa-map-marker-alt"></i>
                        ${venueName}
                    </span>
                </div>
            </div>
        `;
    },

    getNoMatchesHTML: function() {
        return `
            <div class="no-matches">
                <i class="far fa-futbol"></i>
                <p>لا توجد مباريات</p>
            </div>
        `;
    },

    showLoading: function() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }
    },

    hideLoading: function() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    },

    showError: function(error) {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${error.message || 'حدث خطأ في تحميل البيانات'}</p>
                    <button class="retry-btn">إعادة المحاولة</button>
                </div>
            `;
            this.elements.errorContainer.querySelector('.retry-btn')
                .addEventListener('click', () => this.loadMatches());
        }
    },

    formatDate: function(date) {
        return date.toISOString().split('T')[0];
    }
};

// التصدير الأساسي
export { MatchRenderer };

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    MatchRenderer.init();
});
