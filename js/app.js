(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  const ui = app.ui;
  const validation = app.validation;
  let state = app.storage.load();
  let draftRecord = null;
  function userContext() { return { role: state.ui.currentRole, userName: state.ui.currentUserName || ui.codeLabels()[state.ui.currentRole] }; }
  function saveState() { app.storage.save(state); }
  function syncSessionControls() {
    const elements = ui.el();
    state.ui.currentRole = elements.roleSelect.value;
    state.ui.currentUserName = elements.userNameInput.value.trim() || ui.codeLabels()[state.ui.currentRole];
  }
  function generateHazardId(existingIds) {
    const ids = existingIds || new Set(state.hazards.map(function (hazard) { return hazard.hazard_id; }));
    let i = 1, candidate = '';
    do { candidate = 'HL-SSP-' + String(i).padStart(3, '0'); i += 1; } while (ids.has(candidate));
    return candidate;
  }
  app.generateHazardId = generateHazardId;
  function syncDraftFromForm() {
    draftRecord = readRecordFromForm();
  }
  function selectedRecordOrNew() {
    if (draftRecord && (!state.ui.selectedHazardId || draftRecord.hazard_id === state.ui.selectedHazardId)) {
      return draftRecord;
    }
    const selected = state.hazards.find(function (hazard) { return hazard.hazard_id === state.ui.selectedHazardId; });
    draftRecord = selected ? Object.assign({}, selected) : ui.createEmptyRecord(state);
    return draftRecord;
  }
  function render() {
    ui.renderRoleAndSelectors(state);
    ui.fillForm(selectedRecordOrNew());
    ui.renderDashboard(state);
    ui.renderHazardTable(state);
    ui.renderAudit(state);
    ui.renderStepper(state);
    ui.renderConfig(state);
    ui.applyRolePermissions(state);
    ui.updateComputedRiskFields(state);
  }
  function setSelected(hazardId) {
    state.ui.selectedHazardId = hazardId || '';
    state.ui.currentStep = 1;
    draftRecord = hazardId ? Object.assign({}, state.hazards.find(function (hazard) { return hazard.hazard_id === hazardId; }) || {}) : ui.createEmptyRecord(state);
    saveState();
    render();
  }
  function readRecordFromForm() {
    const record = ui.readForm();
    record.initial_risk = app.riskMatrix.calculateRisk(state.config.riskMatrix, record.initial_frequency, record.severity);
    record.residual_risk = app.riskMatrix.calculateRisk(state.config.riskMatrix, record.residual_frequency, record.severity);
    record.updated_by = userContext().userName; record.updated_at = new Date().toISOString();
    if (!record.created_by) { record.created_by = userContext().userName; }
    if (!record.created_at) { record.created_at = new Date().toISOString(); }
    return record;
  }
  function saveHazard(event) {
    event.preventDefault(); syncSessionControls();
    const record = readRecordFromForm();
    const previous = state.hazards.find(function (hazard) { return hazard.hazard_id === record.hazard_id; }) || null;
    const errors = validation.validateRecord(record, state, previous, state.ui.currentRole);
    ui.renderErrors(errors);
    if (Object.keys(errors).length) { return; }
    const auditEntries = app.audit.diffRecord(previous, record, userContext());
    if (previous) { state.hazards = state.hazards.map(function (hazard) { return hazard.hazard_id === record.hazard_id ? record : hazard; }); }
    else { state.hazards.push(record); }
    state.auditLog = state.auditLog.concat(auditEntries);
    state.ui.selectedHazardId = record.hazard_id;
    state.ui.importSummary = 'Zapisano rekord ' + record.hazard_id + '.';
    draftRecord = Object.assign({}, record);
    saveState(); render();
  }
  function saveConfig() {
    syncSessionControls();
    if (state.ui.currentRole !== 'SAFETY_MANAGER') { window.alert('Tylko Safety Manager może zmieniać konfigurację.'); return; }
    const elements = ui.el();
    state.config.workshopMode = elements.workshopMode.checked;
    state.config.requireMitigationForLowRisk = elements.requireMitigationForLowRisk.checked;
    state.config.teamMembers = app.importExport.parseTeamMembers(elements.teamMembers.value);
    document.querySelectorAll('[data-matrix-frequency]').forEach(function (input) { state.config.riskMatrix[input.dataset.matrixFrequency][input.dataset.matrixSeverity] = input.value; });
    state.hazards = state.hazards.map(function (hazard) {
      const next = Object.assign({}, hazard);
      next.initial_risk = app.riskMatrix.calculateRisk(state.config.riskMatrix, next.initial_frequency, next.severity);
      next.residual_risk = app.riskMatrix.calculateRisk(state.config.riskMatrix, next.residual_frequency, next.severity);
      next.updated_by = userContext().userName; next.updated_at = new Date().toISOString();
      return next;
    });
    state.ui.importSummary = 'Zapisano konfigurację projektu i przeliczono ryzyka.';
    saveState(); render();
  }
  function changeStep(direction) {
    syncSessionControls();
    if (direction > 0) {
      const record = readRecordFromForm();
      const previous = state.hazards.find(function (hazard) { return hazard.hazard_id === record.hazard_id; }) || null;
      const errors = validation.validateStep(record, state.ui.currentStep, state, previous, state.ui.currentRole);
      ui.renderErrors(errors);
      if (Object.keys(errors).length) { return; }
      draftRecord = Object.assign({}, record);
    }
    state.ui.currentStep = Math.max(1, Math.min(app.constants.WORKFLOW_STEPS.length, state.ui.currentStep + direction));
    saveState(); render();
  }
  function deleteHazard(hazardId) {
    if (!window.confirm('Usunąć rekord ' + hazardId + '?')) { return; }
    state.hazards = state.hazards.filter(function (hazard) { return hazard.hazard_id !== hazardId; });
    state.auditLog.push(app.audit.makeEntry(hazardId, '__deleted__', 'Record exists', 'Record deleted', userContext()));
    if (state.ui.selectedHazardId === hazardId) { state.ui.selectedHazardId = ''; }
    draftRecord = ui.createEmptyRecord(state);
    saveState(); render();
  }
  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      try { state = app.importExport.importJson(event.target.result); state.ui.importSummary = 'Zaimportowano pełne dane z pliku JSON.'; saveState(); render(); }
      catch (error) { window.alert('Nie udało się zaimportować JSON: ' + error.message); }
    };
    reader.readAsText(file);
  }
  function importWorkbook(file) {
    app.importExport.importWorkbook(file, { state: state, userContext: userContext(), generateHazardId: generateHazardId }).then(function (result) {
      result.hazards.forEach(function (hazard) { state.auditLog.push(app.audit.makeEntry(hazard.hazard_id, '__imported__', '', 'Imported from XLS/XLSX', userContext())); });
      state.hazards = state.hazards.concat(result.hazards);
      state.ui.importSummary = result.summary;
      draftRecord = selectedRecordOrNew();
      saveState(); render();
      if (result.errors.length) { window.alert(result.errors.join('\n')); }
    }).catch(function (error) { window.alert('Nie udało się zaimportować XLS/XLSX: ' + error.message); });
  }
  function bindEvents() {
    const elements = ui.el();
    elements.roleSelect.addEventListener('change', function () { syncSessionControls(); saveState(); render(); });
    elements.userNameInput.addEventListener('change', function () { syncSessionControls(); saveState(); render(); });
    elements.hazardForm.addEventListener('submit', saveHazard);
    elements.resetFormButton.addEventListener('click', function () { setSelected(''); ui.renderErrors({}); });
    elements.newHazardButton.addEventListener('click', function () { setSelected(''); ui.renderErrors({}); });
    elements.prevStepButton.addEventListener('click', function () { changeStep(-1); });
    elements.nextStepButton.addEventListener('click', function () { changeStep(1); });
    elements.exportJsonButton.addEventListener('click', function () { app.importExport.exportJson(state); });
    elements.importJsonButton.addEventListener('click', function () { elements.jsonFileInput.click(); });
    elements.exportCsvButton.addEventListener('click', function () { app.importExport.exportCsv(state.hazards); });
    elements.importXlsxButton.addEventListener('click', function () { elements.xlsxFileInput.click(); });
    elements.jsonFileInput.addEventListener('change', function () { if (this.files[0]) { importJsonFile(this.files[0]); this.value = ''; } });
    elements.xlsxFileInput.addEventListener('change', function () { if (this.files[0]) { importWorkbook(this.files[0]); this.value = ''; } });
    elements.saveConfigButton.addEventListener('click', saveConfig);
    ['filterPillar', 'filterStatus', 'filterActionee', 'filterSrac', 'filterInitialRisk', 'filterResidualRisk', 'filterText'].forEach(function (fieldId) { document.getElementById(fieldId).addEventListener('input', render); document.getElementById(fieldId).addEventListener('change', render); });
    ['initial_frequency', 'severity', 'residual_frequency'].forEach(function (fieldId) { document.getElementById(fieldId).addEventListener('change', function () { ui.updateComputedRiskFields(state); syncDraftFromForm(); }); });
    document.querySelectorAll('#hazardForm input, #hazardForm select, #hazardForm textarea').forEach(function (field) {
      if (field.id !== 'initial_risk' && field.id !== 'residual_risk') {
        field.addEventListener('input', syncDraftFromForm);
        field.addEventListener('change', syncDraftFromForm);
      }
    });
    document.getElementById('hazardTableBody').addEventListener('click', function (event) {
      const button = event.target.closest('button'); if (!button) { return; }
      const hazardId = button.dataset.id;
      if (button.dataset.action === 'select' || button.dataset.action === 'edit') { state.ui.selectedHazardId = hazardId; saveState(); render(); }
      if (button.dataset.action === 'delete') { deleteHazard(hazardId); }
    });
  }
  document.addEventListener('DOMContentLoaded', function () { bindEvents(); render(); });
})();
