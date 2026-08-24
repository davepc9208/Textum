# External availability monitoring

The repository includes `monitoring/checkly.config.ts` plus `monitoring/textum-availability.check.ts` with two external HTTPS monitors:

- `https://www.mentoriatextum.com/` checks the production custom domain.
- `https://textum.pages.dev/` checks the Cloudflare Pages hostname independently.

Both monitors run every five minutes from Ireland, Frankfurt, Paris, Milan, and North Virginia. They require an IPv4 HTTPS response with status `200` and alert on slow responses above the configured thresholds. Failure and recovery notifications are sent to `davepc92@gmail.com`.

## First-time Checkly setup

From the repository root:

```bash
npm install --prefix monitoring
cd monitoring
npx checkly login
npm test
npm run deploy
```

`checkly login` stores the account token locally. Do not add that token, `.checkly` files, or credentials to Git. The Checkly CLI is intentionally isolated under `monitoring/` so Cloudflare Pages does not install it during the application build.

The Checkly project is independent of the Cloudflare Pages deployment. A failed custom-domain monitor with a healthy `pages.dev` monitor indicates a DNS/custom-domain issue. If both fail only in Europe while North Virginia remains healthy, investigate a regional network or ISP block. If all locations fail, investigate Cloudflare Pages or the deployment itself.

## Measuring Spain specifically

Checkly's public locations currently include Ireland, Frankfurt, Paris, Milan, and Stockholm, but not Madrid or a Spanish ISP. The European checks are useful for regional comparison, but they cannot prove what a particular Spanish operator sees.

To measure the exact Spanish access path:

1. In Checkly, create a **Private Location** named `textum-spain-live`.
2. Run the Checkly Agent on an always-on machine or small Docker host connected through the Spanish ISP that matters.
3. Keep the API key only in the host's secret configuration:

```bash
docker run -e API_KEY="pl_REPLACE_WITH_CHECKLY_PRIVATE_LOCATION_KEY" -d checkly/agent:latest
```

4. Add `privateLocations: ['textum-spain-live']` to the two monitors, or assign the monitors to that location in the Checkly dashboard.
5. Keep at least two public European locations as redundancy, so a single Checkly location outage does not create a false incident.

The private agent must have outbound access to `https://agent.checklyhq.com`. Never commit its API key.

## Alert tuning

The current monitors send failure, recovery, and degraded-response notifications. If matchday traffic produces transient false positives, keep the five-minute schedule and configure a retry/escalation policy in Checkly to require a second failed run before paging. Do not disable recovery notifications: they confirm when access returns.

## Operational interpretation

- Custom domain fails, `pages.dev` passes: custom DNS, certificate, or Pages custom-domain association.
- Both domains fail in one public region, other regions pass: regional Cloudflare/ISP routing problem.
- Both domains fail in all regions: Cloudflare Pages, DNS, certificate, or project deployment problem.
- Public regions pass, Spanish private location fails: Spanish ISP or matchday IP blocking is confirmed.

The monitor checks reachability and HTTP status. It does not replace browser tests for JavaScript rendering; the existing Playwright suite remains the place for application behavior and accessibility regression tests.
