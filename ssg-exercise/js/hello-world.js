class HelloWorld extends HTMLElement {     // "a new kind of HTML element"
  connectedCallback() {                    // runs automatically when the tag appears on the page
    console.log("Hello World!");           // prints to the console only, the page doesn't change
  }
}
customElements.define("hello-world", HelloWorld);  // teaches the browser: <hello-world> = HelloWorld