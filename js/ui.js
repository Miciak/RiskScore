(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  const constants = app.constants;
  const editableByRole = {
    WORKSHOP_PARTICIPANT: ['pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'mitigation', 'srac_flag', 'actionee', 'comments'],
    SAFETY_ENGINEER: ['pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'mitigation', 'required_sil', 'residual_frequency', 'srac_flag', 'actionee', 'closure_status', 'verification_evidence', 'comments'],
    ACTIONEE: ['mitigation', 'actionee', 'closure_status', 'verification_evidence', 'comments'],
    SAFETY_MANAGER: ['pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'mitigation', 'required_sil', 'residual_frequency', 'srac_flag', 'actionee', 'closure_status', 'verification_evidence', 'comments']
  };
  function el() {
    return {
      roleSelect: document.getElementById('roleSelect'), userNameInput: document.getElementById('userNameInput'), activeRoleBadge: document.getElementById('activeRoleBadge'),
      dashboardMetrics: document.getElementById('dashboardMetrics'), actioneeMetrics: document.getElementById('actioneeMetrics'), workshopModeIndicator: document.getElementById('workshopModeIndicator'), importSummary: document.getElementById('importSummary'),
      filterPillar: document.getElementById('filterPillar'), filterStatus: document.getElementById('filterStatus'), filterActionee: document.getElementById('filterActionee'), filterSrac: document.getElementById('filterSrac'), filterInitialRisk: document.getElementById('filterInitialRisk'), filterResidualRisk: document.getElementById('filterResidualRisk'), filterText: document.getElementById('filterText'),
      recordCount: document.getElementById('recordCount'), hazardTableBody: document.getElementById('hazardTableBody'), workflowStepper: document.getElementById('workflowStepper'), prevStepButton: document.getElementById('prevStepButton'), nextStepButton: document.getElementById('nextStepButton'), hazardForm: document.getElementById('hazardForm'), resetFormButton: document.getElementById('resetFormButton'), newHazardButton: document.getElementById('newHazardButton'), exportJsonButton: document.getElementById('exportJsonButton'), importJsonButton: document.getElementById('importJsonButton'), exportCsvButton: document.getElementById('exportCsvButton'), importXlsxButton: document.getElementById('importXlsxButton'), jsonFileInput: document.getElementById('jsonFileInput'), xlsxFileInput: document.getElementById('xlsxFileInput'), workshopMode: document.getElementById('workshopMode'), requireMitigationForLowRisk: document.getElementById('requireMitigationForLowRisk'), teamMembers: document.getElementById('teamMembers'), riskMatrixTable: document.getElementById('riskMatrixTable'), saveConfigButton: document.getElementById('saveConfigButton'), configPermissionHint: document.getElementById('configPermissionHint'), auditTitle: document.getElementById('auditTitle'), auditTableBody: document.getElementById('auditTableBody')
    };
  }
  function codeLabels() {
    const labels = {};
    constants.ROLES.concat(constants.PILLARS).forEach(function (item) { labels[item.code] = item.label; });
    constants.FREQUENCIES.concat(constants.SEVERITIES).concat(constants.RISKS).concat(constants.SRAC_FLAGS).concat(constants.CLOSURE_STATUSES).forEach(function (item) { labels[item] = item; });
    constants.SILS.forEach(function (item) { labels[item] = item === 'NA' ? 'N/A' : item; });
    return labels;
  }
  function buildOptions(select, items, allowEmpty, labels) {
    const previous = select.value;
    const fragment = document.createDocumentFragment();
    if (allowEmpty) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = '-- wszystkie / wybierz --';
      fragment.appendChild(emptyOption);
    }
    items.forEach(function (item) {
      const value = item.code || item;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = labels[value] || item.label || item;
      fragment.appendChild(option);
    });
    select.replaceChildren(fragment);
    if ([].slice.call(select.options).some(function (option) { return option.value === previous; })) { select.value = previous; }
  }
  function createEmptyRecord(state) {
    const now = new Date().toISOString();
    return { hazard_id: app.generateHazardId(new Set(state.hazards.map(function (hazard) { return hazard.hazard_id; }))), pillar: '', root_cause: '', propagation: '', external_effect: '', initial_frequency: '', severity: '', initial_risk: '', mitigation: '', required_sil: '', residual_frequency: '', residual_risk: '', srac_flag: 'NO', actionee: '', closure_status: 'OPEN', verification_evidence: '', comments: '', created_by: state.ui.currentUserName, created_at: now, updated_by: state.ui.currentUserName, updated_at: now };
  }
  function readForm() {
    const data = {};
    constants.CSV_FIELDS.forEach(function (field) { const input = document.getElementById(field); if (input) { data[field] = input.value.trim(); } });
    return data;
  }
  function fillForm(record) {
    constants.CSV_FIELDS.forEach(function (field) { const input = document.getElementById(field); if (input) { input.value = record[field] || ''; } });
    paintRiskFields();
  }
  function paintRiskFields() {
    ['initial_risk', 'residual_risk'].forEach(function (fieldId) { const input = document.getElementById(fieldId); input.className = input.className.replace(/risk-[^ ]+/g, '').trim(); const cssClass = app.riskMatrix.riskClass(input.value); if (cssClass) { input.classList.add(cssClass); } });
  }
  function updateComputedRiskFields(state) {
    document.getElementById('initial_risk').value = app.riskMatrix.calculateRisk(state.config.riskMatrix, document.getElementById('initial_frequency').value, document.getElementById('severity').value);
    document.getElementById('residual_risk').value = app.riskMatrix.calculateRisk(state.config.riskMatrix, document.getElementById('residual_frequency').value, document.getElementById('severity').value);
    paintRiskFields();
  }
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function formatDate(value) { return value ? new Date(value).toLocaleString('pl-PL') : ''; }
  function getFilters() { const elements = el(); return { pillar: elements.filterPillar.value, closure_status: elements.filterStatus.value, actionee: elements.filterActionee.value, srac_flag: elements.filterSrac.value, initial_risk: elements.filterInitialRisk.value, residual_risk: elements.filterResidualRisk.value, text: elements.filterText.value.trim().toLowerCase() }; }
  function applyFilters(hazards, filters) {
    return hazards.filter(function (hazard) {
      const haystack = [hazard.hazard_id, hazard.root_cause, hazard.propagation, hazard.external_effect, hazard.comments].join(' ').toLowerCase();
      return (!filters.pillar || hazard.pillar === filters.pillar) && (!filters.closure_status || hazard.closure_status === filters.closure_status) && (!filters.actionee || hazard.actionee === filters.actionee) && (!filters.srac_flag || hazard.srac_flag === filters.srac_flag) && (!filters.initial_risk || hazard.initial_risk === filters.initial_risk) && (!filters.residual_risk || hazard.residual_risk === filters.residual_risk) && (!filters.text || haystack.includes(filters.text));
    });
  }
  function badge(risk) { return risk ? '<span class="badge ' + app.riskMatrix.riskClass(risk) + '">' + risk + '</span>' : ''; }
  function badgeElement(risk) {
    if (!risk) { return document.createTextNode(''); }
    const span = document.createElement('span');
    span.className = 'badge ' + app.riskMatrix.riskClass(risk);
    span.textContent = risk;
    return span;
  }
  function renderDashboard(state) {
    const hazards = state.hazards;
    const metrics = [
      ['Wszystkie hazardy', hazards.length], ['INTOLERABLE', hazards.filter(function (hazard) { return hazard.initial_risk === 'INTOLERABLE' || hazard.residual_risk === 'INTOLERABLE'; }).length], ['UNDESIRABLE', hazards.filter(function (hazard) { return hazard.initial_risk === 'UNDESIRABLE' || hazard.residual_risk === 'UNDESIRABLE'; }).length], ['SRAC = YES', hazards.filter(function (hazard) { return hazard.srac_flag === 'YES'; }).length]
    ].concat(constants.CLOSURE_STATUSES.map(function (status) { return ['Status ' + status, hazards.filter(function (hazard) { return hazard.closure_status === status; }).length]; }));
    el().dashboardMetrics.innerHTML = metrics.map(function (metric) { return '<article class="metric-card"><span>' + metric[0] + '</span><strong>' + metric[1] + '</strong></article>'; }).join('');
    const openByActionee = {};
    hazards.forEach(function (hazard) { if (hazard.actionee && hazard.closure_status !== 'CLOSED') { openByActionee[hazard.actionee] = (openByActionee[hazard.actionee] || 0) + 1; } });
    const names = Object.keys(openByActionee).sort();
    el().actioneeMetrics.innerHTML = names.length ? names.map(function (name) { return '<li>' + escapeHtml(name) + ': <strong>' + openByActionee[name] + '</strong></li>'; }).join('') : '<li>Brak otwartych działań.</li>';
    el().workshopModeIndicator.textContent = state.config.workshopMode ? 'Tryb warsztatowy jest aktywny. CLOSED jest ukryty / zablokowany.' : 'Tryb warsztatowy jest wyłączony.';
    el().importSummary.textContent = state.ui.importSummary || 'Brak ostatniego importu.';
  }
  function renderHazardTable(state) {
    const filtered = applyFilters(state.hazards, getFilters());
    el().recordCount.textContent = 'Widoczne rekordy: ' + filtered.length;
    const tbody = el().hazardTableBody;
    tbody.replaceChildren();
    if (!filtered.length) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 9;
      emptyCell.textContent = 'Brak rekordów spełniających filtry.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    filtered.forEach(function (hazard) {
      const row = document.createElement('tr');
      if (state.ui.selectedHazardId === hazard.hazard_id) { row.classList.add('selected-row'); }

      const selectCell = document.createElement('td');
      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.className = 'text-button';
      selectButton.dataset.action = 'select';
      selectButton.dataset.id = hazard.hazard_id;
      selectButton.textContent = hazard.hazard_id;
      selectCell.appendChild(selectButton);
      row.appendChild(selectCell);

      ['pillar', 'root_cause', 'actionee', 'closure_status', 'srac_flag'].forEach(function (field) {
        const cell = document.createElement('td');
        cell.textContent = hazard[field] || '';
        if (field === 'root_cause') {
          row.appendChild(cell);
          return;
        }
        if (field === 'pillar') {
          row.appendChild(cell);
          return;
        }
        row.appendChild(cell);
      });

      const initialRiskCell = document.createElement('td');
      initialRiskCell.appendChild(badgeElement(hazard.initial_risk));
      row.insertBefore(initialRiskCell, row.children[3]);

      const residualRiskCell = document.createElement('td');
      residualRiskCell.appendChild(badgeElement(hazard.residual_risk));
      row.insertBefore(residualRiskCell, row.children[4]);

      const actionsCell = document.createElement('td');
      ['edit', 'delete'].forEach(function (action, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.id = hazard.hazard_id;
        button.textContent = action === 'edit' ? 'Edytuj' : 'Usuń';
        actionsCell.appendChild(button);
        if (index === 0) { actionsCell.appendChild(document.createTextNode(' ')); }
      });
      row.appendChild(actionsCell);

      tbody.appendChild(row);
    });
  }
  function renderAudit(state) {
    if (!state.ui.selectedHazardId) { el().auditTitle.textContent = 'Wybierz rekord z listy'; el().auditTableBody.innerHTML = '<tr><td colspan="6">Brak wybranego rekordu.</td></tr>'; return; }
    const rows = state.auditLog.filter(function (entry) { return entry.hazard_id === state.ui.selectedHazardId; }).sort(function (a, b) { return b.timestamp.localeCompare(a.timestamp); });
    el().auditTitle.textContent = 'Audit log dla ' + state.ui.selectedHazardId;
    el().auditTableBody.innerHTML = rows.length ? rows.map(function (entry) { return '<tr><td>' + formatDate(entry.timestamp) + '</td><td>' + escapeHtml(entry.field) + '</td><td>' + escapeHtml(entry.old_value) + '</td><td>' + escapeHtml(entry.new_value) + '</td><td>' + escapeHtml(entry.user_name) + '</td><td>' + escapeHtml(entry.user_role) + '</td></tr>'; }).join('') : '<tr><td colspan="6">Brak wpisów audytowych.</td></tr>';
  }
  function renderStepper(state) {
    el().workflowStepper.innerHTML = constants.WORKFLOW_STEPS.map(function (label, index) { return '<span class="step-chip ' + (state.ui.currentStep === index + 1 ? 'active' : '') + '">' + label + '</span>'; }).join('');
    document.querySelectorAll('.form-step').forEach(function (section) { section.classList.toggle('active', Number(section.dataset.step) === state.ui.currentStep); });
    el().prevStepButton.disabled = state.ui.currentStep === 1;
    el().nextStepButton.disabled = state.ui.currentStep === constants.WORKFLOW_STEPS.length;
  }
  function renderConfig(state) {
    const elements = el();
    const canEdit = state.ui.currentRole === 'SAFETY_MANAGER';
    elements.workshopMode.checked = state.config.workshopMode; elements.requireMitigationForLowRisk.checked = state.config.requireMitigationForLowRisk; elements.teamMembers.value = state.config.teamMembers.join(', ');
    [elements.workshopMode, elements.requireMitigationForLowRisk, elements.teamMembers, elements.saveConfigButton].forEach(function (node) { node.disabled = !canEdit; });
    elements.configPermissionHint.textContent = canEdit ? 'Edycja dostępna dla Safety Manager.' : 'Tylko Safety Manager może zmieniać konfigurację.';
    const header = '<tr><th>Freq \\ Severity</th>' + constants.SEVERITIES.map(function (severity) { return '<th>' + severity + '</th>'; }).join('') + '</tr>';
    const rows = constants.FREQUENCIES.map(function (frequency) {
      return '<tr><th>' + frequency + '</th>' + constants.SEVERITIES.map(function (severity) {
        const current = state.config.riskMatrix[frequency][severity];
        return '<td><select data-matrix-frequency="' + frequency + '" data-matrix-severity="' + severity + '" ' + (canEdit ? '' : 'disabled') + '>' + constants.RISKS.map(function (risk) { return '<option value="' + risk + '" ' + (risk === current ? 'selected' : '') + '>' + risk + '</option>'; }).join('') + '</select></td>';
      }).join('') + '</tr>';
    }).join('');
    elements.riskMatrixTable.innerHTML = header + rows;
  }
  function renderRoleAndSelectors(state) {
    const labels = codeLabels();
    buildOptions(el().roleSelect, constants.ROLES, false, labels);
    el().roleSelect.value = state.ui.currentRole; el().userNameInput.value = state.ui.currentUserName; el().activeRoleBadge.textContent = labels[state.ui.currentRole];
    buildOptions(document.getElementById('pillar'), constants.PILLARS, true, labels);
    buildOptions(document.getElementById('initial_frequency'), constants.FREQUENCIES, true, labels);
    buildOptions(document.getElementById('severity'), constants.SEVERITIES, true, labels);
    buildOptions(document.getElementById('required_sil'), constants.SILS, true, labels);
    buildOptions(document.getElementById('residual_frequency'), constants.FREQUENCIES, true, labels);
    buildOptions(document.getElementById('srac_flag'), constants.SRAC_FLAGS, false, labels);
    const actionees = Array.from(new Set(state.config.teamMembers.concat(state.hazards.map(function (hazard) { return hazard.actionee; }).filter(Boolean)))).sort();
    buildOptions(document.getElementById('actionee'), actionees, true, labels);
    buildOptions(el().filterActionee, actionees, true, labels);
    const statuses = state.config.workshopMode ? constants.CLOSURE_STATUSES.filter(function (status) { return status !== 'CLOSED'; }) : constants.CLOSURE_STATUSES.slice();
    buildOptions(document.getElementById('closure_status'), statuses, false, labels);
    buildOptions(el().filterPillar, constants.PILLARS, true, labels);
    buildOptions(el().filterStatus, constants.CLOSURE_STATUSES, true, labels);
    buildOptions(el().filterSrac, constants.SRAC_FLAGS, true, labels);
    buildOptions(el().filterInitialRisk, constants.RISKS, true, labels);
    buildOptions(el().filterResidualRisk, constants.RISKS, true, labels);
  }
  function applyRolePermissions(state) {
    const editableFields = editableByRole[state.ui.currentRole] || [];
    ['pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'mitigation', 'required_sil', 'residual_frequency', 'srac_flag', 'actionee', 'closure_status', 'verification_evidence', 'comments'].forEach(function (fieldId) {
      document.getElementById(fieldId).disabled = editableFields.indexOf(fieldId) < 0;
    });
    ['hazard_id', 'created_by', 'created_at', 'updated_by', 'updated_at', 'initial_risk', 'residual_risk'].forEach(function (fieldId) { document.getElementById(fieldId).disabled = true; });
  }
  function renderErrors(errors) {
    document.querySelectorAll('[data-error-for]').forEach(function (node) { node.textContent = ''; });
    document.querySelectorAll('#hazardForm input, #hazardForm select, #hazardForm textarea').forEach(function (node) { node.classList.remove('field-invalid'); });
    Object.keys(errors || {}).forEach(function (field) {
      const error = document.querySelector('[data-error-for="' + field + '"]');
      const input = document.getElementById(field);
      if (error) { error.textContent = errors[field]; }
      if (input) { input.classList.add('field-invalid'); }
    });
  }
  app.ui = { el: el, codeLabels: codeLabels, buildOptions: buildOptions, createEmptyRecord: createEmptyRecord, readForm: readForm, fillForm: fillForm, paintRiskFields: paintRiskFields, updateComputedRiskFields: updateComputedRiskFields, getFilters: getFilters, applyFilters: applyFilters, renderDashboard: renderDashboard, renderHazardTable: renderHazardTable, renderAudit: renderAudit, renderStepper: renderStepper, renderConfig: renderConfig, renderRoleAndSelectors: renderRoleAndSelectors, applyRolePermissions: applyRolePermissions, renderErrors: renderErrors, escapeHtml: escapeHtml, badge: badge };
})();
