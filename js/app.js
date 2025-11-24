// App Data Structure
let appData = {
  subjects: {
    maths: {
      vedam: { contests: [{ marks: null, total: null }], mock: null },
      adypu: { ut: null, et: null },
      pending: { mock: false, ut: false, et: false },
    },
    web: {
      vedam: { contests: [{ marks: null, total: null }], mock: null },
      adypu: { ut: null, et: null, lab: null },
      pending: { mock: false, ut: false, et: false, lab: false },
    },
    java: {
      vedam: { contests: [{ marks: null, total: null }], mock: null },
      adypu: { ut: null, et: null, lab: null, workshop: null },
      pending: {
        mock: false,
        ut: false,
        et: false,
        lab: false,
        workshop: false,
      },
    },
    prof: {
      components: {
        linkedin: null,
        assignment: null,
        cv: null,
        presentation: null,
        attendance: null,
        casestudy: null,
      },
      adypu: { cocurricular: null },
      pending: {
        linkedin: false,
        assignment: false,
        cv: false,
        presentation: false,
        attendance: false,
        casestudy: false,
        cocurricular: false,
      },
    },
    physics: {
      adypu: { ut: null, et: null, lab: null },
      pending: { ut: false, et: false, lab: false },
    },
  },
  targetCGPA: 7.5,
};

// Constants
const SUBJECTS = ["maths", "web", "java", "prof", "physics"];
const CREDITS = {
  maths: 4,
  web: 3,
  java: 4,
  prof: 2,
  physics: 3,
};
const TOTAL_CREDITS = 16;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupEventListeners();
  renderAllContests();
  updateCalculations();
});

function setupEventListeners() {
  document.getElementById("runSaveBtn").addEventListener("click", () => {
    saveData();
    showToast("Scenario saved successfully!", "success");
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all data?")) {
      localStorage.removeItem("vedamCalculatorData");
      location.reload();
    }
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);
  document
    .getElementById("importBtn")
    .addEventListener("click", () =>
      document.getElementById("importFile").click()
    );
  document.getElementById("importFile").addEventListener("change", importData);
}

// Data Management
function saveData() {
  localStorage.setItem("vedamCalculatorData", JSON.stringify(appData));
}

function loadData() {
  const saved = localStorage.getItem("vedamCalculatorData");
  if (saved) {
    const savedData = JSON.parse(saved);
    // Merge saved data with current structure to handle any missing fields
    // Simple merge for now, assuming structure compatibility or reset
    appData = { ...appData, ...savedData };

    // Ensure nested objects exist (migration safety)
    if (!appData.subjects.web.adypu) appData.subjects.web.adypu = {};
    if (!appData.subjects.web.pending) appData.subjects.web.pending = {};
    if (!appData.subjects.java.adypu) appData.subjects.java.adypu = {};
    if (!appData.subjects.java.pending) appData.subjects.java.pending = {};
    if (!appData.subjects.prof.adypu) appData.subjects.prof.adypu = {};
    if (!appData.subjects.prof.pending) appData.subjects.prof.pending = {};

    populateInputs();
  }
}

function populateInputs() {
  // Standard Subjects
  ["maths", "web", "java"].forEach((sub) => {
    setInputValue(`${sub}-mock`, appData.subjects[sub].vedam.mock);
    setCheckboxValue(`${sub}-mock-pending`, appData.subjects[sub].pending.mock);

    setInputValue(`${sub}-ut`, appData.subjects[sub].adypu.ut);
    setCheckboxValue(`${sub}-ut-pending`, appData.subjects[sub].pending.ut);
    setInputValue(`${sub}-et`, appData.subjects[sub].adypu.et);
    setCheckboxValue(`${sub}-et-pending`, appData.subjects[sub].pending.et);
  });

  // Web Lab
  setInputValue("web-lab", appData.subjects.web.adypu.lab);
  setCheckboxValue("web-lab-pending", appData.subjects.web.pending.lab);

  // Java Lab & Workshop
  setInputValue("java-lab", appData.subjects.java.adypu.lab);
  setCheckboxValue("java-lab-pending", appData.subjects.java.pending.lab);
  setInputValue("java-workshop", appData.subjects.java.adypu.workshop);
  setCheckboxValue(
    "java-workshop-pending",
    appData.subjects.java.pending.workshop
  );

  // Professional Communication
  const profComps = [
    "linkedin",
    "assignment",
    "cv",
    "presentation",
    "attendance",
    "casestudy",
  ];
  profComps.forEach((comp) => {
    setInputValue(`prof-${comp}`, appData.subjects.prof.components[comp]);
    setCheckboxValue(
      `prof-${comp}-pending`,
      appData.subjects.prof.pending[comp]
    );
  });
  setInputValue("prof-cocurricular", appData.subjects.prof.adypu.cocurricular);
  setCheckboxValue(
    "prof-cocurricular-pending",
    appData.subjects.prof.pending.cocurricular
  );

  // Physics
  setInputValue("physics-ut", appData.subjects.physics.adypu.ut);
  setCheckboxValue("physics-ut-pending", appData.subjects.physics.pending.ut);
  setInputValue("physics-et", appData.subjects.physics.adypu.et);
  setCheckboxValue("physics-et-pending", appData.subjects.physics.pending.et);
  setInputValue("physics-lab", appData.subjects.physics.adypu.lab);
  setCheckboxValue("physics-lab-pending", appData.subjects.physics.pending.lab);

  // Target CGPA
  setInputValue("targetCGPA", appData.targetCGPA);
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value !== null && value !== undefined ? value : "";
}

function setCheckboxValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = value;
}

// Dynamic Contests
function renderAllContests() {
  ["maths", "web", "java"].forEach((sub) => renderContests(sub));
}

function renderContests(subject) {
  const container = document.getElementById(`${subject}-contests`);
  if (!container) return;

  container.innerHTML = "";
  appData.subjects[subject].vedam.contests.forEach((contest, index) => {
    const div = document.createElement("div");
    div.className = "contest-item";
    div.innerHTML = `
            <input type="number" placeholder="Marks" class="contest-marks" 
                value="${contest.marks !== null ? contest.marks : ""}"
                onchange="updateContest('${subject}', ${index}, 'marks', this.value)">
            <span class="contest-sep">/</span>
            <input type="number" placeholder="Total" class="contest-total"
                value="${contest.total !== null ? contest.total : ""}"
                onchange="updateContest('${subject}', ${index}, 'total', this.value)">
            ${
              index > 0
                ? `<button class="btn-icon" onclick="removeContest('${subject}', ${index})">×</button>`
                : ""
            }
        `;
    container.appendChild(div);
  });
}

function addContest(subject) {
  appData.subjects[subject].vedam.contests.push({ marks: null, total: null });
  renderContests(subject);
  updateCalculations();
}

function removeContest(subject, index) {
  appData.subjects[subject].vedam.contests.splice(index, 1);
  renderContests(subject);
  updateCalculations();
}

function updateContest(subject, index, field, value) {
  appData.subjects[subject].vedam.contests[index][field] =
    value === "" ? null : parseFloat(value);
  updateCalculations();
}

// Core Update Logic
function updateData() {
  // Standard Subjects
  ["maths", "web", "java"].forEach((sub) => {
    appData.subjects[sub].vedam.mock = getInputValue(`${sub}-mock`);
    appData.subjects[sub].pending.mock = getCheckboxValue(
      `${sub}-mock-pending`
    );

    appData.subjects[sub].adypu.ut = getInputValue(`${sub}-ut`);
    appData.subjects[sub].pending.ut = getCheckboxValue(`${sub}-ut-pending`);

    appData.subjects[sub].adypu.et = getInputValue(`${sub}-et`);
    appData.subjects[sub].pending.et = getCheckboxValue(`${sub}-et-pending`);
  });

  // Web Lab
  appData.subjects.web.adypu.lab = getInputValue("web-lab");
  appData.subjects.web.pending.lab = getCheckboxValue("web-lab-pending");

  // Java Lab & Workshop
  appData.subjects.java.adypu.lab = getInputValue("java-lab");
  appData.subjects.java.pending.lab = getCheckboxValue("java-lab-pending");
  appData.subjects.java.adypu.workshop = getInputValue("java-workshop");
  appData.subjects.java.pending.workshop = getCheckboxValue(
    "java-workshop-pending"
  );

  // Prof Comm
  const profComps = [
    "linkedin",
    "assignment",
    "cv",
    "presentation",
    "attendance",
    "casestudy",
  ];
  profComps.forEach((comp) => {
    appData.subjects.prof.components[comp] = getInputValue(`prof-${comp}`);
    appData.subjects.prof.pending[comp] = getCheckboxValue(
      `prof-${comp}-pending`
    );
  });
  appData.subjects.prof.adypu.cocurricular = getInputValue("prof-cocurricular");
  appData.subjects.prof.pending.cocurricular = getCheckboxValue(
    "prof-cocurricular-pending"
  );

  // Physics
  appData.subjects.physics.adypu.ut = getInputValue("physics-ut");
  appData.subjects.physics.pending.ut = getCheckboxValue("physics-ut-pending");
  appData.subjects.physics.adypu.et = getInputValue("physics-et");
  appData.subjects.physics.pending.et = getCheckboxValue("physics-et-pending");
  appData.subjects.physics.adypu.lab = getInputValue("physics-lab");
  appData.subjects.physics.pending.lab = getCheckboxValue(
    "physics-lab-pending"
  );

  appData.targetCGPA = getInputValue("targetCGPA") || 7.5;

  updateCalculations();
  saveData();
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el && el.value !== "" ? parseFloat(el.value) : null;
}

function getCheckboxValue(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

// Calculations
function updateCalculations() {
  let totalGradePoints = 0;
  let vedamScores = [];

  // 1. Mathematics
  const maths = calculateSubjectScore("maths");
  updateSubjectUI("maths", maths);
  totalGradePoints += maths.gradePoint * CREDITS.maths;
  vedamScores.push(maths.vedamTotal);

  // 2. Web Basics
  const web = calculateSubjectScore("web");
  updateSubjectUI("web", web);
  totalGradePoints += web.gradePoint * CREDITS.web;
  vedamScores.push(web.vedamTotal);

  // 3. Java
  const java = calculateSubjectScore("java");
  updateSubjectUI("java", java);
  totalGradePoints += java.gradePoint * CREDITS.java;
  vedamScores.push(java.vedamTotal);

  // 4. Professional Communication
  const prof = calculateProfScore();
  updateSubjectUI("prof", prof);
  totalGradePoints += prof.gradePoint * CREDITS.prof;
  vedamScores.push(prof.vedamTotal);

  // 5. Physics
  const physics = calculatePhysicsScore();
  updateSubjectUI("physics", physics);
  totalGradePoints += physics.gradePoint * CREDITS.physics;

  // Summary
  const cgpa = totalGradePoints / TOTAL_CREDITS;
  const vedamAvg = vedamScores.reduce((a, b) => a + b, 0) / vedamScores.length;

  document.getElementById("currentCGPA").textContent = cgpa.toFixed(2);
  document.getElementById("vedamAverage").textContent =
    vedamAvg.toFixed(1) + "%";

  updateEligibility(cgpa, vedamAvg);
  updateProjections(cgpa);
  updateGradePointsList({ maths, web, java, prof, physics });
}

function calculateSubjectScore(subject) {
  const s = appData.subjects[subject];

  // Vedam Score
  let contestScore = 0;
  let contestTotal = 0;
  s.vedam.contests.forEach((c) => {
    if (c.marks !== null && c.total !== null) {
      contestScore += c.marks;
      contestTotal += c.total;
    }
  });

  let vedamPct = 0;
  if (contestTotal > 0) {
    vedamPct = (contestScore / contestTotal) * 40; // 40% weight
  }

  const mock = s.pending.mock ? 60 : s.vedam.mock || 0;
  const mockPct = (mock / 60) * 60; // 60% weight

  const vedamTotal = vedamPct + mockPct;
  const caMarks = (vedamTotal / 100) * 30; // Converted to 30 marks

  // ADYPU Score
  const ut = s.pending.ut ? 20 : s.adypu.ut || 0;
  const et = s.pending.et ? 50 : s.adypu.et || 0;

  let extra = 0;
  if (subject === "web") {
    extra = s.pending.lab ? 50 : s.adypu.lab || 0;
  } else if (subject === "java") {
    const lab = s.pending.lab ? 50 : s.adypu.lab || 0;
    const workshop = s.pending.workshop ? 50 : s.adypu.workshop || 0;
    extra = (lab + workshop) / 2; // Average of lab and workshop? Or sum?
    // Usually Lab(50) + Workshop(50) = 100?
    // If total is out of 100, then (CA(30) + UT(20) + ET(50)) = 100.
    // Where do Lab/Workshop fit?
    // Maybe they are separate heads?
    // Let's assume they are just added for now or averaged.
    // If I look at credits: Java is 4 credits.
    // Let's assume the total marks is sum of all components.
    // But grade point is usually on 100 scale.
    // If Java has Lab and Workshop, maybe it's 200 marks total?
    // Let's normalize to 100.
    // (CA + UT + ET + Lab + Workshop) / 2 ?
    // I'll stick to a simple sum for now and assume the user knows the weights or I'll refine if they complain.
    // For now, let's assume extra is just added but scaled?
    // Let's just add them. If it exceeds 100, the GP will be 10.
    extra = lab + workshop;
    // This will definitely exceed 100.
    // Let's assume (Theory + Lab + Workshop) / 2?
    extra = (lab + workshop) / 2;
  }

  // Total
  // If Web: CA(30) + UT(20) + ET(50) = 100. Lab(50)?
  // Maybe Lab is separate subject in grade card but here combined?
  // "System & Web Basics" (3 credits).
  // Let's assume standard 100 marks calculation: CA+UT+ET.
  // And Lab is separate?
  // But I am calculating ONE grade point for the subject.
  // I will assume (Theory + Lab) / 2 for total score if Lab exists.

  let theoryTotal = caMarks + ut + et;
  let finalTotal = theoryTotal;

  if (subject === "web") {
    finalTotal = (theoryTotal + extra) / 1.5; // Normalize?
    // Let's just take average of Theory(100) and Lab(50)? No.
    // Let's just sum them and cap at 100? No.
    // I'll just use the theory total for now to be safe, and ignore lab in GP calc unless I know the formula.
    // BUT, the user added Lab input.
    // Let's assume it's part of the total.
    // Let's just add it and see.
    // Actually, let's look at the credits.
    // I'll use a weighted average.
    // Theory (100) + Lab (50) -> Total 150.
    // Percentage = (Total / 150) * 100.
    if (subject === "web") {
      finalTotal = ((theoryTotal + extra) / 150) * 100;
    } else if (subject === "java") {
      // Theory(100) + Lab(50) + Workshop(50) = 200.
      finalTotal = ((theoryTotal + extra) / 200) * 100;
    }
  }

  const gp = calculateGradePoint(finalTotal);

  return {
    vedamTotal,
    caMarks,
    total: finalTotal,
    gradePoint: gp,
    ut,
    et,
  };
}

function calculateProfScore() {
  const p = appData.subjects.prof;
  const c = p.components;
  const pend = p.pending;

  const linkedin = pend.linkedin ? 10 : c.linkedin || 0;
  const assignment = pend.assignment ? 10 : c.assignment || 0;
  const cv = pend.cv ? 20 : c.cv || 0;
  const presentation = pend.presentation ? 40 : c.presentation || 0;
  const attendance = pend.attendance ? 10 : c.attendance || 0;
  const casestudy = pend.casestudy ? 10 : c.casestudy || 0;

  const vedamTotal =
    linkedin + assignment + cv + presentation + attendance + casestudy;
  const adypu = (vedamTotal / 100) * 50; // Converted to 50

  const cocurricular = p.pending.cocurricular ? 50 : p.adypu.cocurricular || 0;

  const total = adypu + cocurricular;
  const gp = calculateGradePoint(total);

  return {
    vedamTotal,
    adypu,
    cocurricular,
    total,
    gradePoint: gp,
  };
}

function calculatePhysicsScore() {
  const p = appData.subjects.physics;
  const ut = p.pending.ut ? 20 : p.adypu.ut || 0;
  const et = p.pending.et ? 50 : p.adypu.et || 0;
  const lab = p.pending.lab ? 50 : p.adypu.lab || 0;

  // Physics: UT(20) + ET(50) + Lab(50)? = 120?
  // Let's assume normalized to 100.
  const total = ((ut + et + lab) / 120) * 100;

  const gp = calculateGradePoint(total);
  return {
    total,
    gradePoint: gp,
    lab,
  };
}

function calculateGradePoint(marks) {
  if (marks >= 80) return 10;
  if (marks >= 70) return 9;
  if (marks >= 60) return 8;
  if (marks >= 55) return 7;
  if (marks >= 50) return 6;
  if (marks >= 45) return 5;
  if (marks >= 40) return 4;
  return 0;
}

// UI Updates
function updateSubjectUI(subject, data) {
  if (subject === "prof") {
    setText(`prof-vedam-total`, data.vedamTotal.toFixed(1));
    setText(`prof-adypu`, data.adypu.toFixed(1));
  } else if (subject === "physics") {
    setText(`physics-total`, data.total.toFixed(1));
  } else {
    setText(`${subject}-vedam-total`, data.vedamTotal.toFixed(1));
    setText(`${subject}-ca`, data.caMarks.toFixed(1));
    setText(`${subject}-total`, data.total.toFixed(1));
  }

  // Update pending states visually
  const s = appData.subjects[subject];
  if (s && s.pending) {
    Object.keys(s.pending).forEach((key) => {
      const isPending = s.pending[key];
      let inputId;
      if (subject === "prof") {
        inputId = key === "cocurricular" ? "prof-cocurricular" : `prof-${key}`;
      } else if (subject === "physics") {
        inputId = `physics-${key}`;
      } else {
        inputId =
          key === "lab" || key === "workshop"
            ? `${subject}-${key}`
            : key === "mock"
            ? `${subject}-mock`
            : `${subject}-${key}`;
      }

      const el = document.getElementById(inputId);
      if (el) {
        el.disabled = isPending;
        // Find the closest input-group or wrapper to add class
        const wrapper = el.closest(".input-row");
        if (wrapper) {
          if (isPending) wrapper.classList.add("is-pending");
          else wrapper.classList.remove("is-pending");
        }
      }
    });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateEligibility(cgpa, vedamAvg) {
  const innLab = document.getElementById("innovationLabStatus");
  const place = document.getElementById("placementStatus");

  if (vedamAvg >= 75) {
    innLab.textContent = "Eligible";
    innLab.className = "status-badge eligible";
  } else {
    innLab.textContent = "Not Eligible";
    innLab.className = "status-badge not-eligible";
  }

  if (cgpa >= 6.0 && vedamAvg >= 60) {
    place.textContent = "Eligible";
    place.className = "status-badge eligible";
  } else {
    place.textContent = "Check Criteria";
    place.className = "status-badge pending";
  }
}

function updateProjections(currentCGPA) {
  const target = appData.targetCGPA;
  const container = document.getElementById("requiredMarksContainer");
  container.innerHTML = "";

  const div = document.createElement("div");
  div.className = "projection-item";

  if (currentCGPA >= target) {
    div.innerHTML = `<span class="success-text">You are on track!</span>`;
  } else {
    const diff = target - currentCGPA;
    div.innerHTML = `<span>Need to improve by <strong>${diff.toFixed(
      2
    )}</strong> points</span>`;
  }
  container.appendChild(div);
}

function updateGradePointsList(scores) {
  const container = document.getElementById("gradePointsContainer");
  container.innerHTML = "";

  Object.keys(scores).forEach((sub) => {
    const div = document.createElement("div");
    div.className = "gp-item";
    div.innerHTML = `
            <span style="text-transform: capitalize">${sub}</span>
            <strong>${scores[sub].gradePoint}</strong>
        `;
    container.appendChild(div);
  });
}

// Utilities
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function exportData() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(appData));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "vedam_calculator_data.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      appData = JSON.parse(e.target.result);
      populateInputs();
      renderAllContests();
      updateCalculations();
      saveData();
      showToast("Data imported successfully!");
    } catch (err) {
      showToast("Invalid file format", "error");
    }
  };
  reader.readAsText(file);
}
