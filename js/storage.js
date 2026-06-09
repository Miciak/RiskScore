(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  const { STORAGE_KEY, DEFAULT_MATRIX, DEFAULT_TEAM_MEMBERS } = app.constants;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function defaultState() {
    return {
      hazards: [],
      auditLog: [],
      ui: { currentRole: 'SAFETY_MANAGER', currentUserName: 'Safety Manager', selectedHazardId: '', currentStep: 1, importSummary: 'Brak ostatniego importu.' },
      config: { workshopMode: false, requireMitigationForLowRisk: false, teamMembers: clone(DEFAULT_TEAM_MEMBERS), riskMatrix: clone(DEFAULT_MATRIX) }
    };
  }
  function sanitizeState(state) {
    const base = defaultState();
    return {
      hazards: Array.isArray(state && state.hazards) ? state.hazards : base.hazards,
      auditLog: Array.isArray(state && state.auditLog) ? state.auditLog : base.auditLog,
      ui: Object.assign(base.ui, state && state.ui),
      config: {
        workshopMode: Boolean(state && state.config && state.config.workshopMode),
        requireMitigationForLowRisk: Boolean(state && state.config && state.config.requireMitigationForLowRisk),
        teamMembers: Array.isArray(state && state.config && state.config.teamMembers) && state.config.teamMembers.length ? state.config.teamMembers : base.config.teamMembers,
        riskMatrix: Object.assign(clone(DEFAULT_MATRIX), state && state.config && state.config.riskMatrix)
      }
    };
  }
  app.storage = {
    load() { try { const raw = window.localStorage.getItem(STORAGE_KEY); return raw ? sanitizeState(JSON.parse(raw)) : defaultState(); } catch (_) { return defaultState(); } },
    save(state) { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state))); },
    sanitizeState: sanitizeState
  };
})();
