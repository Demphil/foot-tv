import { FootballAPI } from './api.js';
const MatchRenderer = {
    elements: {
        todayContainer: null,
        tomorrowContainer: null,
        loadingIndicator: null,
        errorContainer: null,
        dateFilter: null,
        leagueFilter: null
    },

    // معرّفات الدوريات المهمة (رموز football-data.org)
    IMPORTANT_LEAGUES: new Set([
        'PL',    // الدوري الإنجليزي الممتاز
        'PD',    // الدوري الإسباني
        'SA',    // الدوري الإيطالي
        'BL1',   // الدوري الألماني
        'FL1',   // الدوري الفرنسي
        'SAU',   // الدوري السعودي
        'CL',    // دوري أبطال أوروبا
        'MAR1'   // الدوري المغربي (يجب التأكد من الرمز)
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
        const leagueCode = e.target.value;
        await this.renderMatches(null, leagueCode);
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

    getFilteredMatches: async function(date) {
        try {
            const response = await FootballAPI.getMatchesByDate(date);
            return response.matches?.filter(match => 
                this.IMPORTANT_LEAGUES.has(match.competition?.code)
            ) || [];
        } catch (error) {
            console.error('Error fetching matches:', error);
            return this.getFallbackMatches();
        }
    },

    getFallbackMatches: function() {
        return [
            {
                competition: { 
                    code: 'SAU',
                    name: "الدوري السعودي",
                    emblem: "assets/images/default-league.png"
                },
                homeTeam: { 
                    name: "الهلال",
                    shortName: "الهلال",
                    crest: "assets/images/default-team.png"
                },
                awayTeam: { 
                    name: "النصر",
                    shortName: "النصر",
                    crest: "assets/images/default-team.png"
                },
                utcDate: new Date().toISOString(),
                status: "FINISHED",
                venue: "ملعب الملك فهد",
                score: {
                    fullTime: { home: 0, away: 0 }
                }
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
        const leagueLogo = match.competition.emblem || 'assets/images/default-league.png';
        const homeLogo = match.homeTeam.crest || 'assets/images/default-team.png';
        const awayLogo = match.awayTeam.crest || 'assets/images/default-team.png';
        const venueName = match.venue || 'ملعب غير معروف';

        const matchTime = new Date(match.utcDate).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        const statusClass = match.status.toLowerCase().replace('_', '-');
        let score = '-';
        if (match.score?.fullTime?.home !== undefined && match.score?.fullTime?.away !== undefined) {
            score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
        }

        return `
            <div class="match-card ${statusClass}">
                <div class="match-header">
                    <span class="league">
                        <img src="${leagueLogo}" 
                            alt="${match.competition.name}"
                            onerror="this.src='assets/images/default-league.png'">
                        ${match.competition.name}
                    </span>
                    <span class="status">${this.getStatusText(match.status)}</span>
                </div>
                <div class="teams">
                    <div class="team home-team">
                        <img src="${homeLogo}" 
                            alt="${match.homeTeam.shortName || match.homeTeam.name}"
                            onerror="this.src='assets/images/default-team.png'">
                        <span>${match.homeTeam.shortName || match.homeTeam.name}</span>
                    </div>
                    <div class="score">
                        ${score}
                    </div>
                    <div class="team away-team">
                        <img src="${awayLogo}" 
                            alt="${match.awayTeam.shortName || match.awayTeam.name}"
                            onerror="this.src='assets/images/default-team.png'">
                        <span>${match.awayTeam.shortName || match.awayTeam.name}</span>
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

    getStatusText: function(status) {
        const statusMap = {
            'SCHEDULED': 'مقررة',
            'LIVE': 'مباشر',
            'IN_PLAY': 'جارية',
            'PAUSED': 'معلقة',
            'FINISHED': 'انتهت',
            'POSTPONED': 'مؤجلة',
            'SUSPENDED': 'معلقة',
            'CANCELED': 'ملغاة'
        };
        return statusMap[status] || status;
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

// التصدير الرئيسي
export { MatchRenderer };
