/* Team access for the deal pipeline, created in the dashboard's Storage dialog by the pipeline owner.
   It holds the GitHub token for the private pipeline repo, encrypted with the team password (PBKDF2-SHA256,
   600,000 iterations, AES-256-GCM): safe to publish, only the team password opens it.
   null = not set up yet (each device keeps its own pipeline). */
window.TEAM_ACCESS = null;
