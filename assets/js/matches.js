// التعديلات في بداية الكائن
const MatchRenderer = {
    // تغيير معرّفات الدوريات لاستخدام رموز football-data.org
    IMPORTANT_LEAGUES: new Set([
        'PL',    // الدوري الإنجليزي
        'PD',    // الدوري الإسباني
        'SA',    // الدوري الإيطالي
        'BL1',   // الدوري الألماني
        'FL1',   // الدوري الفرنسي
        'SAU',   // الدوري السعودي
        'CL',    // دوري أبطال أوروبا
        'MAR1'   // الدوري المغربي (يجب التأكد من الرمز)
    ]),

    // تعديل دالة getFilteredMatches
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

    // تعديل دالة getMatchHTML لتعكس هيكل API الجديد
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

        const statusClass = match.status.toLowerCase();
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

    // دالة مساعدة لتحويل حالة المباراة
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

    // تعديل البيانات الاحتياطية
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
    }
};
