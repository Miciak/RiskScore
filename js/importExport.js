(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  const { CSV_FIELDS, FIELD_LABELS, PILLARS, FREQUENCIES, SEVERITIES, SILS, SRAC_FLAGS, CLOSURE_STATUSES } = app.constants;
  function download(filename, content, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  }
  function exportJson(state) { download('riskscore-data.json', JSON.stringify(state, null, 2), 'application/json'); }
  function csvEscape(value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; }
  function exportCsv(hazards) {
    const header = CSV_FIELDS.map(function (field) { return csvEscape(FIELD_LABELS[field] || field); }).join(',');
    const rows = hazards.map(function (hazard) { return CSV_FIELDS.map(function (field) { return csvEscape(hazard[field]); }).join(','); });
    download('hazards.csv', [header].concat(rows).join('\n'), 'text/csv;charset=utf-8');
  }
  function normalizeHeader(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  function normalizeCode(value, allowed, aliases) {
    const raw = String(value || '').trim();
    const mapped = (aliases[raw.toUpperCase()] || aliases[raw] || raw.toUpperCase().replace(/[\s\/]+/g, '_'));
    return allowed.includes(mapped) ? mapped : '';
  }
  function parseTeamMembers(value) { return String(value || '').split(/[\n,;]+/).map(function (item) { return item.trim(); }).filter(Boolean); }
  function importJson(text) { return app.storage.sanitizeState(JSON.parse(text)); }
  function importWorkbook(file, context) {
    return new Promise(function (resolve, reject) {
      if (typeof XLSX === 'undefined') { reject(new Error('Biblioteka XLSX nie została załadowana.')); return; }
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
          const existingIds = new Set((context.state.hazards || []).map(function (hazard) { return hazard.hazard_id; }));
          const importedHazards = [];
          const errors = [];
          rows.forEach(function (rawRow, index) {
            const row = {};
            Object.keys(rawRow).forEach(function (key) { row[normalizeHeader(key)] = rawRow[key]; });
            const now = new Date().toISOString();
            const hazard = {
              hazard_id: String(row.hazard_id || '').trim() || context.generateHazardId(existingIds),
              pillar: normalizeCode(row.pillar, PILLARS.map(function (item) { return item.code; }), { 'HW/SW': 'HW_SW' }),
              root_cause: String(row.root_cause || '').trim(),
              propagation: String(row.propagation || '').trim(),
              external_effect: String(row.external_effect || '').trim(),
              initial_frequency: normalizeCode(row.initial_frequency, FREQUENCIES, {}),
              severity: normalizeCode(row.severity, SEVERITIES, {}),
              mitigation: String(row.mitigation || '').trim(),
              required_sil: normalizeCode(row.required_sil, SILS, { 'N/A': 'NA' }),
              residual_frequency: normalizeCode(row.residual_frequency, FREQUENCIES, {}),
              srac_flag: normalizeCode(row.srac_flag, SRAC_FLAGS, { TAK: 'YES', YES: 'YES', NIE: 'NO', NO: 'NO' }) || 'NO',
              actionee: String(row.actionee || '').trim(),
              closure_status: normalizeCode(row.closure_status, CLOSURE_STATUSES, { 'V&V': 'VERIFIED', 'V_V': 'VERIFIED', ZAMKNIETE: 'CLOSED' }) || 'OPEN',
              verification_evidence: String(row.verification_evidence || '').trim(),
              comments: String(row.comments || '').trim(),
              created_by: context.userContext.userName,
              created_at: now,
              updated_by: context.userContext.userName,
              updated_at: now
            };
            hazard.initial_risk = app.riskMatrix.calculateRisk(context.state.config.riskMatrix, hazard.initial_frequency, hazard.severity);
            hazard.residual_risk = app.riskMatrix.calculateRisk(context.state.config.riskMatrix, hazard.residual_frequency, hazard.severity);
            const validationErrors = app.validation.validateRecord(hazard, context.state, null, context.userContext.role);
            if (existingIds.has(hazard.hazard_id)) { validationErrors.hazard_id = 'Hazard ID już istnieje w systemie.'; }
            if (Object.keys(validationErrors).length) { errors.push('Wiersz ' + (index + 2) + ': ' + Object.values(validationErrors).join(' ')); return; }
            existingIds.add(hazard.hazard_id);
            importedHazards.push(hazard);
          });
          resolve({ hazards: importedHazards, errors: errors, summary: 'Zaimportowano ' + importedHazards.length + ' rekordów, błędów: ' + errors.length + '.' });
        } catch (error) { reject(error); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  app.importExport = { exportJson: exportJson, exportCsv: exportCsv, importJson: importJson, importWorkbook: importWorkbook, parseTeamMembers: parseTeamMembers };
})();
