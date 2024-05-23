import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm";
import Note from "reveal.js/plugin/notes/notes.esm";
import Hightlight from "reveal.js/plugin/highlight/highlight.esm";

document.addEventListener("DOMContentLoaded", () => {
    Reveal.initialize({
        hash: true,
		autoPlayMedia: true,
        plugins: [Markdown, Note, Hightlight],
    });
});
