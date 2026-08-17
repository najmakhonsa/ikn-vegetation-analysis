# IBU KOTA NUSANTARA (IKN) — Custom Enterprise Requirements & Briefing

> **Subdomain**: `ibukotanusantara`  
> **Client**: Ibu Kota Nusantara (IKN Custom Enterprise)  
> **Workspace Path**: `apps/custom-enterprise/ibukotanusantara/`  
> **Access Status**: Open (Development Mode)  

---

## 🎯 Project Overview & Scope
Ibu Kota Nusantara (IKN) is the new smart capital city project of Indonesia. This custom enterprise module provides:
1. **Smart City & Autonomous Transit Control Panel**: Real-time asset tracking, automated fleet dispatch, and infrastructure metrics monitoring.
2. **Citizen & Enterprise Service Portal**: Automated appointment booking, VIP visitor passes, permit applications, and WhatsApp Business customer automation via Evolution API.
3. **High-Performance Presentation & Command Center Dashboard**: Futuristic dark-mode interface with live status telemetry, animated interactive nodes, and high-impact visual design.

---

## 🏗️ Technical Architecture
* **Frontend**: HTML5, Vanilla CSS / OKLCH custom tokens, Modern Inter & Fraunces typography, GSAP / Motion micro-interactions.
* **Media & Assets Staging**: Local staging via `transport/ibukotanusantara/`, synced to `/opt/codaxiom/apps/custom-enterprise/ibukotanusantara/public/` via `scripts/sync-transport.ps1`.
* **Automation & Messaging**: Evolution API WhatsApp Gateway integration for instant notifications and automated citizen queries.

---

## 📝 Antigravity Development Directives
* All code, design, and assets for this client must reside strictly inside `apps/custom-enterprise/ibukotanusantara/`.
* Maintain high aesthetic quality with dark mode, glowing HUD elements, sleek typography, and robust mobile/desktop responsive design.

