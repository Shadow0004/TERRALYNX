# TerraLynx — Disaster-Response Decision Intelligence Platform

> **Predict. Prepare. Protect.**

TerraLynx is **NOT** a weather forecast viewer. Existing systems already show meteorological alerts and radars. TerraLynx answers the critical operational question:

> **"Given what is predicted, what should we do now?"**

It converts forecasts and hazard telemetry into **localized impact analysis, capacity-constrained evacuation planning, road flood accessibility routing, emergency fleet resource allocation, and real-time What-If scenario simulations**.

---

## ⚡ Core Operational Pipeline

```text
Forecast / Telemetry  ➔  Hazard Impact  ➔  Population Exposure  ➔  Shelter Allocation  ➔  Safe Evacuation Routing  ➔  Resource Planning  ➔  Recalculate (What-If)
```

---

## 🚀 Key Modules Built

1. **Command Center Control Room**:
   - Live category cyclone tracking (Sustained wind, gusts, 24h precipitation, coastal storm surge, landfall ETA).
   - District Risk Index, total exposed population, mandatory evacuation demand, shelter utilization %, unsafe roads count, and resource shortfalls.
   - Ranked priority operational action directives with 1-click execution triggers.
   - 4-Tier filterable emergency alerts feed (`CRITICAL`, `WARNING`, `WATCH`, `INFO`).
   - Medical facility beds/ICU readiness and critical road access status.

2. **Interactive 3D Risk Map (MapLibre GL JS)**:
   - High-contrast tactical GIS interface rendered in MapLibre GL.
   - 10 distinct coastal/inland administrative zones with dynamic risk choropleth (🟢 Safe, 🟡 Watch, 🟠 High, 🔴 Critical).
   - Dynamic road network with flood vulnerability indicators (Safe green corridors vs flooded red segments).
   - Custom shelter markers with real-time capacity and occupancy gauge pins.
   - Vector evacuation routes connecting danger zones to allocated inland shelters.
   - Interactive zone drilldown popup modal showing transparent **"WHY this score?"** explanations and topography profiles.

3. **Hazard & Impact Engine**:
   - 100% deterministic multi-factor scoring combining rainfall intensity, coastal surge height (attenuated exponentially with distance from shore), ground elevation deficiency, wind gust force, and soil saturation/drainage deficit.

4. **Population Exposure & Evacuation Demand**:
   - Demographic fragility weighting (elderly, children, non-engineered kutcha/tin-roof housing vulnerability).
   - Computes exact mandatory evacuation numbers and operational directives.

5. **Shelter Optimization Engine**:
   - Capacity-constrained allocation minimizing transit distance, hazard path exposure, and shelter overload.
   - Evaluates remaining capacity, incoming evacuees, and projected utilization %.
   - Identifies overflow conditions and ranks candidate reserve temporary shelters (e.g. University Convention Center, Logistics Terminals).

6. **Flood-Aware Evacuation Routing**:
   - NetworkX graph pathfinding across road network edges with dynamic flood penalty weights.
   - Computes route distance, travel ETA, corridor risk rating, and warning advisories for flooded segments.

7. **Emergency Resource Logistics Planner**:
   - Calculates exact logistical requirements for evacuation buses (40-pax), inflatable motorized rescue boats (for waterlogged zones), ALS ambulances (for medical dependencies), NDRF/SDRF tactical teams, 72-hour survival food/water packs, trauma kits, and mobile generators.
   - Calculates **Required | Available | Shortfall** with alerts for logistical deficits.

8. **What-If Scenario Simulator (The Killer Feature)**:
   - Live sliders: Precipitation multiplier (-50% to +100%), Cyclone wind force, Storm surge height, Available bus fleet.
   - Facility outage switches: Disable any shelter to simulate power loss/flooding.
   - Road closure switches: Block specific roads (e.g. Coastal Highway 14).
   - **One-click "SIMULATE & RECALCULATE"**: Recalculates all decision graphs instantly and displays a before/after differential impact comparison modal.

9. **Operational AI Decision Assistant**:
   - Grounded conversational assistant operating strictly on current simulation state data without hallucination.
   - Provides explanations and verified metrics citations for priority evacuations, temporary shelter locations, road closures, and resource deficits.

---

## 💻 Tech Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, NetworkX, NumPy, Uvicorn, Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, MapLibre GL JS, Lucide React.
- **Testing**: 100% test pass rate across all decision engines and API endpoints.

---

## 🏃 Running the Application

### 1. Launching via Script (Windows)
Double-click `run_terralynx.bat` or run in PowerShell:
```powershell
.\start_terralynx.ps1
```

### 2. Manual Startup

**Backend**:
```powershell
cd d:\TERRALYNX
.\venv\Scripts\python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`

**Frontend**:
```powershell
cd d:\TERRALYNX\frontend
npm run dev
```
- Web UI: `http://localhost:5173`

---

## 🧪 Running Automated Tests

```powershell
cd d:\TERRALYNX
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend\tests -v
```

---

## 🌊 Demonstration Scenario: Approaching Cyclone Varuna

1. **Open Command Center**: View approaching Category 3 Cyclone Varuna (145 km/h winds, 260mm rain, 1.8m surge, 4.5h landfall ETA).
2. **Inspect Risk Map**: Click **Zone 1 (Estuary Delta Lowlands)** — observe risk score 88.5/100, 21,280 exposed residents, and 14,045 evacuation demand.
3. **Inspect Shelters**: Observe allocations directing evacuees into Shelters S1, S6, and S8 with real-time remaining capacities.
4. **Inspect Resources**: Observe bus deficit (e.g. 11 buses short) and boat allocations.
5. **Run What-If Simulation**:
   - Navigate to **What-If Simulator**.
   - Increase Rainfall by **+30%** (338mm).
   - Click **SIMULATE & RECALCULATE**.
   - Observe differential analysis: Evacuation demand jumps by +4,120, shelter utilization rises, newly inundated road corridors appear, and bus deficit spikes.
6. **Query Decision AI**: Ask *"Which areas should we evacuate first?"* and receive exact grounded metrics.
