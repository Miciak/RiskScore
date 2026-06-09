(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  app.riskMatrix = {
    calculateRisk(matrix, frequency, severity) { return frequency && severity && matrix[frequency] ? (matrix[frequency][severity] || '') : ''; },
    riskClass(risk) {
      switch (risk) {
        case 'INTOLERABLE': return 'risk-intolerable';
        case 'UNDESIRABLE': return 'risk-undesirable';
        case 'TOLERABLE': return 'risk-tolerable';
        case 'NEGLIGIBLE': return 'risk-negligible';
        default: return '';
      }
    }
  };
})();
