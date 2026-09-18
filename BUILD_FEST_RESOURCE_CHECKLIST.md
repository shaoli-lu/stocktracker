# Build Fest: Work Version Resource Checklist for Azure Static Web Apps

## 1) Summary
This project is a Next.js stock dashboard that calls Finnhub for market data, then renders charts and widgets in the browser. The app does not currently use a database, customer auth, or a backend service beyond a server-side proxy route that keeps the API key secret.

Relevant implementation points:
- App framework: Next.js + React in [package.json](package.json)
- Financial API proxy: [src/app/api/finnhub/route.ts](src/app/api/finnhub/route.ts)
- API callers: [src/lib/api.ts](src/lib/api.ts)

## 2) Required resources

### Azure / hosting
- Azure subscription
  - Needed for Azure Static Web Apps (SWA)
  - Registration: sign up for an Azure subscription if not already available
- Azure Static Web App resource
  - Plan: Standard or Free depending on internal requirements
  - Best fit for this app because it is a Next.js frontend with a server-side API proxy route
- GitHub repository
  - Required for SWA deployment workflows
  - Connect repo to Azure Static Web Apps for CI/CD
- Azure access / role permissions
  - Owner or Contributor on the target subscription/resource group
  - Ability to create resource groups, app settings, and deployment tokens

### Data / API access
- Finnhub account
  - Required for live market data, quote, profile, news, earnings, and candle data
  - Registration: create a Finnhub account and generate an API key
  - Secret storage: set as a server-side environment variable such as `FINNHUB_API_KEY`
- Optional internal corporate approvals
  - If this is a work/external-facing demo, confirm whether any data licensing, marketing, or internal security review is required

### Dev and deployment tooling
- GitHub account and repo access
- Azure Developer CLI (`azd`) optional but helpful for repeatable setup
- Node.js 20+ runtime for local development and build
- VS Code / Codespaces / dev container if team wants a shared environment

## 3) APIs used by this app
The code is currently using Finnhub as the primary market-data API. The app reaches Finnhub through a local proxy route so the key stays server-side.

### Finnhub endpoints used
- `/quote` — current market quote
- `/stock/profile2` — company profile and logo
- `/stock/candle` — chart candles
- `/news` — general market/news feed
- `/company-news` — company-specific news
- `/search` — symbol search
- `/calendar/earnings` — earnings events
- `/stock/metric` — financial metrics

### Finnhub registration details
- Registration needed: yes
- Cost: depends on plan; some endpoints may be limited or premium-tier depending on account
- Secret handling: store the API secret in Azure environment variables or Key Vault, not in the browser or repo
- Important: the project intentionally uses a server-side proxy in [src/app/api/finnhub/route.ts](src/app/api/finnhub/route.ts) to avoid exposing the key in client code

### Not currently used
- No database (SQL, Cosmos DB, Postgres, MongoDB)
- No auth provider / SSO
- No email or notification service
- No analytics platform in the current repo
- No Azure AI / OpenAI integration

## 4) Azure Static Web Apps considerations

### Good fit for this app
- This is a frontend-heavy Next.js app with a server-side API route and environment variables
- SWA supports GitHub-based CI/CD and can host Next.js apps
- Good for demos, internal portals, and team showcase builds

### Things to set up in Azure
- Resource group
- Static Web App resource
- GitHub connection / deployment token
- App settings / environment variables:
  - `FINNHUB_API_KEY`
  - optionally `FINNHUB_API_BASE_URL` if custom base URL is ever needed
- Optional staging environment for preview builds

### Security recommendations
- Do not store secrets in source control
- Prefer Azure Key Vault for production secrets if the work version will be shared widely
- Use least-privilege Azure roles
- Review whether the app should be made public or restricted to internal users only

## 5) Work-version customization checklist
If this is a “work version” of the same site, here are the items to decide before the Build Fest:

- Branding
  - company name / logo / internal colors
  - remove or replace any personal or public branding
- Data scope
  - use all tracked symbols or a smaller set for the internal audience
  - decide whether generic market data is okay or if you need a stricter internal watchlist
- Access model
  - public demo vs internal secure demo
  - if internal-only, plan for Microsoft Entra ID or Azure Front Door / WAF controls
- Content review
  - ensure any news or financial data disclaimers are acceptable for internal use
- Release readiness
  - confirm the app still works with the SWA build process in production mode
  - test the fallback behavior when Finnhub rate limits are hit
- Operational support
  - document who owns the Azure resource after the event
  - document which repo/branch should be used for the demo deployment

## 6) Other considerations for Build Fest
- App uses client-side caching with `sessionStorage` in [src/lib/api.ts](src/lib/api.ts), so browser sessions may behave differently from a fresh machine or shared demo device
- Finnhub rate limits can affect live data loads; the app includes fallback logic and cached data, but production demos should still have a valid API key and healthy quota
- Since this is a stock-data site, legal/compliance review may be prudent for any internal or public sharing
- Set up one demo environment and one backup plan so the team is not blocked by deployment issues during the event
- Keep a simple runbook with:
  - Azure portal link
  - GitHub repo
  - Finnhub key owner
  - deployment status / rollback steps

## 7) Copy/paste prompt to build the app/site
Use this prompt for a coding assistant or team build session:

> Build a production-ready internal work version of this Next.js stock dashboard, designed for Azure Static Web Apps deployment. Keep the same core features and market-data experience as the current app, but adapt it for an internal corporate demo. Requirements: use Next.js 16 + React 19; keep the stock dashboard UI and charting features; use a server-side API proxy for Finnhub so the API key is never exposed to the browser; configure environment variables and deployment settings for Azure Static Web Apps; document all external dependencies and required registrations; ensure the app is secure, easy to deploy from GitHub, and suitable for a team Build Fest; include a clean README and any necessary deployment notes; use best practices for secrets management and rate-limit handling.

## 8) Recommended starter checklist for the event
- [ ] Azure subscription active
- [ ] GitHub repo connected to Azure Static Web Apps
- [ ] Finnhub account created and API key obtained
- [ ] `FINNHUB_API_KEY` configured in Azure app settings
- [ ] Repo branch selected for deployment
- [ ] Production build tested locally
- [ ] Preview/staging deployment validated
- [ ] Demo URL shared with team
- [ ] Rollback plan documented
- [ ] Ownership / contact for the resource captured

## 9) Short version: what you really need
If you want the minimal set, it is this:
- Azure subscription + Static Web App
- GitHub repo + deployment connection
- Finnhub API key
- Environment variable configuration in Azure
- Optional Domain / Security review if this is a work-facing public demo

This is enough to host the current app in a work-friendly Azure environment without changing the core design or data model.

I’m checking the actual chart implementation so I can answer precisely whether the candle view is tied to Finnhub data, a third-party chart library, or both.

Searched for text `TradingView|lightweight-charts|apexcharts|candlestick|stock/candle|tv_wid` (`**/src/**`), 16 results

Read 

## Answer

The candlestick chart is primarily a TradingView widget, not a Finnhub chart.

Evidence in `CandleTab.tsx`:
- it loads TradingView from https://s3.tradingview.com/tv.js
- it creates a new window.TradingView.widget(...)
- it sets the widget container and uses the selected symbol/resolution

There is also Finnhub usage in `api.ts`, but that is mainly for:
- quote data
- profile data
- earnings/news/search
- fallback candle handling for some data paths

So the chart experience is effectively:
- TradingView = visual chart UI
- Finnhub = market data backend / supporting API calls

### Is it okay for a work Build Fest?
Usually yes, for an internal work/demo use, this is reasonable. But there are two caveats:

- TradingView widgets typically have usage/licensing terms depending on how you embed and display them
- If this will be public-facing, or used in a commercial environment, review TradingView’s terms and your company’s internal policy

For an internal corporate demo or internal Build Fest, it is generally acceptable as long as:
- you are not redistributing the charting component outside agreed usage
- you have the right to use the app internally
- you are not exposing the app publicly without checking licensing and data policies

### Practical recommendation
For a work Build Fest:
- keep it internal
- make sure the app is demo-only
- confirm your org is okay with the TradingView widget and Finnhub data usage
- note that the project is using both services and the API key is protected server-side in `route.ts`

This project is an internal demonstration of a stock market dashboard developed in Next.js and intended for deployment to Azure Static Web Apps. For the Build Fest, the application will be used only in an internal environment. The solution uses Finnhub for market data and an embedded TradingView candlestick chart for visualization. The Finnhub API key will be stored securely on the server side and will not be exposed in the browser or source control. The application will not be published externally or shared with customers unless additional review and approval are completed in accordance with corporate policy and third-party service terms.
