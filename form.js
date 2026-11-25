// form.js — progressive enhancement for form-with-js.html
// The form already works with HTML alone. This script only adds:
//   1. specific error messages (Constraint Validation API + setCustomValidity)
//   2. an in-page error list and a character counter
//   3. a history of errors (form_errors) sent with the form as JSON

const form = document.querySelector("#contact-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const commentsInput = document.querySelector("#comments");

const messagesBox = document.querySelector("#form-messages");
const errorList = document.querySelector("#error-list");
const infoArea = document.querySelector("#comments-info");
const charCount = document.querySelector("#char-count");
const charStatus = document.querySelector("#char-status");
const errorsField = document.querySelector("#form-errors");

// Readable names for each field, used in messages
const labels = {
    name: "Name",
    email: "Email",
    comments: "Comments"
};

const fields = [nameInput, emailInput, commentsInput];

// Error history: one entry per invalid field per failed submit attempt
const form_errors = [];

// Fields the user has typed in (we only show errors on blur for these)
const editedFields = new Set();

// Submit-attempt tracking, so each field is recorded once per attempt
let attemptNumber = 0;
let attemptInProgress = false;
let recordedThisAttempt = new Set();

// Character counter settings
const WARNING_THRESHOLD = 100; // warn when 100 or fewer characters are left
let lastCounterState = "";

// ---------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------

// Returns an object describing the problem, or null if the field is fine.
// It only READS .validity, which does not fire "invalid" events.
function findProblem(field) {
    const label = labels[field.id];
    const v = field.validity;

    if (v.valueMissing) {
        return {
            type: "valueMissing",
            message: label + " is required. Please fill it in."
        };
    }
    if (v.typeMismatch) {
        return {
            type: "typeMismatch",
            message: "Email needs an @ and a domain, for example name@example.com."
        };
    }
    if (v.tooShort) {
        const missing = field.minLength - field.value.length;
        return {
            type: "tooShort",
            message: label + " must be at least " + field.minLength +
                " characters. Add " + missing + " more."
        };
    }
    if (v.tooLong) {
        return {
            type: "tooLong",
            message: label + " can be at most " + field.maxLength + " characters."
        };
    }
    return null;
}

// Re-checks one field and updates its custom validity message.
// Clearing first means an old message never blocks a corrected form.
function checkField(field) {
    field.setCustomValidity("");
    const problem = findProblem(field);

    if (problem !== null) {
        field.setCustomValidity(problem.message);
    }
    return problem;
}

// ---------------------------------------------------------------------
// Showing and clearing errors in the page
// ---------------------------------------------------------------------

function errorId(field) {
    return field.id + "-error";
}

function showError(field, problem) {
    let item = document.getElementById(errorId(field));

    if (item === null) {
        item = document.createElement("li");
        item.id = errorId(field);
        errorList.appendChild(item);
    }

    // Only change the text if it is different, so screen readers
    // are not told the same thing twice
    const text = labels[field.id] + ": " + problem.message;
    if (item.textContent !== text) {
        item.textContent = text;
    }

    field.setAttribute("aria-invalid", "true");
    addDescribedBy(field, errorId(field));
}

function clearError(field) {
    const item = document.getElementById(errorId(field));
    if (item !== null) {
        item.remove();
    }
    field.removeAttribute("aria-invalid");
    removeDescribedBy(field, errorId(field));
}

function isErrorShown(field) {
    return document.getElementById(errorId(field)) !== null;
}

// Updates the page for one field: shows the error, or removes it
function updateFeedback(field) {
    const problem = checkField(field);
    if (problem === null) {
        clearError(field);
    } else {
        showError(field, problem);
    }
}

// aria-describedby can hold several ids separated by spaces
function addDescribedBy(field, id) {
    const ids = (field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (!ids.includes(id)) {
        ids.push(id);
        field.setAttribute("aria-describedby", ids.join(" "));
    }
}

function removeDescribedBy(field, id) {
    const ids = (field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    field.setAttribute("aria-describedby", ids.filter(function (x) {
        return x !== id;
    }).join(" "));
}

// ---------------------------------------------------------------------
// Character counter
// ---------------------------------------------------------------------

function updateCounter() {
    const limit = commentsInput.maxLength;
    const remaining = limit - commentsInput.value.length;

    let state = "ok";
    if (remaining <= 0) {
        state = "limit";
    } else if (remaining <= WARNING_THRESHOLD) {
        state = "warning";
    }

    if (state === "limit") {
        charCount.textContent = "⛔ 0 characters remaining.";
    } else if (state === "warning") {
        charCount.textContent = "⚠ " + remaining + " characters remaining.";
    } else {
        charCount.textContent = remaining + " characters remaining.";
    }
    infoArea.dataset.state = state;

    // The live region only speaks when the state changes,
    // not on every keystroke
    if (state !== lastCounterState) {
        if (state === "limit") {
            charStatus.textContent = "You have reached the " + limit +
                "-character limit. You can still send your message.";
        } else if (state === "warning") {
            charStatus.textContent = "Almost at the limit: " + WARNING_THRESHOLD +
                " or fewer characters left.";
        } else {
            charStatus.textContent = "";
        }
        lastCounterState = state;
    }
}

// ---------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------

fields.forEach(function (field) {
    // While typing: keep the custom message current. If an error is
    // already on screen, update or remove it. Don't show new errors
    // mid-typing, and never record history here.
    field.addEventListener("input", function () {
        editedFields.add(field);
        checkField(field);
        if (isErrorShown(field)) {
            updateFeedback(field);
        }
    });

    // Leaving a field the user edited: show its error, if any
    field.addEventListener("blur", function () {
        if (editedFields.has(field)) {
            updateFeedback(field);
        }
    });

    // "invalid" fires for each bad field when the browser blocks a
    // submit (button click OR pressing Enter). We never call
    // checkValidity()/reportValidity(), so every "invalid" event here
    // comes from a submit attempt.
    field.addEventListener("invalid", function () {
        // First invalid event of a new attempt: start a new attempt
        if (!attemptInProgress) {
            attemptInProgress = true;
            attemptNumber = attemptNumber + 1;
            recordedThisAttempt = new Set();

            // All invalid events for one attempt fire together,
            // so the attempt is over once this task finishes
            setTimeout(function () {
                attemptInProgress = false;
            }, 0);
        }

        const problem = checkField(field);
        if (problem === null) {
            return;
        }
        showError(field, problem);

        if (!recordedThisAttempt.has(field.id)) {
            recordedThisAttempt.add(field.id);

            // Record which field and what kind of error,
            // but never what the user typed
            form_errors.push({
                field: field.name,
                error: problem.type,
                message: problem.message,
                attempt: attemptNumber,
                time: new Date().toISOString()
            });
        }
    });
});

commentsInput.addEventListener("input", updateCounter);

// "submit" only fires once every field is valid
form.addEventListener("submit", function () {
    errorsField.value = JSON.stringify(form_errors);
});

// ---------------------------------------------------------------------
// Start up: reveal the JS-only areas, now that they work
// ---------------------------------------------------------------------

messagesBox.hidden = false;
addDescribedBy(commentsInput, "char-count");
fields.forEach(checkField);  // custom messages ready before the first submit
updateCounter();
