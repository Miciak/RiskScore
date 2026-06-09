(function () {
  const app = (window.RiskScore = window.RiskScore || {});
  const labels = app.constants.FIELD_LABELS;
  function makeEntry(hazardId, field, oldValue, newValue, userContext) {
    return { id: 'AUD-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8), hazard_id: hazardId, field: labels[field] || field, old_value: oldValue == null ? '' : String(oldValue), new_value: newValue == null ? '' : String(newValue), user_name: userContext.userName, user_role: userContext.role, timestamp: new Date().toISOString() };
  }
  function diffRecord(previousRecord, nextRecord, userContext) {
    if (!previousRecord) { return [makeEntry(nextRecord.hazard_id, '__created__', '', 'Record created', userContext)]; }
    return Object.keys(nextRecord).reduce(function (entries, field) {
      if (String(previousRecord[field] || '') !== String(nextRecord[field] || '')) { entries.push(makeEntry(nextRecord.hazard_id, field, previousRecord[field], nextRecord[field], userContext)); }
      return entries;
    }, []);
  }
  app.audit = { makeEntry: makeEntry, diffRecord: diffRecord };
})();
