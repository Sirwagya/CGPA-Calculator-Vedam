
/**
 * Vedam Merit Score & CGPA Calculator
 *
 * Architecture:
 * - Config: Centralized course definitions and evaluation schemas.
 * - State: Manages application state and localStorage.
 * - Calculator: Pure functions for score and GP generation.
 * - UI: Renders the DOM based on Config and State.
 */

/* =========================================
   1. CONFIGURATION & DATA SCHEMA
   ========================================= */

const CONFIG = {
    defaultTargetCGPA: 7.5,
    // Grading Scale (Marks -> GP)
    gradingScale: [
        { min: 80, gp: 10 },
        { min: 70, gp: 9 },
        { min: 60, gp: 8 },
        { min: 55, gp: 7 },
        { min: 50, gp: 6 },
        { min: 45, gp: 5 },
        { min: 40, gp: 4 },
        { min: 0,  gp: 0 }
    ],
    // Course Definitions
    courses: [
        {
            id: 'maths',
            code: 'E0005A',
            name: 'Mathematics for AI - I',
            credits: 4,
            type: 'vedam', // Contests + Mock -> CA
            components: {
                vedam: { enabled: true, mockMax: 60, weightInTotal: 30 },
                adypu: [
                    { id: 'ut', label: 'Unit Test', max: 20 },
                    { id: 'et', label: 'End Term', max: 50 }
                ]
            }
        },
        {
            id: 'web',
            code: 'E0017A',
            name: 'System & Web Basics',
            credits: 3,
            type: 'hybrid', // Vedam + Theory + Lab
            components: {
                vedam: { enabled: true, mockMax: 60, weightInTotal: 30 },
                adypu: [
                    { id: 'ut', label: 'Unit Test', max: 20 },
                    { id: 'et', label: 'End Term', max: 50 },
                    { id: 'lab', label: 'Lab', max: 50 } // Assumed integrated for now based on old app
                ]
            }
        },
        {
            id: 'java',
            code: 'E0025A',
            name: 'Fundamentals of Programming - Java',
            credits: 4, // Keeping as 4 to match old app, but ideally should be split
            type: 'hybrid',
            components: {
                vedam: { enabled: true, mockMax: 60, weightInTotal: 30 },
                adypu: [
                    { id: 'ut', label: 'Unit Test', max: 20 },
                    { id: 'et', label: 'End Term', max: 50 },
                    { id: 'lab', label: 'Lab (E0025B)', max: 50 },
                    { id: 'workshop', label: 'Workshop (E0033B)', max: 50 }
                ]
            }
        },
        {
            id: 'prof',
            code: 'E0028B',
            name: 'Professional Communication',
            credits: 2,
            type: 'custom',
            components: {
                custom: [
                    { id: 'linkedin', label: 'LinkedIn', max: 10 },
                    { id: 'assignment', label: 'Assignment', max: 10 },
                    { id: 'cv', label: 'CV + Email', max: 20 },
                    { id: 'presentation', label: 'Presentation', max: 40 },
                    { id: 'attendance', label: 'Attendance', max: 10 },
                    { id: 'casestudy', label: 'Case Study', max: 10 }
                ],
                // Prof Comm maps these sum -> 50% weight?
                // Old app: (Sum / 100) * 50.
                // Then adds Co-curricular (50).
                extra: [
                    { id: 'cocurricular', label: 'Co-curricular (E0035B)', max: 50 }
                ]
            }
        },
        {
            id: 'physics',
            code: 'E0018A',
            name: 'General Physics',
            credits: 3,
            type: 'standard',
            components: {
                vedam: { enabled: false },
                adypu: [
                    { id: 'ut', label: 'Unit Test', max: 20 },
                    { id: 'et', label: 'End Term', max: 50 },
                    { id: 'lab', label: 'Lab (E0018B)', max: 50 }
                ]
            }
        }
    ]
};

/* =========================================
   2. STATE MANAGEMENT
   ========================================= */

class AppState {
    constructor() {
        this.data = this.load() || this.getDefaults();
    }

    getDefaults() {
        const subjects = {};
        CONFIG.courses.forEach(c => {
            subjects[c.id] = {
                contests: [], // { marks, total }
                inputs: {},   // { mock: 45, ut: 18 ... }
                pending: {}   // { mock: true, ut: false ... }
            };
        });
        return {
            subjects,
            targetCGPA: CONFIG.defaultTargetCGPA
        };
    }

    load() {
        const json = localStorage.getItem('vedamCalculatorData');
        if (!json) return null;
        try {
            const parsed = JSON.parse(json);
            // Migrate or validate if needed. For now, simple merge.
            const defaults = this.getDefaults();
            // Deep merge basics
            Object.keys(defaults.subjects).forEach(key => {
                if (!parsed.subjects[key]) parsed.subjects[key] = defaults.subjects[key];
            });
            return parsed;
        } catch (e) {
            console.error("Failed to load data", e);
            return null;
        }
    }

    save() {
        localStorage.setItem('vedamCalculatorData', JSON.stringify(this.data));
    }

    reset() {
        this.data = this.getDefaults();
        this.save();
    }

    getSubject(id) {
        return this.data.subjects[id];
    }

    updateInput(courseId, inputId, value) {
        this.data.subjects[courseId].inputs[inputId] = value === '' ? null : parseFloat(value);
        this.save();
    }

    togglePending(courseId, inputId, isPending) {
        this.data.subjects[courseId].pending[inputId] = isPending;
        this.save();
    }

    addContest(courseId) {
        this.data.subjects[courseId].contests.push({ marks: null, total: null });
        this.save();
    }

    removeContest(courseId, index) {
        this.data.subjects[courseId].contests.splice(index, 1);
        this.save();
    }

    updateContest(courseId, index, field, value) {
        this.data.subjects[courseId].contests[index][field] = value === '' ? null : parseFloat(value);
        this.save();
    }
}

const store = new AppState();

/* =========================================
   3. CALCULATOR ENGINE
   ========================================= */

const Calculator = {
    calculateAll: () => {
        let totalGP = 0;
        let totalCredits = 0;
        let vedamSum = 0;
        let vedamCount = 0;

        const results = {};

        CONFIG.courses.forEach(course => {
            const subData = store.getSubject(course.id);
            const result = Calculator.calculateCourse(course, subData);

            results[course.id] = result;

            totalGP += result.gp * course.credits;
            totalCredits += course.credits;

            if (result.vedamPct !== null) {
                vedamSum += result.vedamPct;
                vedamCount++;
            }
        });

        const cgpa = totalCredits > 0 ? totalGP / totalCredits : 0;
        const vedamAvg = vedamCount > 0 ? vedamSum / vedamCount : 0;

        return { results, cgpa, vedamAvg };
    },

    calculateCourse: (course, data) => {
        // 1. Vedam Score (if applicable)
        let vedamScore = 0; // Final scaled marks from Vedam
        let vedamPct = null; // 0-100 representation

        if (course.components.vedam && course.components.vedam.enabled) {
            const { contests } = data;
            const { mockMax, weightInTotal } = course.components.vedam;

            // Contests (40% weight of Vedam)
            let cMarks = 0, cTotal = 0;
            contests.forEach(c => {
                if (c.marks != null && c.total != null) {
                    cMarks += c.marks;
                    cTotal += c.total;
                }
            });
            const contestPart = cTotal > 0 ? (cMarks / cTotal) * 40 : 0;

            // Mock (60% weight of Vedam)
            let mockVal = data.inputs.mock;
            if (data.pending.mock) mockVal = mockMax; // Pending = Max
            mockVal = mockVal || 0;

            const mockPart = (mockVal / mockMax) * 60;

            vedamPct = contestPart + mockPart; // Out of 100
            vedamScore = (vedamPct / 100) * weightInTotal; // Scaled to CA (e.g. 30)
        }

        // 2. ADYPU/Standard Components
        let standardTotal = 0;
        let maxStandard = 0;

        // Helper to get score
        const getScore = (id, max) => {
            if (data.pending[id]) return max;
            return data.inputs[id] || 0;
        };

        if (course.type === 'custom') {
            // Prof Comm Special Logic
            // Sum of custom components
            let customSum = 0;
            let customMax = 0; // Should be 100 based on inputs

            course.components.custom.forEach(comp => {
                customSum += getScore(comp.id, comp.max);
                customMax += comp.max;
            });

            // Scale to 50 marks ADYPU
            const adypuPart = (customSum / customMax) * 50;

            // Co-curricular
            const cocurr = getScore('cocurricular', 50);

            standardTotal = adypuPart + cocurr;
            maxStandard = 100; // 50 + 50

            // Hack for vedamPct on Prof Comm to show something?
            // Old app showed "Vedam Total" as the sum of components.
            vedamPct = customSum;

        } else {
            // Standard + Hybrid
            if (course.components.adypu) {
                course.components.adypu.forEach(comp => {
                    standardTotal += getScore(comp.id, comp.max);
                    maxStandard += comp.max;
                });
            }

            // Add Vedam Score
            if (course.components.vedam && course.components.vedam.enabled) {
                standardTotal += vedamScore;
                maxStandard += course.components.vedam.weightInTotal;
            }
        }

        // Normalize Total to 100 for GP Calculation
        // If maxStandard is 100 (Maths: 30+20+50), no scaling needed.
        // If maxStandard is 150 (Web: 30+20+50+50), scale to 100.
        // If maxStandard is 200 (Java: 30+20+50+50+50), scale to 100.

        const finalTotal = maxStandard > 0 ? (standardTotal / maxStandard) * 100 : 0;
        const gp = Calculator.getGP(finalTotal);

        return {
            total: finalTotal,
            gp,
            vedamPct,
            rawTotal: standardTotal,
            maxTotal: maxStandard
        };
    },

    getGP: (marks) => {
        for (let rule of CONFIG.gradingScale) {
            if (marks >= rule.min) return rule.gp;
        }
        return 0;
    }
};

/* =========================================
   4. UI RENDERING & INTERACTION
   ========================================= */

const UI = {
    init: () => {
        UI.renderSubjects();
        UI.updateDashboard();

        // Global Listeners
        document.getElementById('targetCGPA').value = store.data.targetCGPA;
        document.getElementById('targetCGPA').addEventListener('input', (e) => {
            store.data.targetCGPA = parseFloat(e.target.value);
            store.save();
            UI.updateDashboard();
        });
    },

    renderSubjects: () => {
        const container = document.getElementById('subjectsContainer');
        container.innerHTML = '';

        CONFIG.courses.forEach(course => {
            const card = document.createElement('section');
            card.className = 'card subject-card';
            card.id = `card-${course.id}`;

            // Header
            let headerHtml = `
                <div class="card-header">
                    <div class="header-info">
                        <h2>${course.name}</h2>
                        <span class="badge">${course.code}</span>
                    </div>
                    <div class="header-stats">
                        ${ course.components.vedam && course.components.vedam.enabled ? `
                        <div class="stat-pill">
                            <span class="label">Vedam</span>
                            <span class="value" id="stat-vedam-${course.id}">-</span>
                        </div>` : '' }
                        <div class="stat-pill">
                            <span class="label">Total</span>
                            <span class="value" id="stat-total-${course.id}">-</span>
                        </div>
                    </div>
                </div>
            `;

            // Body
            let bodyHtml = `<div class="card-body"><div class="split-view">`;

            // Left Column: Vedam / Custom
            if (course.type === 'custom') {
                 bodyHtml += `<div class="split-section full-width"><h3>Components</h3><div class="grid-3">`;
                 course.components.custom.forEach(comp => {
                     bodyHtml += UI.createInputGroup(course.id, comp.id, comp.label, comp.max);
                 });
                 bodyHtml += `</div>`;
                 // Extra (Co-curricular)
                 if (course.components.extra) {
                     bodyHtml += `<div class="mt-4">`;
                     course.components.extra.forEach(comp => {
                         bodyHtml += UI.createInputGroup(course.id, comp.id, comp.label, comp.max);
                     });
                     bodyHtml += `</div>`;
                 }
                 bodyHtml += `</div>`;
            }
            else {
                // Standard Layout
                // Left: Vedam
                if (course.components.vedam && course.components.vedam.enabled) {
                    bodyHtml += `
                    <div class="split-section">
                        <h3>Vedam Score</h3>
                        <div id="contests-${course.id}" class="contest-list"></div>
                        <button class="btn btn-sm btn-text" onclick="Actions.addContest('${course.id}')">+ Add Contest</button>

                        <div class="input-group mt-4">
                            <label>Mock Interview <span class="sub-label">/${course.components.vedam.mockMax}</span></label>
                            ${UI.createInputRaw(course.id, 'mock', course.components.vedam.mockMax)}
                        </div>
                    </div>
                    <div class="split-divider"></div>
                    `;
                }

                // Right: ADYPU
                bodyHtml += `<div class="split-section ${course.components.vedam && course.components.vedam.enabled ? '' : 'full-width'}">
                    <h3>ADYPU Marks</h3>`;

                // Grid wrapper if full width
                if (!course.components.vedam || !course.components.vedam.enabled) {
                     bodyHtml += `<div class="grid-2">`;
                }

                if (course.components.adypu) {
                    course.components.adypu.forEach(comp => {
                        bodyHtml += UI.createInputGroup(course.id, comp.id, comp.label, comp.max);
                    });
                }

                if (!course.components.vedam || !course.components.vedam.enabled) {
                     bodyHtml += `</div>`;
                }

                // CA Info
                if (course.components.vedam && course.components.vedam.enabled) {
                    bodyHtml += `
                    <div class="info-row mt-4">
                        <span>CA (from Vedam)</span>
                        <strong><span id="stat-ca-${course.id}">-</span> / ${course.components.vedam.weightInTotal}</strong>
                    </div>`;
                }

                bodyHtml += `</div>`;
            }

            bodyHtml += `</div></div>`; // End split-view, card-body

            card.innerHTML = headerHtml + bodyHtml;
            container.appendChild(card);

            // Render Contests
            UI.renderContests(course.id);
        });
    },

    createInputGroup: (courseId, inputId, label, max) => {
        return `
        <div class="input-group">
            <label>${label} <span class="sub-label">/${max}</span></label>
            ${UI.createInputRaw(courseId, inputId, max)}
        </div>`;
    },

    createInputRaw: (courseId, inputId, max) => {
        const subData = store.getSubject(courseId);
        const val = subData.inputs[inputId];
        const isPending = subData.pending[inputId];

        return `
        <div class="input-row ${isPending ? 'is-pending' : ''}">
            <input type="number" id="in-${courseId}-${inputId}"
                placeholder="0" min="0" max="${max}"
                value="${val !== null && val !== undefined ? val : ''}"
                ${isPending ? 'disabled' : ''}
                onchange="Actions.updateInput('${courseId}', '${inputId}', this.value)">
            <label class="checkbox-btn ${max <= 10 ? 'icon-only' : ''}" title="Pending">
                <input type="checkbox" id="chk-${courseId}-${inputId}"
                    ${isPending ? 'checked' : ''}
                    onchange="Actions.togglePending('${courseId}', '${inputId}', this.checked)">
                <span>${max <= 10 ? 'P' : 'Pending'}</span>
            </label>
        </div>`;
    },

    renderContests: (courseId) => {
        const container = document.getElementById(`contests-${courseId}`);
        if (!container) return;

        const contests = store.getSubject(courseId).contests;
        container.innerHTML = '';

        contests.forEach((c, idx) => {
            const div = document.createElement('div');
            div.className = 'contest-item';
            div.innerHTML = `
                <input type="number" placeholder="Marks" value="${c.marks !== null ? c.marks : ''}"
                    onchange="Actions.updateContest('${courseId}', ${idx}, 'marks', this.value)">
                <span class="contest-sep">/</span>
                <input type="number" placeholder="Total" value="${c.total !== null ? c.total : ''}"
                    onchange="Actions.updateContest('${courseId}', ${idx}, 'total', this.value)">
                <button class="btn-icon" onclick="Actions.removeContest('${courseId}', ${idx})">×</button>
            `;
            container.appendChild(div);
        });
    },

    updateDashboard: () => {
        const { results, cgpa, vedamAvg } = Calculator.calculateAll();

        // Update Cards
        Object.keys(results).forEach(courseId => {
            const res = results[courseId];
            // Total
            const totalEl = document.getElementById(`stat-total-${courseId}`);
            if (totalEl) totalEl.textContent = res.total.toFixed(1);

            // Vedam
            const vedamEl = document.getElementById(`stat-vedam-${courseId}`);
            if (vedamEl && res.vedamPct !== null) vedamEl.textContent = res.vedamPct.toFixed(1);

            // CA (if standard)
            const caEl = document.getElementById(`stat-ca-${courseId}`);
            // Calculate CA part from vedam Score (scaled)
            // CA = res.rawTotal - ADYPU parts.
            // Easier: Re-calculate or just store it in result.
            // Let's infer: Vedam Score component.
            // Actually, I can just use the vedamPct and config weight.
            const course = CONFIG.courses.find(c => c.id === courseId);
            if (caEl && course.components.vedam) {
                 const ca = (res.vedamPct / 100) * course.components.vedam.weightInTotal;
                 caEl.textContent = ca.toFixed(1);
            }
        });

        // Update Sidebar
        document.getElementById('currentCGPA').textContent = cgpa.toFixed(2);
        document.getElementById('vedamAverage').textContent = vedamAvg.toFixed(1) + '%';

        UI.updateEligibility(cgpa, vedamAvg);
        UI.updateProjections(cgpa);
        UI.updateGPList(results);
    },

    updateEligibility: (cgpa, vedamAvg) => {
        const innLab = document.getElementById('innovationLabStatus');
        const place = document.getElementById('placementStatus');

        // Logic
        const innEligible = vedamAvg >= 75;
        const placeEligible = cgpa >= 6.0 && vedamAvg >= 60;

        innLab.textContent = innEligible ? 'Eligible' : 'Not Eligible';
        innLab.className = `status-badge ${innEligible ? 'eligible' : 'not-eligible'}`;

        place.textContent = placeEligible ? 'Eligible' : 'Check Criteria';
        place.className = `status-badge ${placeEligible ? 'eligible' : 'pending'}`;
    },

    updateProjections: (currentCGPA) => {
        const target = store.data.targetCGPA;
        const container = document.getElementById('requiredMarksContainer');
        container.innerHTML = '';

        const div = document.createElement('div');
        div.className = 'projection-item';

        if (currentCGPA >= target) {
            div.innerHTML = `<span class="success-text">On Track!</span>`;
        } else {
            const diff = target - currentCGPA;
            div.innerHTML = `<span>Improve by <strong>${diff.toFixed(2)}</strong> points</span>`;
        }
        container.appendChild(div);
    },

    updateGPList: (results) => {
        const container = document.getElementById('gradePointsContainer');
        container.innerHTML = '';

        CONFIG.courses.forEach(c => {
            const r = results[c.id];
            const div = document.createElement('div');
            div.className = 'gp-item';
            div.innerHTML = `
                <span>${c.name}</span>
                <strong>${r.gp}</strong>
            `;
            container.appendChild(div);
        });
    }
};

/* =========================================
   5. ACTIONS (Controller)
   ========================================= */

const Actions = {
    updateInput: (cId, iId, val) => {
        store.updateInput(cId, iId, val);
        UI.updateDashboard();
    },
    togglePending: (cId, iId, checked) => {
        store.togglePending(cId, iId, checked);
        // Update UI State for Input immediately
        const input = document.getElementById(`in-${cId}-${iId}`);
        const wrapper = input.closest('.input-row');

        if (checked) {
            input.disabled = true;
            wrapper.classList.add('is-pending');
        } else {
            input.disabled = false;
            wrapper.classList.remove('is-pending');
        }
        UI.updateDashboard();
    },
    addContest: (cId) => {
        store.addContest(cId);
        UI.renderContests(cId);
        UI.updateDashboard();
    },
    removeContest: (cId, idx) => {
        store.removeContest(cId, idx);
        UI.renderContests(cId);
        UI.updateDashboard();
    },
    updateContest: (cId, idx, field, val) => {
        store.updateContest(cId, idx, field, val);
        UI.updateDashboard();
    },
    exportData: () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.data));
        const node = document.createElement('a');
        node.setAttribute("href", dataStr);
        node.setAttribute("download", "vedam_data.json");
        document.body.appendChild(node);
        node.click();
        node.remove();
    },
    importData: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target.result);
                store.data = json;
                // Ideally validate here
                store.save();
                location.reload(); // Easiest way to re-render everything
            } catch (err) {
                alert("Invalid JSON");
            }
        };
        reader.readAsText(file);
    },
    reset: () => {
        if(confirm("Reset all data?")) {
            store.reset();
            location.reload();
        }
    },
    save: () => {
        store.save();
        // Toast
        const t = document.createElement('div');
        t.className = 'toast success';
        t.textContent = 'Saved successfully';
        document.getElementById('toastContainer').appendChild(t);
        setTimeout(() => t.remove(), 2000);
    }
};

// Bind Global Actions
window.Actions = Actions;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    UI.init();

    document.getElementById('runSaveBtn').addEventListener('click', Actions.save);
    document.getElementById('resetBtn').addEventListener('click', Actions.reset);
    document.getElementById('exportBtn').addEventListener('click', Actions.exportData);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', Actions.importData);
});
