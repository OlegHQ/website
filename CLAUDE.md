# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Oleg Pustovit's personal site built with Hugo: projects, experiments and writing on one index sheet, deployed to Cloudflare from `dev`.

## Tech Stack

- **Static Site Generator**: Hugo (extended version 0.145.0+)
- **Styles and motion**: plain CSS and canvas JS from the design (`assets/sheet/`); Tailwind and GSAP remain only for /hypertweet/
- **JavaScript Runtime**: Bun
- **Package Manager**: Bun (with Nix support)
- **Deployment**: GitHub Pages (automated via GitHub Actions)

## Development Commands

### Local Development
```bash
# Using Makefile (preferred)
make up                    # Start Hugo dev server with drafts

# Using Nix environment
nix develop               # Enters dev shell with Hugo and Bun
make up

# Manual commands
bun install              # Install dependencies
hugo server -D           # Start dev server with drafts
hugo server --buildDrafts # Alternative dev server command

# Remote development (for cloud environments)
make remote              # Binds to 0.0.0.0 for external access
```

### Build Commands
```bash
hugo --minify            # Production build with minification
hugo                     # Standard build
```

### Dependency Management
```bash
bun install              # Install/update JavaScript dependencies
```

## Architecture

The site is the "index sheet" design (design canvas: claude.ai artifact 2UvkPxmNLYecsfWFPtDnsn, boards Main, MainPhone, Post, PostPhone, UIKit, NotFound). Templates were cut from those boards; keep markup, inline styles and class names as they are so the site stays 1:1 with the design.

### Templates
- `layouts/index.html`: home (hero, Projects, Experiments, Writings, Contact). Project and experiment plates are hand-drawn in `layouts/partials/home/`; the writings plate (`partials/sheet/writings.html`) lists posts.
- `layouts/posts/single.html`: a piece. `partials/sheet/body.html` turns `.Content` into the design parts: lede (leading blockquote or description), numbered sections (h2/h3), Fig./Rec. numbering, lists, references rows.
- Render hooks in `layouts/_default/_markup/`: headings open sections, code blocks become code figures, tables get marks and a legend, block images become figure plates. Small hand-drawn SVGs are inlined and recoloured.
- Shortcodes: `asciinema`, `asciinema-hero` (front matter `params.asciinema`), `figure`.
- `layouts/_default/list.html` (/posts/), `single.html` (plain pages), `kit.html` (/ui-kit/, noindex), `layouts/404.html`.
- `layouts/_default/blank.html` and the old `head.html`/`header.html`/`css.html` partials only serve the standalone /hypertweet/ page.

### Assets
- `assets/sheet/sheet.css` and `kit.css`: the design's CSS. `site.css`: additions for the live site.
- `assets/sheet/component.js`: the design component, unchanged. `base.js` stands in for the canvas base class; `boot.js` binds `data-on` handlers, posts the newsletter to Substack, adds page-to-page wipes and mounts asciinema-player (vendored in `static/lib/asciinema-player`).
- Fonts: Hanken Grotesk (Google Fonts) and Pragmasevka (`static/fonts`, OFL). Monospace text is never uppercased or letterspaced.

## Configuration

### Main Config (hugo.toml)
- Site title, author and description in `params`; taxonomies are disabled
- Contact links and the newsletter live in `layouts/partials/sheet/contact.html`; project counts (06, 03) are in the nav partials and home plates
- Google Analytics configured via `services.googleAnalytics`

### Deployment
- **Branch Strategy**: Push to `dev` branch triggers deployment
- **GitHub Actions**: `.github/workflows/static.yml` handles build and deploy
- **Cloudflare Workers**: Deploys static assets to Cloudflare Workers using Wrangler
- **Required Secrets**:
  - `CLOUDFLARE_API_TOKEN`: Cloudflare API token for deployment
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
  - `CLOUDFLARE_PROJECT_NAME`: Cloudflare Worker name
- **Custom Domain**: Configured in Cloudflare dashboard

## Important Notes

### When Modifying JavaScript
- The sheet runtime is `assets/sheet/{base,component,boot}.js`, concatenated and minified by Hugo (`partials/sheet/scripts.html`)
- `assets/js/` (GSAP bundle) only serves /hypertweet/

### When Adding Content
- Blog posts go in content/posts/ as Markdown files; a leading blockquote becomes the Abstract, ## and ### headings become numbered sections
- Use Hugo front matter for metadata
- Images for posts should be co-located in the same directory

### Styling Approach
- Site styles are in assets/sheet/; Tailwind (assets/css, assets/scss) only for /hypertweet/
- Paper #e9e8e3, ink #1c1c1c, one orange #f26522; square corners, no shadows or glow

### Build Considerations
- Hugo extended version required for SCSS processing
- Bun is used for JavaScript dependency management
- Site uses hugo_stats.json for Tailwind CSS purging