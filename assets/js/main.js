import FootballAPI from "./.api.js";;

// وظائف عامة للموقع
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // تحميل المباريات المميزة إذا كانت الصفحة تحتوي على العنصر
        if (document.getElementById('featured-matches-container')) {
            await loadFeaturedMatches();
        }

        // إعداد قائمة الهاتف المتنقلة
        setupMobileMenu();

        // يمكنك إضافة المزيد من التهيئات هنا
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    if (nav) {
        nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        
        // إضافة/إزالة أيقونة القائمة حسب الحالة
        const icon = document.querySelector('.mobile-menu-btn i');
        if (icon) {
            icon.className = nav.style.display === 'block' 
                ? 'fas fa-times' 
                : 'fas fa-bars';
        }
    }
}

// دالة جلب المباريات المميزة
async function loadFeaturedMatches() {
    const container = document.getElementById('featured-matches-container');
    if (!container) return;

    try {
        // عرض حالة التحميل
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>جاري تحميل المباريات...</span>
            </div>
        `;

        // جلب البيانات من API
        const data = await FootballAPI.getLiveMatches();
        
        if (!data || !data.response || data.response.length === 0) {
            showNoMatchesMessage(container);
            return;
        }

        // عرض المباريات
        displayMatches(container, data.response.slice(0, 4));
    } catch (error) {
        console.error('Failed to load featured matches:', error);
        showErrorMessage(container);
    }
}

function displayMatches(container, matches) {
    container.innerHTML = matches.map(match => `
        <div class="match-card live">
            <div class="match-header">
                <span class="league">
                    <img src="${match.league.logo || 'assets/images/default-league.png'}" 
                         alt="${match.league.name}" class="league-logo">
                    ${match.league.name}
                </span>
                <span class="status ${match.fixture.status.short.toLowerCase()}">
                    ${match.fixture.status.long}
                </span>
            </div>
            <div class="teams">
                <div class="team home-team">
                    <img src="${match.teams.home.logo || 'assets/images/default-team.png'}" 
                         alt="${match.teams.home.name}" 
                         onerror="this.src='assets/images/default-team.png'">
                    <span>${match.teams.home.name}</span>
                </div>
                <div class="score">
                    ${match.goals.home} - ${match.goals.away}
                    <div class="match-time">
                        ${new Date(match.fixture.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                <div class="team away-team">
                    <img src="${match.teams.away.logo || 'assets/images/default-team.png'}" 
                         alt="${match.teams.away.name}"
                         onerror="this.src='assets/images/default-team.png'">
                    <span>${match.teams.away.name}</span>
                </div>
            </div>
            <div class="match-venue">
                <i class="fas fa-map-marker-alt"></i>
                ${match.fixture.venue.name || 'ملعب غير معروف'}
            </div>
        </div>
    `).join('');
}

function showNoMatchesMessage(container) {
    container.innerHTML = `
        <div class="no-matches">
            <i class="far fa-futbol"></i>
            <p>لا توجد مباريات مباشرة حالياً</p>
            <button onclick="window.location.reload()">
                <i class="fas fa-sync-alt"></i> تحديث الصفحة
            </button>
        </div>
    `;
}

function showErrorMessage(container) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>حدث خطأ في جلب البيانات</p>
            <div class="actions">
                <button onclick="loadFeaturedMatches()">
                    <i class="fas fa-redo"></i> إعادة المحاولة
                </button>
                <button onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> تحديث الصفحة
                </button>
            </div>
        </div>
    `;
}

// جعل الدوال متاحة عالمياً للاستدعاء من HTML إذا لزم الأمر
window.loadFeaturedMatches = loadFeaturedMatches;
window.toggleMobileMenu = toggleMobileMenu;
