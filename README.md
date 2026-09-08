# VeriMerge

> **AI-Powered, Evidence-First Platform for Reconciling Conflicting Digital Records**

VeriMerge is an enterprise data reconciliation platform designed to resolve discrepancies across fragmented corporate sources (CRM, ERP, spreadsheets, external APIs) without ever destroying or blindly overwriting original data.

Every reconciled attribute retains an immutable audit trail: original values, source metadata, timestamps, multi-factor confidence, corroborating evidence, AI reasoning, and human governance decisions.

---

## 1. Product Concept & Workflow

```
FRAGMENTED DATA 
  → MULTI-SIGNAL ENTITY RESOLUTION 
  → CONFLICT DETECTION 
  → CORROBORATING EVIDENCE 
  → AI REASONING 
  → ZERO-TRUST GOVERNANCE 
  → TRUSTED GOLDEN RECORD
```

### Core Principle: Zero Overwrite Guarantee
- Incoming records are stored as immutable raw snapshots (`SourceRecord.raw_data_json`).
- Reconciliation never deletes or mutates source records.
- If ERP reports `18 MG Rd` and CRM reports `12 MG Road`, both raw values remain preserved and inspectable in the source catalog and side-by-side comparison tables.

---

## 2. Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Pydantic v2, Pandas, openpyxl, RapidFuzz, httpx, pytest
- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Vite, Lucide React, Recharts
- **Database**: SQLite (default local file database for zero-setup friction) / PostgreSQL with pgvector support
- **AI Layer**: Pluggable OpenAI-compatible LLM abstraction with an intelligent, grounded heuristic reasoning fallback engine

---

## 3. Quick Start (Run Locally in 2 Minutes)

### Prerequisites
- Node.js (v20+ or v22+) & npm
- Python 3.11+ (or `uv` package manager)

### 1. Start the Backend

```powershell
cd verimerge/backend

# Using uv (recommended)
uv venv
uv pip install -e .
uv run python run.py

# Or using standard python
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
Backend will be online at: **`http://localhost:8000`**  
Interactive API Docs: **`http://localhost:8000/docs`**

### 2. Start the Frontend

```powershell
cd verimerge/frontend
npm install
npm run dev
```
Frontend will be online at: **`http://localhost:5173`**

---

## 4. The Live Demo Flow (Step-by-Step)

You can run the complete end-to-end demo directly from the UI:

1. Open **`http://localhost:5173`** in your browser.
2. Click the glowing **"Run Live Demo"** button on the sidebar or dashboard.
3. This automatically seeds:
   - `CRM.csv`: John A Smith, 12 MG Road, +91 9876543210
   - `ERP.csv`: J. Smith, 18 MG Rd, +91 9876543210, Director: Raj Kumar, Bank: •••• 8765
   - `Customers.xlsx`: Jon Smith, 12 M.G. Road
   - `WebEvidence.json`: MCA Registry (12 MG Road)
4. The system executes multi-signal entity clustering into **One Canonical Entity**:
   - **Legal Name**: `99%` (Auto-reconciled 🟢)
   - **Registered Address**: `96%` (Corroborated by MCA Registry & Company Website 🟢)
   - **Phone Number**: `91%` (Auto-reconciled 🟢)
   - **Director**: `73%` (Routed to Human Review 🟡)
   - **Bank Account Details**: `58%` (High-risk conflict blocked 🔴)
5. Click **"Why?"** on any field to view the exact mathematical formula and corroboration factors.
6. Click **"Ask Conflict Copilot"** to see grounded natural-language explanations of why `12 MG Road` was chosen over `18 MG Rd`.
7. Navigate to **Human Review (`/review`)** and click **"Approve"** on Raj Kumar.
8. Navigate to **Evidence Graph (`/graph`)** to explore the hierarchical interactive visualization: `Source -> Record -> Entity -> Field -> Evidence -> Decision -> Golden Record`.
9. Navigate to **Audit Ledger (`/audit`)** to view the tamper-evident event stream.
10. Navigate to **Data Ingestion (`/sources`)** and confirm that the original ERP value `18 MG Rd` remains completely preserved!

---

## 5. Zero-Trust Field Scoring Algorithm

Field confidence $C_f \in [0, 100]\%$ is calculated independently for every attribute:

$$C_f = \left( w_{\text{auth}} \cdot S_{\text{auth}} + w_{\text{agree}} \cdot S_{\text{agree}} + w_{\text{ev}} \cdot S_{\text{ev}} \right) \times S_{\text{entity}}$$

- **Source Authority ($S_{\text{auth}}$)**: Configurable weights:
  - Government Registry: `0.95`
  - Company Website: `0.85`
  - ERP: `0.75`
  - CRM: `0.70`
  - Manual Excel: `0.50`
- **Source Agreement ($S_{\text{agree}}$)**: Ratio of independent sources corroborated.
- **External Evidence ($S_{\text{ev}}$)**: Boost provided by verified public registries or APIs.
- **Entity Match Confidence ($S_{\text{entity}}$)**: Multi-signal clustering score.

### Decision Thresholds
- **$\ge 90\%$**: `AUTO-RECONCILE` 🟢
- **$70\% - 89\%$**: `HUMAN REVIEW` 🟡
- **$< 70\%$**: `BLOCKED` 🔴

---

## 6. Automated Testing

Run the automated test suite to verify preservation and scoring integrity:

```powershell
cd verimerge/backend
.\.venv\Scripts\python -m pytest -v
```

Tests include:
- `test_preservation.py`: Guarantees reconciliation NEVER mutates or deletes original source records.
- `test_conflict_and_trust.py`: Verifies zero-trust thresholds and evidence corroboration.
- `test_entity_resolution.py`: Verifies multi-signal fuzzy and deterministic clustering.
- `test_normalization.py`: Verifies canonical header mapping and value cleaning.

---

## 7. Docker Deployment

To spin up the entire stack with PostgreSQL and pgvector:

```powershell
docker-compose up --build
```
