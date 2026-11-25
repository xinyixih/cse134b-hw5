// theme.js — light/dark theme switch with a saved preference.
// Loaded in <head> WITHOUT defer so the saved theme is applied before the
// page is drawn (no flash of the wrong theme). The button is wired up once
// the HTML has loaded.
//
// Default is the site's dark theme. We deliberately don't follow the
// computer's prefers-color-scheme: the user picks the theme on this site.

const THEME_KEY = "theme";
const THEMES = ["dark", "light"];

// Reading storage can throw (blocked cookies, privacy modes, etc.)
function readSavedTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (THEMES.includes(saved)) {
            return saved;
        }
    } catch (error) {
        console.warn("The saved theme could not be read.", error);
    }
    return "dark";
}

// Writing storage can throw too. The theme is applied separately,
// so switching still works on this page even if saving fails.
function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("The theme preference could not be saved.", error);
    }
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

let currentTheme = readSavedTheme();
applyTheme(currentTheme);

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector("#theme-toggle");
    if (toggle === null) {
        return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // The label says what pressing the button will do
    function updateLabel() {
        const other = currentTheme === "dark" ? "light" : "dark";
        toggle.textContent = "Switch to " + other + " theme";
    }

    function setTheme(theme) {
        currentTheme = theme;
        applyTheme(theme);   // apply first...
        saveTheme(theme);    // ...then try to save
        updateLabel();
    }

    toggle.addEventListener("click", function () {
        const next = currentTheme === "dark" ? "light" : "dark";

        // View Transition API: cross-fade between the old and new theme.
        // Without support, or with reduced motion, just switch instantly.
        if (!document.startViewTransition || reduceMotion.matches) {
            setTheme(next);
            return;
        }
        document.startViewTransition(function () {
            setTheme(next);
        });
    });

    updateLabel();
    toggle.hidden = false;   // only show the button once it works
});
