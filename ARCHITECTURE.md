# FurStops Project Architecture Reference

> **Important Setup Note:** This project runs a decoupled, headless architecture. The visual frontend and the logical backend live in completely separate repositories and deploy to different hosting environments. Do not merge them into a single directory.

---

## 1. Frontend Control & Interface Layer
* **Directory:** `urban-city-map`
* **Framework:** Next.js (App Router, Client-Side Rendering for portals)
* **Hosting Platform:** Vercel
* **Primary Domains:**
  * Root Gateway: `https://furstops.com` (Displays global overview/instructions)
  * Management Dashboard: `https://app.furstops.com` (Internal administrative operations)
  * Dynamic Tenant Maps: `https://*.furstops.com` (Subdomain catch-all mapped via middleware routing)

---

## 2. Backend Logic & Database Layer
* **Directory:** `furstops-backend` *(Historically labeled: UrbanDog)*
* **Framework:** FastAPI (Python) + SQLAlchemy + Alembic (Database Migrations)
* **Hosting Platform:** Railway
* **Live API Engine Endpoint:** `https://urbandog-production.up.railway.app/api/v1`

---

## 3. Global App Data Flow
1. **Administrative Modifications:** Internal data edits made via the Management Dashboard route payloads directly to the FastAPI endpoints on Railway to append or modify relational database rows.
2. **Public Map Generation:** When an end-user navigates to a designated map path (e.g., `dognotoes.furstops.com`), the Next.js frontend captures the sub-tenant routing string natively.
3. **API Stream & Rendering:** The script issues an authentication-free payload fetch directly to the backend GeoJSON data channels, styling the Mapbox canvas map components dynamically with localized partner colors and active advertiser pin markers.

---

## 4. Key Security Boundaries (CORS Policy)
The FastAPI backend operates a strict cross-origin resource validation firewall block. If pins stop populating on new domains, verify that the `allow_origin_regex` inside the backend repository config file (`main.py`) matches the current application domains:
```python
allow_origin_regex=r"https://(.+\.)?(lovable\.app|furstops\.com)"