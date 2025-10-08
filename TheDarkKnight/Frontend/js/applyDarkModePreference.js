// Get dark mode preference from local storage
let darkMode = localStorage.getItem("darkMode");
if (darkMode === null) {
    localStorage.setItem("darkMode", "enabled");
    darkMode = "enabled"
}

// Apply dark mode preference to body
const lightMode = darkMode === "disabled";
if (lightMode) {
    document.body.classList.remove("dark-mode");
} else {
    document.body.classList.add("dark-mode");
}