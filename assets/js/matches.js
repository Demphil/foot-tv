// assets/js/matches.js
import { FootballAPI } from './api.js';

const MatchRenderer = {
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
      this.elements.dateFilter.addEventListener('change', this.handleDateFilter.bind(this));
    }
    
    if (this.elements.leagueFilter) {
      this.elements.leagueFilter.addEventListener('change', this.handleLeagueFilter.bind(this));
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
        FootballAPI.getMatchesByDate(this.formatDate(today)),
        FootballAPI.getMatchesByDate(this.formatDate(tomorrow))
      ]);
      
      this.renderMatchesByDate(todayMatches.response, 'today');
      this.renderMatchesByDate(tomorrowMatches.response, 'tomorrow');
      
    } catch (error) {
      console.error('Failed to load matches:', error);
      this.showError(error);
    } finally {
      this.hideLoading();
    }
  },

  renderMatchesByDate: function(matches, type) {
    const container = type === 'today' 
      ? this.elements.todayContainer 
      : this.elements.tomorrowContainer;
    
    if (!matches || matches.length === 0) {
      container.innerHTML = this.getNoMatchesHTML();
      return;
    }
    
    container.innerHTML = matches.map(match => this.getMatchHTML(match)).join('');
  },

  getMatchHTML: function(match) {
    return `
      <div class="match-card ${match.fixture.status.short.toLowerCase()}">
        <div class="match-header">
          <span class="league">
            <img src="${match.league.logo}" alt="${match.league.name}">
            ${match.league.name}
          </span>
          <span class="status">${match.fixture.status.long}</span>
        </div>
        <div class="teams">
          <div class="team home-team">
            <img src="${match.teams.home.logo}" alt="${match.teams.home.name}">
            <span>${match.teams.home.name}</span>
          </div>
          <div class="score">
            ${match.goals.home ?? '-'} - ${match.goals.away ?? '-'}
          </div>
          <div class="team away-team">
            <img src="${match.teams.away.logo}" alt="${match.teams.away.name}">
            <span>${match.teams.away.name}</span>
          </div>
        </div>
        <div class="match-footer">
          <span class="time">
            ${new Date(match.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span class="venue">
            <i class="fas fa-map-marker-alt"></i>
            ${match.fixture.venue?.name || 'Unknown venue'}
          </span>
        </div>
      </div>
    `;
  },

  getNoMatchesHTML: function() {
    return `
      <div class="no-matches">
        <i class="far fa-futbol"></i>
        <p>No matches scheduled</p>
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
          <p>${error.message || 'Failed to load matches'}</p>
          <button class="retry-btn">Retry</button>
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => MatchRenderer.init());

// For debugging
window.MatchRenderer = MatchRenderer;
window.FootballAPI = FootballAPI;
