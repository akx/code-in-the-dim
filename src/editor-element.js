import { indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { EditorView, basicSetup } from "codemirror";
import { css as codemirrorCss } from "@codemirror/lang-css";
import { html as codemirrorHtml } from "@codemirror/lang-html";
import { LitElement, html } from "lit";
import { EditorTheme } from "./editor-theme.js";
import { oneDark } from "@codemirror/theme-one-dark";
import "./editor-controls.js";
import { EDITOR_SNAPSHOT_INTERVAL, EditorManager, keymapCompartment } from "./editor-manager.js";
import { EditorInitialized } from "./events/editor-initialized-event.js";
import { EditorSnapshot } from "./events/editor-snapshot.js";
import { initPowerMode } from "./power-mode.js";

export class EditorElement extends LitElement {
    static get properties() {
        return {
            editor: { type: Object },
        };
    }

    constructor() {
        super();

        this.editor = undefined;

        this.content = `
<style>
    p {
        color: red;
    }
</style>

<div class="delete-me">
    <p>Good luck and have fun!</p>
</div>
`.trim();

        const localStoragedContent = EditorManager.getCode();
        if (localStoragedContent) {
            this.content = localStoragedContent;
        }
    }

    firstUpdated() {
        this.initializeEditor();
    }

    initializeEditor() {
        this.editor = new EditorView({
            doc: this.content,
            extensions: [
                basicSetup,
                keymapCompartment.of(EditorManager.getKeymap().config),
                keymap.of([indentWithTab]),
                codemirrorCss(),
                codemirrorHtml(),
                oneDark,
                initPowerMode(),
            ],
            parent: this.shadowRoot.querySelector("#editor"),
        });

        EditorManager.dispatchEvent(new EditorInitialized(this.editor));

        const sendDraftSnapshot = this.sendCurrentSnapshot.bind(this, "draft");
        this.snapshotInterval = setInterval(sendDraftSnapshot, EDITOR_SNAPSHOT_INTERVAL);
    }

    /**
     * @param mode {'final'|'draft'}
     */
    sendCurrentSnapshot(mode) {
        const content = this.editor.state.doc.toString();
        EditorManager.dispatchEvent(new EditorSnapshot(content, mode));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this.snapshotInterval);
    }

    render() {
        return html`
            <section id="editor"></section>

            <editor-controls></editor-controls>
        `;
    }

    static get styles() {
        return [EditorTheme];
    }
}
