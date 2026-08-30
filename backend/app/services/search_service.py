"""
Unified Location & Landmark Geocoding Service for TerraLynx.
Provides lightning-fast, high-precision fuzzy search across Universities,
Hospitals, Administrative Sectors, Cities, and Global Landmarks.
"""

import httpx
import re
from typing import List, Dict, Any, Optional

COMPREHENSIVE_GAZETTEER = [
    # Universities, Colleges & Educational Campuses
    {
        "title": "C. V. Raman Global University (CVRGU)",
        "subtitle": "Mahura, Janla, Bhubaneswar, Odisha 752054",
        "category": "university",
        "category_label": "University / Tech",
        "lat": 20.2198,
        "lng": 85.7358,
        "keywords": ["c.v raman", "cv raman", "cvrgu", "cvrce", "c.v. raman", "c.v raman global university", "cv raman university", "c.v. raman college of engineering", "cvrce bbsr", "mahura", "janla"]
    },
    {
        "title": "IIT Bhubaneswar",
        "subtitle": "Argul, Jatni, Khordha, Odisha 752050",
        "category": "university",
        "category_label": "National Institute",
        "lat": 20.1485,
        "lng": 85.6712,
        "keywords": ["iit", "iit bhubaneswar", "iit bbs", "argul", "jatni iit", "indian institute of technology bhubaneswar"]
    },
    {
        "title": "AIIMS Bhubaneswar",
        "subtitle": "Sijua, Patrapada, Bhubaneswar, Odisha 751019",
        "category": "hospital",
        "category_label": "Apex Hospital / Medical",
        "lat": 20.2312,
        "lng": 85.7766,
        "keywords": ["aiims", "aiims bhubaneswar", "aiims hospital", "sijua", "patrapada aiims", "all india institute of medical sciences"]
    },
    {
        "title": "KIIT Deemed to be University",
        "subtitle": "Patia, Bhubaneswar, Odisha 751024",
        "category": "university",
        "category_label": "University Campus",
        "lat": 20.3533,
        "lng": 85.8189,
        "keywords": ["kiit", "kiit university", "kalinga institute of industrial technology", "patia", "kiss university"]
    },
    {
        "title": "SOA University / ITER",
        "subtitle": "Jagamara, Khandagiri, Bhubaneswar, Odisha 751030",
        "category": "university",
        "category_label": "University / ITER",
        "lat": 20.2520,
        "lng": 85.7950,
        "keywords": ["iter", "soa", "siksha o anusandhan", "iter bhubaneswar", "jagamara", "soa university", "institute of technical education and research"]
    },
    {
        "title": "Silicon University (SiliconTech)",
        "subtitle": "Silicon Hills, Patia, Bhubaneswar, Odisha 751024",
        "category": "university",
        "category_label": "Tech University",
        "lat": 20.3705,
        "lng": 85.8080,
        "keywords": ["silicon", "silicontech", "silicon institute", "silicon university", "silicon hills"]
    },
    {
        "title": "Centurion University (CUTM)",
        "subtitle": "Ramachandrapur, Jatni, Bhubaneswar, Odisha 752050",
        "category": "university",
        "category_label": "University Campus",
        "lat": 20.1745,
        "lng": 85.7065,
        "keywords": ["centurion", "cutm", "centurion university", "ramachandrapur"]
    },
    {
        "title": "GITA Autonomous College",
        "subtitle": "Madanpur, Janla, Bhubaneswar, Odisha 752054",
        "category": "university",
        "category_label": "Engineering College",
        "lat": 20.2110,
        "lng": 85.7315,
        "keywords": ["gita", "gita college", "gita autonomous", "madanpur", "gita bhubaneswar"]
    },
    {
        "title": "Trident Academy of Technology",
        "subtitle": "Infocity Area, Chandrasekharpur, Bhubaneswar, Odisha 751024",
        "category": "university",
        "category_label": "Tech Academy",
        "lat": 20.3470,
        "lng": 85.8115,
        "keywords": ["trident", "trident academy", "infocity trident"]
    },
    {
        "title": "Utkal University (Vani Vihar)",
        "subtitle": "Vani Vihar, Saheed Nagar, Bhubaneswar, Odisha 751004",
        "category": "university",
        "category_label": "State University",
        "lat": 20.3015,
        "lng": 85.8450,
        "keywords": ["utkal", "utkal university", "vani vihar", "saheed nagar"]
    },
    {
        "title": "Ravenshaw University",
        "subtitle": "College Square, Cuttack, Odisha 753003",
        "category": "university",
        "category_label": "Historic University",
        "lat": 20.4635,
        "lng": 85.8942,
        "keywords": ["ravenshaw", "ravenshaw university", "college square cuttack"]
    },
    {
        "title": "SCB Medical College & Hospital",
        "subtitle": "Mangalabag, Cuttack, Odisha 753007",
        "category": "hospital",
        "category_label": "Apex Hospital",
        "lat": 20.4682,
        "lng": 85.8895,
        "keywords": ["scb", "scb medical", "scb medical college", "scb hospital", "mangalabag"]
    },
    {
        "title": "National Law University Odisha (NLUO)",
        "subtitle": "Brahmabarda, CDA Sector 13, Cuttack, Odisha 753015",
        "category": "university",
        "category_label": "Law University",
        "lat": 20.4890,
        "lng": 85.7950,
        "keywords": ["nlu", "nluo", "national law university", "cda sector 13"]
    },
    {
        "title": "Sri Sri University",
        "subtitle": "Bidyadharpur, Arilo, Cuttack, Odisha 754006",
        "category": "university",
        "category_label": "University Campus",
        "lat": 20.4410,
        "lng": 85.7890,
        "keywords": ["sri sri", "sri sri university", "ssu", "arilo"]
    },
    {
        "title": "VSSUT Burla (UCE Burla)",
        "subtitle": "Burla, Sambalpur, Odisha 768018",
        "category": "university",
        "category_label": "Tech University",
        "lat": 21.4975,
        "lng": 83.8760,
        "keywords": ["vssut", "vssut burla", "uce burla", "burla engineering"]
    },
    {
        "title": "NIT Rourkela",
        "subtitle": "Sector 1, Rourkela, Sundargarh, Odisha 769008",
        "category": "university",
        "category_label": "National Institute",
        "lat": 22.2530,
        "lng": 84.9010,
        "keywords": ["nit", "nit rourkela", "nit rkl"]
    },

    # Major Cities & Key Administrative Districts
    {
        "title": "Bhubaneswar Capital City",
        "subtitle": "Bhubaneswar Municipal Corporation, Khordha, Odisha 751001",
        "category": "city",
        "category_label": "Capital Metro",
        "lat": 20.2961,
        "lng": 85.8245,
        "keywords": ["bhubaneswar", "bhubaneshwar", "bbsr", "khordha", "smart city bhubaneswar"]
    },
    {
        "title": "Cuttack Millennium City",
        "subtitle": "Cuttack Municipal Corporation (CMC), Cuttack, Odisha 753001",
        "category": "city",
        "category_label": "Municipal City",
        "lat": 20.4625,
        "lng": 85.8828,
        "keywords": ["cuttack", "kataka", "cmc cuttack", "silver city"]
    },
    {
        "title": "CDA Sector 9, Cuttack",
        "subtitle": "Bidanasi Colony, CDA Sector 9, Cuttack, Odisha 753014",
        "category": "suburb",
        "category_label": "Municipal Sector",
        "lat": 20.47937,
        "lng": 85.82872,
        "keywords": ["cda sector 9", "cda sec 9", "cda 9", "cda sector 9 cuttack", "bidanasi sector 9"]
    },
    {
        "title": "CDA Sector 6, Cuttack",
        "subtitle": "CDA Sector 6, Cuttack, Odisha 753014",
        "category": "suburb",
        "category_label": "Municipal Sector",
        "lat": 20.47658,
        "lng": 85.84028,
        "keywords": ["cda sector 6", "cda sec 6", "cda 6", "cda sector vi"]
    },
    {
        "title": "CDA Sector 10, Cuttack",
        "subtitle": "CDA Sector 10, Cuttack, Odisha 753014",
        "category": "suburb",
        "category_label": "Municipal Sector",
        "lat": 20.48354,
        "lng": 85.81933,
        "keywords": ["cda sector 10", "cda sec 10", "cda 10"]
    },
    {
        "title": "CDA Sector 11, Cuttack",
        "subtitle": "CDA Sector 11, Cuttack, Odisha 753014",
        "category": "suburb",
        "category_label": "Municipal Sector",
        "lat": 20.47979,
        "lng": 85.81866,
        "keywords": ["cda sector 11", "cda sec 11", "cda 11"]
    },
    {
        "title": "Puri Coastal City",
        "subtitle": "Puri Municipality, Puri District, Odisha 752001",
        "category": "city",
        "category_label": "Coastal City",
        "lat": 19.8135,
        "lng": 85.8312,
        "keywords": ["puri", "puri beach", "puri coast", "jagannath puri"]
    },
    {
        "title": "Paradeep Port Area",
        "subtitle": "Paradeep Municipality, Jagatsinghpur, Odisha 754142",
        "category": "city",
        "category_label": "Port City",
        "lat": 20.3160,
        "lng": 86.6110,
        "keywords": ["paradeep", "paradip", "paradeep port"]
    },
    {
        "title": "Balasore Town",
        "subtitle": "Balasore Municipality, Balasore, Odisha 756001",
        "category": "city",
        "category_label": "Coastal District",
        "lat": 21.4934,
        "lng": 86.9135,
        "keywords": ["balasore", "baleswar", "chandipur"]
    },
    {
        "title": "Berhampur Silk City",
        "subtitle": "Berhampur Municipal Corporation (BeMC), Ganjam, Odisha 760001",
        "category": "city",
        "category_label": "Municipal City",
        "lat": 19.3150,
        "lng": 84.7941,
        "keywords": ["berhampur", "brahmapur", "ganjam", "gopalpur"]
    }
]

def clean_search_term(term: str) -> str:
    if not term:
        return ""
    t = term.lower().strip()
    t = re.sub(r'[\.\,\-\_\/\(\)\'\"\#]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    # Common phonetic and vernacular variants
    t = t.replace('bhubaneshwar', 'bhubaneswar')
    t = t.replace('kataka', 'cuttack')
    t = t.replace('paradip', 'paradeep')
    t = t.replace('baleswar', 'balasore')
    return t

def score_gazetteer_item(item: Dict[str, Any], query_clean: str, query_tokens: List[str]) -> int:
    score = 0
    clean_title = clean_search_term(item["title"])
    
    # 1. Direct match with exact keywords
    for kw in item.get("keywords", []):
        ckw = clean_search_term(kw)
        if query_clean == ckw:
            return 300
        if ckw.startswith(query_clean) or query_clean.startswith(ckw):
            score = max(score, 220)
        elif query_clean in ckw:
            score = max(score, 180)
            
    # 2. Match with Title
    if query_clean == clean_title:
        return 300
    if clean_title.startswith(query_clean) or query_clean.startswith(clean_title):
        score = max(score, 200)
    elif query_clean in clean_title:
        score = max(score, 160)
        
    # 3. Token-based overlap
    title_tokens = set(clean_title.split())
    matched_title_tokens = sum(1 for tok in query_tokens if tok in title_tokens)
    if matched_title_tokens == len(query_tokens) and len(query_tokens) > 1:
        score = max(score, 190)
    elif matched_title_tokens > 0:
        score = max(score, matched_title_tokens * 40)
        
    return score

def search_local_gazetteer(query: str) -> List[Dict[str, Any]]:
    cq = clean_search_term(query)
    tokens = [tok for tok in cq.split() if len(tok) > 1 and tok not in ("in", "of", "and", "the", "at", "to")]
    
    scored = []
    for item in COMPREHENSIVE_GAZETTEER:
        s = score_gazetteer_item(item, cq, tokens)
        if s > 0:
            scored.append((s, item))
            
    scored.sort(key=lambda x: -x[0])
    return [item for score, item in scored[:6]]

async def search_photon_osm_live(query: str) -> List[Dict[str, Any]]:
    cq = clean_search_term(query)
    url = f"https://photon.komoot.io/api/?q={httpx.URL('', params={'q': cq}).params['q']}&limit=6"
    results = []
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                for feat in data.get("features", []):
                    props = feat.get("properties", {})
                    coords = feat.get("geometry", {}).get("coordinates", [])
                    if not coords or len(coords) < 2:
                        continue
                    name = props.get("name") or props.get("city") or props.get("district") or props.get("county") or ""
                    if not name:
                        continue
                    state = props.get("state") or props.get("county") or ""
                    country = props.get("country") or ""
                    sub = f"{state}, {country}" if state and country else state or country
                    osm_type = props.get("type", "locality")
                    
                    cat = "university" if any(w in name.lower() for w in ["university", "college", "institute", "campus"]) else \
                          "hospital" if any(w in name.lower() for w in ["hospital", "medical", "clinic", "health"]) else \
                          "city" if osm_type in ("city", "town", "administrative") else "locality"
                          
                    cat_label = "University / Institute" if cat == "university" else \
                                "Hospital" if cat == "hospital" else \
                                "City / Region" if cat == "city" else "Location"

                    results.append({
                        "title": name,
                        "subtitle": f"{name}, {sub}" if sub else name,
                        "category": cat,
                        "category_label": cat_label,
                        "lat": round(float(coords[1]), 5),
                        "lng": round(float(coords[0]), 5),
                    })
    except Exception:
        pass
    return results

async def search_locations(query: str) -> List[Dict[str, Any]]:
    """
    Unified multi-layered search combining local high-precision landmark gazetteer
    and live Photon OpenStreetMap engine.
    """
    if not query or len(query.strip()) < 2:
        return []
        
    gazetteer_items = search_local_gazetteer(query)
    photon_items = await search_photon_osm_live(query)
    
    combined: List[Dict[str, Any]] = []
    seen = set()
    
    # Prioritize gazetteer items
    for g in gazetteer_items:
        key = (round(g["lat"], 2), round(g["lng"], 2))
        if key not in seen:
            seen.add(key)
            combined.append({
                "title": g["title"],
                "subtitle": g["subtitle"],
                "category": g["category"],
                "category_label": g["category_label"],
                "lat": g["lat"],
                "lng": g["lng"]
            })
            
    # Append photon results
    for p in photon_items:
        key = (round(p["lat"], 2), round(p["lng"], 2))
        if key not in seen:
            seen.add(key)
            combined.append(p)
            
    return combined[:8]
