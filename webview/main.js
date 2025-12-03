const vscode = acquireVsCodeApi()


let htmlCode = "<h1> Hello Hackclubber </h1>"
let cssCode = "h1 { font-family: sans-serif; }"
let jsCode = "console.log('Hello Hackclubber')"
let jsxCode = "const root = ReactDOM.createRoot(document.getElementById('root')); \nroot. render(<h1> Hello JSX clubber</h1>);"
let currentTab = "html"
let updateTimeout  

let editor = document.getElementById("editor")
editor.value = htmlCode

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".tab.active").classList.remove("active")
    btn.classList.add("active")

    currentTab = btn.dataset.tab 

    if (currentTab === "html") editor.value = htmlCode
    if (currentTab === "css") editor.value = cssCode
    if (currentTab === "js") editor.value = jsCode
    if (currentTab === "jsx") editor.value = jsxCode
  })
})

editor.addEventListener("input", () => {
  if (currentTab === "html") htmlCode = editor.value
  if (currentTab === "css") cssCode = editor.value
  if (currentTab === "js") jsCode = editor.value 
  if (currentTab === "jsx") jsxCode = editor.value

  updatePreviewAuto()
})

function updatePreviewAuto() {
  clearTimeout(updateTimeout)

  updateTimeout = setTimeout(() => {
    vscode.postMessage({
      type: "run",
      html: htmlCode,
      css: cssCode,
      js: jsCode,
      jsx: jsxCode,
      libs: enabledLibs
    })
  }, 300)
}

let libraries = {
    react: `<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>`,
    vue: `<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>`,
    tailwind: `<script src="https://cdn.tailwindcss.com"></script>`
}

let enabledLibs = {
  react: false,
  vue: false,
  tailwind: false
}

document.querySelectorAll(".lib-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    let lib = btn.dataset.lib

    if (!enabledLibs[lib]) {
      enabledLibs[lib] = true

      btn.disabled = true
      btn.style.opacity = "0.5"

      setTimeout(() => {
        vscode.postMessage({
          type: "run",
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          libs: enabledLibs
        })
      }, 300)
    }
  })
})

document.getElementById("exportBtn").addEventListener("click", () => {
  vscode.postMessage({
    type: "export",
    html: htmlCode,
    css: cssCode,
    js: jsCode,
  })
})

document.getElementById("importBtn").addEventListener("click", () => {
  vscode.postMessage({ type: "import" })
})

window.addEventListener("message", (event) => {
  let msg = event.data

  if(msg.type === "imported") {

    htmlCode = msg.html
    cssCode = msg.css
    jsCode = msg.js

    if (currentTab === "html") editor.value = htmlCode
    if (currentTab === "css") editor.value = cssCode
    if (currentTab === "js") editor.value = jsCode

    updatePreviewAuto()
  }
})


window.addEventListener("message", (event) => {
  let msg = event.data

  if (msg.type === "preview") {
    let iframe = document.getElementById("preview")
    let consoleDiv = document.getElementById("console")
    consoleDiv.innerHTML = ''
     
    let libTags = ""
    for (let lib in msg.libs) {
      if (msg.libs[lib]) {
        libTags += libraries[lib]
      }
    }
    
    iframe.srcdoc = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                          ${libTags}
                          <style>
                          ${msg.css}
                          </style>
                    </head>
                    <body>
                          ${msg.html}

                          <script>

                          const consoleDiv = parent.document.getElementById('console')
                          
                          const oldLog = console.log
                          console.log = function(...args) {
                            oldLog(...args)
                            consoleDiv.innerHTML += args.join(' ') + "<br>"
                          }
                          
                          window.onerror = function(message, source, lineno, colno, error) {
                            consoleDiv.innerHTML += "<span style='color:red;'>ERROR: " + message + "</span><br>"
                            return true
                          }
                          
                          window.addEventListener('load', () => {
                            try {
                              ${msg.js}
                            } catch (e) {
                              consoleDiv.innerHTML += "<span style='color:red'>" + e + "</span><br>"
                            }
                          })
                          </script>
                    </body>
                    </html>
    `
  }
})
