(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  function isBlank(value) { return value === undefined || value === null || String(value).trim() === ''; }
  function validateRecord(record, state, previousRecord, role) {
    const errors = {};
    const hazards = state.hazards || [];
    const mitigationRequired = ['INTOLERABLE', 'UNDESIRABLE'].includes(record.initial_risk) || (state.config.requireMitigationForLowRisk && !isBlank(record.initial_risk));
    ['hazard_id', 'pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'srac_flag', 'closure_status'].forEach(function (field) {
      if (isBlank(record[field])) { errors[field] = 'To pole jest wymagane.'; }
    });
    if (hazards.some(function (hazard) { return hazard.hazard_id === record.hazard_id && (!previousRecord || previousRecord.hazard_id !== hazard.hazard_id); })) {
      errors.hazard_id = 'Hazard ID musi być unikalny.';
    }
    if (isBlank(record.initial_risk)) { errors.initial_risk = 'Wybierz initial_frequency i severity, aby wyliczyć risk.'; }
    if (mitigationRequired && isBlank(record.mitigation)) { errors.mitigation = 'Mitigation jest wymagane dla tego poziomu ryzyka.'; }
    if (!isBlank(record.residual_frequency) && isBlank(record.mitigation)) { errors.residual_frequency = 'Residual frequency wymaga mitigation.'; }
    if (!isBlank(record.residual_frequency) && isBlank(record.required_sil)) { errors.required_sil = 'Required SIL jest wymagane przy ocenie resztkowej.'; }
    if (record.closure_status === 'IMPLEMENTED' && isBlank(record.actionee)) { errors.actionee = 'Actionee jest wymagane przed IMPLEMENTED.'; }
    if (record.closure_status === 'VERIFIED' && isBlank(record.verification_evidence)) { errors.verification_evidence = 'Verification evidence jest wymagane przed VERIFIED.'; }
    if (record.required_sil === 'NA' && isBlank(record.comments)) { errors.comments = 'Dodaj uzasadnienie w comments, gdy required_sil = NA.'; }
    if (record.closure_status === 'CLOSED') {
      if (role !== 'SAFETY_MANAGER') { errors.closure_status = 'Tylko Safety Manager może ustawić CLOSED.'; }
      else if (state.config.workshopMode) { errors.closure_status = 'W trybie warsztatowym CLOSED jest niedostępny.'; }
      else if (!previousRecord || previousRecord.closure_status !== 'VERIFIED') { errors.closure_status = 'CLOSED jest dozwolone tylko po VERIFIED.'; }
      else if (!['TOLERABLE', 'NEGLIGIBLE'].includes(record.residual_risk)) { errors.closure_status = 'CLOSED wymaga residual risk TOLERABLE lub NEGLIGIBLE.'; }
    }
    return errors;
  }
  function validateStep(record, step, state, previousRecord, role) {
    const all = validateRecord(record, state, previousRecord, role);
    const byStep = { 1: ['pillar', 'root_cause', 'propagation', 'external_effect'], 2: ['initial_frequency', 'severity', 'initial_risk'], 3: ['mitigation', 'required_sil', 'comments', 'srac_flag'], 4: ['residual_frequency', 'residual_risk'], 5: ['actionee', 'closure_status', 'verification_evidence'] };
    const set = new Set(byStep[step] || []);
    return Object.fromEntries(Object.entries(all).filter(function (entry) { return set.has(entry[0]); }));
  }
  app.validation = { isBlank: isBlank, validateRecord: validateRecord, validateStep: validateStep };
})();
