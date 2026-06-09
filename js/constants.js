(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  app.constants = {
    STORAGE_KEY: 'riskscore_hazard_log_v1',
    ROLES: [
      { code: 'WORKSHOP_PARTICIPANT', label: 'Workshop Participant' },
      { code: 'SAFETY_ENGINEER', label: 'Safety Engineer' },
      { code: 'ACTIONEE', label: 'Actionee' },
      { code: 'SAFETY_MANAGER', label: 'Safety Manager' }
    ],
    PILLARS: [
      { code: 'OPE', label: 'Operations' },
      { code: 'ENV', label: 'Environment' },
      { code: 'HF', label: 'Human Factors' },
      { code: 'INT', label: 'Interfaces' },
      { code: 'HW_SW', label: 'Hardware / Software' },
      { code: 'CYBER', label: 'Cybersecurity' }
    ],
    FREQUENCIES: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
    SEVERITIES: ['S1', 'S2', 'S3', 'S4'],
    RISKS: ['INTOLERABLE', 'UNDESIRABLE', 'TOLERABLE', 'NEGLIGIBLE'],
    SILS: ['SIL4', 'SIL3', 'SIL2', 'SIL1', 'BI', 'NA'],
    SRAC_FLAGS: ['YES', 'NO'],
    CLOSURE_STATUSES: ['OPEN', 'IMPLEMENTED', 'VERIFIED', 'CLOSED'],
    WORKFLOW_STEPS: ['1. Identyfikacja', '2. Ryzyko początkowe', '3. Mitygacja', '4. Ryzyko resztkowe', '5. Odpowiedzialność'],
    DEFAULT_MATRIX: {
      F1: { S1: 'NEGLIGIBLE', S2: 'NEGLIGIBLE', S3: 'TOLERABLE', S4: 'TOLERABLE' },
      F2: { S1: 'NEGLIGIBLE', S2: 'TOLERABLE', S3: 'TOLERABLE', S4: 'UNDESIRABLE' },
      F3: { S1: 'TOLERABLE', S2: 'UNDESIRABLE', S3: 'UNDESIRABLE', S4: 'INTOLERABLE' },
      F4: { S1: 'TOLERABLE', S2: 'UNDESIRABLE', S3: 'INTOLERABLE', S4: 'INTOLERABLE' },
      F5: { S1: 'UNDESIRABLE', S2: 'UNDESIRABLE', S3: 'INTOLERABLE', S4: 'INTOLERABLE' },
      F6: { S1: 'UNDESIRABLE', S2: 'INTOLERABLE', S3: 'INTOLERABLE', S4: 'INTOLERABLE' }
    },
    DEFAULT_TEAM_MEMBERS: ['Safety Manager', 'Safety Engineer', 'Actionee 1', 'Actionee 2'],
    FIELD_LABELS: {
      hazard_id: 'Hazard ID', pillar: 'Pillar', root_cause: 'Root cause', propagation: 'Propagation', external_effect: 'External effect',
      initial_frequency: 'Initial frequency', severity: 'Severity', initial_risk: 'Initial risk', mitigation: 'Mitigation',
      required_sil: 'Required SIL', residual_frequency: 'Residual frequency', residual_risk: 'Residual risk', srac_flag: 'SRAC flag',
      actionee: 'Actionee', closure_status: 'Closure status', verification_evidence: 'Verification evidence', comments: 'Comments',
      created_by: 'Created by', created_at: 'Created at', updated_by: 'Updated by', updated_at: 'Updated at'
    },
    CSV_FIELDS: ['hazard_id', 'pillar', 'root_cause', 'propagation', 'external_effect', 'initial_frequency', 'severity', 'initial_risk', 'mitigation', 'required_sil', 'residual_frequency', 'residual_risk', 'srac_flag', 'actionee', 'closure_status', 'verification_evidence', 'comments', 'created_by', 'created_at', 'updated_by', 'updated_at']
  };
})();
