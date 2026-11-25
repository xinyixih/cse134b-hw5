const myFacts = [
    "I like the smell of underground parking lot or a painted hallway",
    "I’ve slept on the street in dtla for a whole night",
    "I’m from wuhan but I’ve never caught covid"
];

class FunFacts extends HTMLElement {
    static observedAttributes = ["compact"];

    connectedCallback() {
        console.log("fun-facts is on the page");

        const heading = document.createElement("h2");
        heading.id = "facts-heading";
        heading.textContent = "Fun Facts";
        this.appendChild(heading);
        
        this.index = 0;

        this.factText = document.createElement("p");
        this.appendChild(this.factText);

        this.detail = document.createElement("p");
        this.detail.textContent = "About Xinyi";
        this.appendChild(this.detail);

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next fact about me";
        nextButton.addEventListener("click", () => {
            this.index = (this.index + 1) % myFacts.length;
            this.render();
        });
        this.appendChild(nextButton);

        // Second button
        this.surpriseButton = document.createElement("button");
        this.surpriseButton.type = "button";
        this.surpriseButton.textContent = "Surprise me";
        this.surpriseButton.addEventListener("click", () => this.loadRandomFact());
        this.appendChild(this.surpriseButton);

        this.status = document.createElement("p");
        this.status.setAttribute("role", "status");
        this.appendChild(this.status);

        this.render();
    }

    render() {
        this.factText.textContent = myFacts[this.index];
        this.status.textContent = `Fact ${this.index + 1} of ${myFacts.length}`;
        this.detail.textContent = "About Xinyi";
    }

    async loadRandomFact() {
        this.surpriseButton.disabled = true;               // stop double-clicks while waiting
        this.status.textContent = "Loading a random fact…";

        try {
            const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
            if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
            }

            const data = await response.json();
            if (typeof data?.text !== "string") {
            throw new Error("Expected text in the response.");
            }

            this.factText.textContent = data.text;           // textContent = safe, no HTML runs
            this.detail.textContent = "Random fact from the web";
            this.status.textContent = "Random fact loaded.";
        } catch (error) {
            console.error("Could not load a fact.", error);
            this.status.textContent = "Couldn't load a fact. Check your connection and press Surprise me to try again.";
        } finally {
            this.surpriseButton.disabled = false;            // button comes back after success OR failure
        }
    }

    attributeChangedCallback() {
        if (this.detail) {
            this.detail.hidden = this.hasAttribute("compact");
        }
    }
}
customElements.define("fun-facts", FunFacts);

const MODE_KEY = "hw5-fun-facts-mode";
const toggle = document.querySelector("#compact-toggle");
const panel = document.querySelector("fun-facts");

// Apply a mode
function applyMode(mode) {
    panel.toggleAttribute("compact", mode === "compact");   // true = add, false = remove
    toggle.textContent = mode === "compact" ? "Expanded view" : "Compact view";
}

// Read the saved
function readMode() {
    try {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved === "compact" || saved === "expanded") {
            return saved;
        }
    } catch (error) {
        console.warn("Could not read the saved mode.", error);
    }
    return "expanded";
}

function saveMode(mode) {
    try {
        localStorage.setItem(MODE_KEY, mode);
    } catch (error) {
        console.warn("Could not save the mode.", error);
    }
}

applyMode(readMode());
toggle.hidden = false;

toggle.addEventListener("click", () => {
    const next = panel.hasAttribute("compact") ? "expanded" : "compact";
    applyMode(next);
    saveMode(next);
});