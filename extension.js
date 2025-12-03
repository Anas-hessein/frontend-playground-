let vscode = require("vscode")
const JSZip = require("jszip")
const fs = require("fs")
const path = require("path")

function activate(context) {

    let cmd = vscode.commands.registerCommand("playground.open", () => {

        let panel = vscode.window.createWebviewPanel(
            "playground",
            "Frountend Playground",
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        )

        panel.webview.html = getHtml(panel.webview, context)

        panel.webview.onDidReceiveMessage((msg) => {

            if(msg.type === "run") {
                panel.webview.postMessage({
                    type: "preview",
                    html: msg.html,
                    css: msg.css,
                    js: msg.js,
                    libs: msg.libs
                })
            }
            if (msg.type === "export") {
                exportProjectAsZip(context, msg)
            }
            if (msg.type === "import") {
                importProject(panel)
            }
        })
    })

    context.subscriptions.push(cmd)
}

exports.activate = activate

async function exportProjectAsZip(context, data) {

    let zip = new JSZip()

    zip.file("index.html", data.html)
    zip.file("style.css", data.css)
    zip.file("script.js", data.js)

    let zipBlob = await zip.generateAsync({ type: "nodebuffer"})

    let uri = await vscode.window.showSaveDialog({  
        saveLabel: "Save Project As ZIP"
    })

    if (!uri) return

    fs.writeFileSync(uri.fsPath, zipBlob) 

    vscode.window.showInformationMessage("Project exported successfully!")
}

async function importProject(panel) {

    let uri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
            'ZIP files': ['zip']
        },
        openLabel: "Select ZIP file"
    })

    if (!uri || uri.length === 0) return

    let data = fs.readFileSync(uri[0].fsPath)

    let zip = await JSZip.loadAsync(data)

    let html = ""
    let css = ""
    let js = ""

    if (zip.files["index.html"]) {
        html = await zip.files["index.html"].async("string")
    }

    if (zip.files["style.css"]) {
        css = await zip.files["style.css"].async("string") 
    }

    if (zip.files["script.js"]) {
        js = await zip.files["script.js"].async("string")
    }

    panel.webview.postMessage({
        type: "imported",
        html: html,
        css: css,
        js: js
    })

    vscode.window.showInformationMessage("Project Imported Successfully!")
}

function getHtml(webview,context) {
    let scriptPath = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "webview", "main.js"))
    );
    let cssPath = webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, "webview", "style.css"))
    );

    return `
    <!DOCTYPE html>
    <htlm>
    <head>
        <link rel="stylesheet" href="${cssPath}">
    </head>
    
    <body>
        <div class="container">
            <div class="left-panel">
                <div class="editor-container">
                    <div class="tabs">
                        <button class="tab active" data-tab="html">HTML</button>
                        <button class="tab" data-tab="css">CSS</button>
                        <button class="tab" data-tab="js">JS</button>
                        <button id="exportBtn">Export ZIP</button>
                        <button id="importBtn">Import ZIP</button>
                    </div>

                    <div class="libs">
                        <button class= "lib-btn" data-lib="tailwind">Tailwind css</button>
                    </div>

                    <textarea id="editor"></textarea>
                
                </div>

                <div class="console-container">
                    <h3> Console </h3>
                    <div id="console" style="background:#1e1e1e;color:white;height:100px;overflow:auto;padding:5px;"></div>
                </div>
                
                <div class="preview-container">
                    <iframe id="preview"></iframe>
            </div>
            </div>
        </div>
        
        <script src="${scriptPath}"></script>
        
    </body>
    </html>
    `;
}


