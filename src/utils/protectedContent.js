// Single source of truth for which notes require an authenticated account.
// Used by Files.jsx (to gate folders/files) and Subjects.jsx (to decide
// whether a logged-out click can be answered locally without a network
// round-trip). Keep the two in sync by defining the rules only here.

export const PROTECTED_KEYWORDS = [
  "important-answers",
  "important-questions",
  "important answers",
  "important questions",
  "answers",
  "internal-assessments",
  "manual",
  "lab-experiment",
  "lab-experiments",
];

const LAB_SUBJECTS_SEM4 = ["dbms-lab", "os-lab", "web-tech-lab"];
const LAB_SUBJECTS_SEM5 = ["aisc-lab", "se-lab", "dwm-lab", "cn-lab", "wml-lab"];

export const isProtectedFile = (fileName = "") => {
  const lower = fileName.toLowerCase();
  return PROTECTED_KEYWORDS.some((kw) => lower.includes(kw));
};

// Mirrors the folder-gating rules previously inlined in Files.jsx: a folder
// is protected when its name matches a protected keyword, when it is a known
// lab subject folder, or when it is a lab-experiments parent folder.
export const isProtectedFolder = (subject = "", subSubject = null) => {
  const folderName = subSubject || subject;
  const isLabSubject =
    (subject === "lab-experiments" && LAB_SUBJECTS_SEM4.includes((subSubject || "").toLowerCase())) ||
    (subject === "lab-experiment" && LAB_SUBJECTS_SEM5.includes((subSubject || "").toLowerCase()));
  const isLabFolder = ["lab-experiments", "lab-experiment"].includes(subject) && !subSubject;
  return isProtectedFile(folderName) || isLabSubject || isLabFolder;
};
