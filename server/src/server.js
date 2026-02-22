const { createApp } = require('./app');
const { requireEnv, getConfig } = require('./config');

function main() {
  const cfg = getConfig();
  // Fail-fast only in the actual runtime entrypoint.
  requireEnv('TMDB_TOKEN');

  const app = createApp();
  app.listen(cfg.port, () => {
    console.log(`Server running on port ${cfg.port}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main };
