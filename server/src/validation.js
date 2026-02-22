function validateTrendingQuery(req, res, next) {
  const window = (req.query.window || 'day').toLowerCase();
  const pageRaw = req.query.page || '1';
  const page = Number(pageRaw);

  if (!['day', 'week'].includes(window)) {
    return res.status(400).json({ error: "Invalid 'window'. Use 'day' or 'week'." });
  }
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    return res.status(400).json({ error: "Invalid 'page'. Use an integer between 1 and 500." });
  }

  req.validated = { window, page };
  next();
}

function validateMovieId(req, res, next) {
  const id = req.params.id;
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: "Invalid 'id'. Must be a numeric TMDB movie id." });
  }
  req.validated = { id };
  next();
}

// NEW: /movies/batch?ids=1,2,3
function validateBatchIds(req, res, next) {
  const raw = (req.query.ids || '').trim();
  if (!raw) {
    return res.status(400).json({ error: "Missing 'ids'. Example: /movies/batch?ids=123,456" });
  }

  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    return res.status(400).json({ error: "Invalid 'ids'. Provide comma-separated numeric ids." });
  }

  // numeric check
  for (const p of parts) {
    if (!/^[0-9]+$/.test(p)) {
      return res.status(400).json({ error: `Invalid id '${p}'. Must be numeric.` });
    }
  }

  // parse + dedupe
  const ids = Array.from(new Set(parts.map((p) => Number(p))));

  // NOTE: batchMaxIds is in config; app.js passes it via req.app.locals.cfg
  const cfg = req.app.locals.cfg;
  const maxIds = cfg.batchMaxIds || 50;

  if (ids.length > maxIds) {
    return res.status(400).json({ error: `Too many ids. Max is ${maxIds}.` });
  }

  req.validated = { ids };
  next();
}

module.exports = { validateTrendingQuery, validateMovieId, validateBatchIds };
