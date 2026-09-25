# nexo.sh → olegpustovit.com migration plan

Last updated: 2026-09-25 (Europe/Zagreb)

## Website repo (`OlegHQ/website` · branch `dev`) — DONE

| Item | Status | Notes |
|------|--------|-------|
| Primary domain / `baseURL` | Done | `https://olegpustovit.com/` (`5e7d356`) |
| Self-canonicals | Done | `layouts/partials/head.html` uses `.Permalink` (`a60dd25`) |
| GSC HTML verification file | Done | `static/googledd39e8222d6c0efb.html` (`87ffab8`) |
| Newsletter form → Substack | Done | Custom UI kept, no iframe; action `…/api/v1/free?nojs=true`; field `email` (`68185dd`) |
| Contact / privacy email | Done | `oleg@olegpustovit.com` |

No remaining `nexo.sh` references in this repo. Form still has leftover Kit `data-options` / powered-by metadata in the HTML attributes (cosmetic only; submit goes to Substack).

## Off-repo migration board

| Item | Status | Notes |
|------|--------|-------|
| DEV.to profile website | Done | → olegpustovit.com |
| Medium story canonicals (5) | Done | → matching `/posts/` URLs |
| HackerNoon First Seen At (5) | Submitted | Awaiting editorial review / live verify |
| GitHub README nexo.sh cleanup | Done | OlegHQ profile + agentpack, localwave, microtunnel on `dev` |
| GSC Change of Address + sitemap | Done | crystalboxesgfx; bio.whorl added Owner; sitemap 54 pages |
| GA4 stream URL + annotation | Done | Keep `G-82NPJKSTQK`; GSC product link blocked until ursus95 invited on GSC |
| Kit export → Substack import | Done | Exported 39; Substack added 36 |
| Kit account cancel/delete | In progress | Free plan → Delete account; password confirm was the gate |

## Optional follow-ups (not blocking site)

1. Invite `ursus95@gmail.com` as user on olegpustovit.com GSC, then link GA4 ↔ GSC.
2. Verify HackerNoon canonicals once editors publish.
3. Confirm Kit account fully deleted (login should fail / account gone).
4. Optionally strip stale Kit `data-options` JSON from form partials.
