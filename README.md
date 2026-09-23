# LandStack — Smart Land Governance Platform (SIH 2026)

> **Tagline:** *One Parcel. One Identifier. One Unified View.*  
> **Project Title:** AI-Driven Integrated GIS-Based Land Stack for Smart Land Governance  
> **Event:** Smart India Hackathon (SIH) 2026

---

## 1. Executive Summary & Problem Statement

Land information in India is historically fragmented across disconnected departmental silos:
- **Revenue & Disaster Management** (Patta, Chitta, Jamabandi, Records of Rights)
- **Registration & Stamp Revenue** (Sale Deeds, Encumbrance Certificates)
- **Survey & Settlement** (Cadastral boundaries, Field Measurement Books)
- **Town & Country Planning** (Master plans, zoning permissions, land-use conversion)
- **Municipal / Urban Local Bodies** (Property tax assessments, water/utility NOCs)

Because these departments maintain isolated databases, citizens endure repetitive physical verifications, procedural delays, and title disputes.

### The LandStack Solution
**LandStack** solves this by using **ULPIN (Unique Land Parcel Identification Number)** as the universal digital peg (Bhu-Aadhaar) linking all spatial, fiscal, legal, and operational attributes of a land parcel into a single unified source of truth.

```text
                     LANDSTACK
                         │
                         ▼
                       ULPIN
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 Land Records       Registration        GIS Maps
       │                 │                 │
       ├──────────── Tax / Revenue ────────┤
       │                 │                 │
       ├────────── Planning / Land Use ─────┤
       │                 │                 │
       └──────────── Services ──────────────┘
                         │
                         ▼
                  Unified Parcel View
```

---

## 2. Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Java 21/23, Spring Boot 3.3.4 | Robust enterprise REST service layer |
| **Security & RBAC** | Spring Security 6, JJWT 0.12.6, BCrypt | Strict role-based backend authorization |
| **Persistence & ORM** | Spring Data JPA, Hibernate 6, MySQL 9.7 | Relational persistence with ULPIN indexing |
| **Frontend Core** | React 18, Vite 5, React Router DOM 6 | Single-page reactive application |
| **Styling & Icons** | Tailwind CSS v3, Lucide React | DPI-inspired government design system |
| **Geospatial GIS** | Leaflet 1.9, React-Leaflet 4 | Cadastral polygon boundary visualization |
| **Offline Engine** | IndexedDB native storage + Web Online/Offline Events | Low-connectivity rural sync queue |
| **AI Abstraction** | Modular `AiService` | Multi-factor risk scoring & NLP query extraction |

---

## 3. High-Level System Architecture

```text
+---------------------------------------------------------------------------------------+
|                                    REACT FRONTEND                                     |
|                                                                                       |
|  [Citizen Portal (/login)]          [Staff Portal (/staff/login)]         [GIS Map]   |
|  - Dashboard                        - Admin (Staff, Dept, Catalog, Audit) - Cadastral |
|  - ULPIN Search & 360 View          - Supervisor (Review, Assign Officer) - Leaflet   |
|  - Apply for Services               - Field Officer (Site Verification)   - GeoJSON   |
|                                                                                       |
|  [Offline Engine: IndexedDB Local Cache + Action Queue + Online/Offline Sync Indicator]|
+-------------------------------------------+-------------------------------------------+
                                            | Axios REST (JWT Header)
                                            v
+---------------------------------------------------------------------------------------+
|                               SPRING BOOT 3.x BACKEND                                 |
|                                                                                       |
|  [Security Filter Chain: JWT Auth Filter -> Role Checks (ADMIN/SUPERVISOR/OFFICER/CIT)]|
|                                                                                       |
|  [Controllers & Services]                                                             |
|   ├── AuthController & AuthService (Separate Citizen vs Staff login, BCrypt, JWT)     |
|   ├── ParcelController & ParcelService (ULPIN 360, Cadastral GeoJSON, Anomaly Check)  |
|   ├── ApplicationController & WorkflowService (SUBMITTED -> FIELD_VERIFY -> APPROVED) |
|   ├── FieldVerificationController & Service (Site reports, photos, GPS check)         |
|   ├── AdminController (Staff onboarding, Departments, Catalog management)             |
|   ├── NotificationController & AuditLogController                                     |
|   └── AiService (Parcel Risk Scoring, Doc Classification, NLP Search prototype)       |
+-------------------------------------------+-------------------------------------------+
                                            | Spring Data JPA / Hibernate
                                            v
+---------------------------------------------------------------------------------------+
|                                  MySQL DATABASE                                       |
|  users | roles | departments | parcels | services | applications | audit_logs ...    |
+---------------------------------------------------------------------------------------+
```

---

## 4. Role-Based Access Control (RBAC)

Spring Security enforces strict role boundaries at the filter chain level. Unauthorized access triggers `HTTP 403 Forbidden`:

| Role | Portal URL | Primary Responsibilities |
| :--- | :--- | :--- |
| **CITIZEN** | `/login` | Search ULPINs, explore cadastral map, apply for services, track applications, download certificates |
| **DEPARTMENT_SUPERVISOR** | `/staff/login` | Review departmental applications, scrutinize documents, assign field officers, approve/reject |
| **FIELD_OFFICER** | `/staff/login` | Perform on-site DGPS inspections, verify boundary pegs, detect encroachment, submit reports |
| **ADMIN** | `/staff/login` | Onboard supervisors/officers, assign departments, configure service catalog, inspect audit logs |

---

## 5. Pre-Seeded Demo Credentials

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@landstack.demo` | `Demo@123` | Universal System-Wide Oversight |
| **Department Supervisor** | `supervisor@landstack.demo` | `Demo@123` | Revenue & Disaster Management |
| **Cadastral Field Officer** | `officer@landstack.demo` | `Demo@123` | Revenue Cadastral Inspections |
| **Citizen** | `citizen@landstack.demo` | `Demo@123` | Public Portal Access |

---

## 6. Statutory Service Lifecycle Workflow

Adapted from the proven CivicDesk model with an immutable audit log:

```text
SUBMITTED
     │
     ▼
UNDER_REVIEW
     │
     ├───────────────┐
     ▼               ▼
PENDING_DOCUMENTS   FIELD_VERIFICATION
     │               │
     ▼               ▼
DOCUMENTS_SUBMITTED VERIFIED
                     │
                     ▼
                 SUPERVISOR_REVIEW
                     │
              ┌──────┴──────┐
              ▼             ▼
          APPROVED        REJECTED
              │
              ▼
          COMPLETED (Certificate Issued)
```

---

## 7. SIH 2026 17-Step Live Demo Flow

To demonstrate the full power of LandStack to the jury, open the **"SIH Demo Flow"** modal in the top navigation:

1. **Step 1:** Log in as **Citizen** (`citizen@landstack.demo`).
2. **Step 2:** Search canonical ULPIN `33TNCHN0000123456`.
3. **Step 3:** Inspect the 360° Property Panel (Survey No. `124/3B`, Area 2.45 Acres, AI Risk Score, Clear Title).
4. **Step 4:** Click **"Apply for Government Service"** and select *Land Ownership Certificate (Patta)*.
5. **Step 5:** Submit application with pre-verified document dossier (`LS-2026-00004`).
6. **Step 6:** Log out and sign in to **Staff Portal** as **Supervisor** (`supervisor@landstack.demo`).
7. **Step 7:** See the new inbound application in the Revenue Department pipeline.
8. **Step 8:** Review citizen dossier and attached documents.
9. **Step 9:** Click **"Assign Field Officer"** and select *Vikramaditya Rao* (`officer@landstack.demo`).
10. **Step 10:** Log in as **Field Officer** (`officer@landstack.demo`).
11. **Step 11:** Open assigned case on the inspection desk.
12. **Step 12:** Fill out DGPS coordinates verification, confirm boundary pegs, and submit verification report.
13. **Step 13:** Supervisor receives an instant in-app notification of inspection completion.
14. **Step 14:** Supervisor approves the application; statutory digital certificate is generated.
15. **Step 15:** Citizen receives real-time approval notification.
16. **Step 16:** Citizen opens application details and views/prints the **Statutory Digital Certificate** with QR verification code.
17. **Step 17:** Log in as **Admin** (`admin@landstack.demo`) and verify that every step is recorded in `/admin/audit-logs`.

---

## 8. Offline-First Architecture

Designed specifically for remote rural revenue offices with intermittent connectivity:
- **IndexedDB Store:** Caches parcel records and stores offline submissions (`SUBMIT_APPLICATION`, `FIELD_VERIFICATION`).
- **Connection Listener:** Detects transition between online and offline states.
- **Auto-Sync Engine:** Automatically flushes queued actions via Axios when internet access resumes.
- **Live Status Pill:** Real-time visual badge (`● Online`, `● Offline (IndexedDB Active)`, `● Syncing...`).

---

## 9. Installation & Running Locally

### Prerequisites
- Java Development Kit (JDK 21 or 23)
- Apache Maven 3.9+
- Node.js v18+ & npm
- MySQL Server 8.0+ or 9.x (running on port 3306)

### Step 1: Database Setup
Ensure MySQL is running on port 3306 and create the database:
```sql
CREATE DATABASE IF NOT EXISTS landstack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Running the Spring Boot Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/landstack-backend-0.0.1-SNAPSHOT.jar
```
*The backend will automatically start on `http://localhost:8080` and seed all roles, departments, demo accounts, 8 services, and 22 cadastral parcels.*

### Step 3: Running the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Access the application at `http://localhost:5173`.*

---

## 10. Key REST API Endpoints

### Authentication
- `POST /api/auth/citizen/login` - Citizen authentication
- `POST /api/auth/staff/login` - Staff authentication (Admin, Supervisor, Field Officer)
- `POST /api/auth/register` - Citizen self-registration
- `GET /api/auth/me` - Current authenticated user details

### Parcels & GIS
- `GET /api/parcels` - Retrieve all cadastral parcels with GeoJSON boundaries
- `GET /api/parcels/{ulpin}` - Retrieve detailed 360° record by ULPIN
- `GET /api/parcels/search?q={query}` - Search parcels by keyword / survey number
- `GET /api/ai/parcel-risk/{ulpin}` - Algorithmic multi-factor risk assessment
- `POST /api/ai/nl-search` - Natural language query parsing

### Service Requests
- `POST /api/applications` - Submit service application (Citizen)
- `GET /api/applications/citizen` - List citizen's applications
- `GET /api/applications/supervisor` - Department applications queue (Supervisor)
- `GET /api/applications/{id}` - Detailed application dossier
- `POST /api/applications/{id}/assign-officer` - Allocate field officer
- `PUT /api/applications/{id}/status` - Approve or reject application

### Field Inspections
- `GET /api/field/assignments` - Assigned cases for logged-in field officer
- `POST /api/field/verification` - Submit physical survey inspection report
- `GET /api/field/stats` - Inspection metrics

### Administration
- `GET /api/admin/stats` - System-wide governance analytics
- `GET /api/admin/staff` - Officials directory
- `POST /api/admin/staff` - Onboard supervisor or field officer
- `GET /api/admin/departments` - Department catalog
- `GET /api/admin/audit-logs` - Immutable system audit logs

---

## 11. Future Government Integration Roadmap

The LandStack architecture decouples data access through clean service interfaces (`ParcelService`, `AiService`, `GovernmentService`). In a production national rollout, mock data stores can be swapped for:
1. **Bhu-Aadhaar API:** Live national cadastral registry integration.
2. **NGDRS (National Generic Document Registration System):** Real-time deed and encumbrance validation.
3. **CORS (Continuously Operating Reference Stations):** High-precision satellite DGPS synchronization.
4. **DigiLocker Integration:** Direct verification of citizen identity and property sale deeds.
