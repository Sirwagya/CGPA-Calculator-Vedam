# Vedam Merit Score & CGPA Calculator

> **Status Notice:** This calculator is mid-refactor and still under verification. Do **not** rely on the numbers for official submissions yet—the logic is evolving and needs attentive review each time the Vedam rules or ADYPU rubrics change.

## 1. Overview

This project is an offline-first dashboard (open `index.html`) that lets Vedam students:
- capture contest, mock, UT, ET, and CA marks across subjects,
- view ADYPU card totals that mirror the university grade sheets,
- estimate CGPA + eligibility + required marks targets,
- persist multiple scenarios in `localStorage` or export/import JSON snapshots.

## 2. Current Scope & Limitations

- Semester coverage: **First semester** structure only.
- Data fidelity: depends entirely on user inputs; no guard rails for invalid totals yet.
- Logic validation: edge cases are tracked in `AUDIT-REPORT.md`, but manual QA is still required after each code change.
- **Action required:** Re-run the dry-run checklist whenever Vedam releases new scaling rules or credit distributions.

## 3. Subject Breakdown

| Area | Components | Max Marks | Notes |
|------|------------|-----------|-------|
| Mathematics for AI – I (E0005A) | UT (20) + ET (50) + CA (30) | 100 | UT+ET combined max stays **70**, CA adds remaining 30 |
| System & Web Basics (E00017A) | UT (20) + ET (50) | 70 | Lab (E00017B) derives from Vedam score × 50 |
| Fundamentals of Programming – Java (E0025A) | UT (20) + ET (50) | 70 | Lab + Workshop each mirror Vedam × 50 |
| Professional Communication (E0028B) | LinkedIn, Assignment, CV, Presentation, Attendance, Case Study | 100 | Feeds both Prof Comm (50) and Co-curricular (50) ADYPU papers |
| General Physics (E0018A) | UT (20) + ET (50) | 70 | Lab (E0018B) mirrors Prof Comm Vedam × 50 |

All UT/ET pairs default to max **70** even if only one component is known; missing parts are scaled, never assumed zero unless both are pending.

## 4. Calculation Pipeline

1. **Vedam contests** – Each contest is scaled to /50, aggregated, then:
   - scaled to /40 if mock data exists,
   - or scaled to /100 when the mock is still pending.
2. **Vedam total** – Contest slice + mock slice = 100.
3. **ADYPU cards** – Subject-specific mappers convert Vedam to internal components (see table above).
4. **CGPA engine** – Uses credit-weighted grade points with totals fixed at:
   - Maths 100, Web/Java/Physics 70, labs/workshop/Prof Comm/Co-curricular 50 each.
5. **Required marks helper** – Looks at pending assessments, spreads the remaining grade-point deficit across pending credits, and caps required marks to real maxima.

## 5. Pending Logic Highlights

- Maths scaling:
  - UT-only known → `(UT/20) × 70`, then CA added separately.
  - ET-only known → `(ET/50) × 70`.
  - Both pending → 0 until data arrives; required-marks calculator shows proportional targets.
- Web/Java/Physics behave the same as Maths UT/ET **but without** the extra 30 CA block.
- Mock interviews directly influence Vedam-derived CA/Lab/Workshop marks; when pending, the calculator assumes the contest slice is out of 100 and indicates the mock score needed to hit target CGPA.

## 6. Using the Tool

1. Open `index.html` (double-click or via a local HTTP server).
2. Enter contest rows for Maths/Web/Java:
   - Use actual raw totals (e.g., 73/120).
   - Add/remove rows with the provided buttons.
3. Enter mock scores (0–60) or toggle “Pending”.
4. Fill UT/ET inputs per subject and toggle “Pending” where applicable.
5. Scroll to the right-hand column to view:
   - Vedam averages,
   - CGPA snapshot,
   - Eligibility badges,
   - Required marks breakdown,
   - ADYPU grade-point cards.

Remember to hit **Run / Save Scenario** after major edits to dump a timestamped JSON export.

## 7. Data Persistence & Portability

- **Auto-save:** every change writes to `localStorage` under `vedamCGPA`.
- **Run / Save Scenario:** recalculates everything and downloads a JSON snapshot (timestamp embedded).
- **Export / Import:** manual control for backing up or restoring state between browsers/machines.
- **Reset:** wipes storage and UI—use cautiously; no undo.

## 8. Required Marks Calculator Details

- Works per credit bucket and averages the remaining grade-point gap.
- Guards against impossible targets by clamping to actual maxima (UT ≤ 20, ET ≤ 50, mocks ≤ 60).
- Displays warnings if required marks push beyond realistic ranges.
- When both UT and ET are pending for Maths, the helper now shares the 70-mark budget proportionally (20 for UT, 50 for ET) instead of over-allocating.

## 9. Testing / Dry-Run Expectations

See `AUDIT-REPORT.md` for the full checklist. Minimum scenarios to re-test after changes:
- Maths: UT present + ET pending, ET present + UT pending, both pending, CA-only.
- Web/Java/Physics: UT-only, ET-only, both available.
- Mock pending vs. available for each contest-based subject.
- Required marks when only mocks are pending.
- Import/export round-trip with partial data.

## 10. Known Gaps & Next Steps

- No automated tests yet—manual dry runs are mandatory.
- Input validation is minimal; invalid totals silently corrupt results.
- UI still lacks indicators for inconsistent states (e.g., entering > max marks).
- Future work: multi-semester support, automated regression suite, better accessibility, richer analytics.

## 11. Release Log

| Version | Highlights |
|---------|-----------|
| 2.2 | Maths UT/ET scaling fixed to 70, ADYPU cards reuse helper logic, required marks rewritten to respect real maxima, subject maxima centralized. |

> **Reminder:** Even though v2.2 patches major scaling bugs, the project is still a work-in-progress. Validate every outcome against official Vedam documentation before sharing results.
