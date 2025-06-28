// main.js

let _printBuffer = '';

function _handleRuntimeError(error, lineNumber) {
    const output = document.getElementById('output');
    output.style.color = '#ff5555'; // Red for errors
    // Format a user-friendly error message!
    output.textContent = `Runtime Error on line ${lineNumber}:\n${error.name}: ${error.message}`;
}

function _print(...args) {
    document.getElementById('output').textContent += args.join(' ');
}
function _println(...args) {
    document.getElementById('output').textContent += args.join(' ') + '\n';
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const output = document.getElementById('output');
    const statusBar = document.getElementById('status-bar');

    // --- Autocomplete Keyword List ---
    const novaScriptKeywords = "fun if else for while return True False print println";
    const keywords = new Set(novaScriptKeywords.split(" "));

    // --- CodeMirror Editor Initialization ---
    const editor = CodeMirror(document.getElementById('code-editor'), {
        lineNumbers: true,
        mode: 'python', // Python mode is a good base
        theme: 'material-darker',
        indentUnit: 2,
        tabSize: 2,
        autoCloseBrackets: true, // Addon: Automatically close brackets and quotes
        extraKeys: {
            "Ctrl-Space": "autocomplete" // Addon: Trigger autocomplete with Ctrl+Space
        }
    });

    const defaultCode = `
// Welcome to MyLang Studio!

name = "World"
println("Hello, <name>!")
x = 10
y = 20

// If/Else If/Else statements
if x > y:
  println("x is greater than y")
else if y > x:
  println("y is greater than x")
else:
  println("x and y are equal")


println("") // Blank line
println("Starting while loop:")

count = 0
while count < 3:
  println("count is <count>")
  // This now works correctly!
  count = count + 1

println("")
println("Starting for loop:")
for i in range(5):
  print("<i> ")
`;
    editor.setValue(defaultCode.trim());


    runBtn.addEventListener('click', () => {
        output.textContent = '';
        output.style.color = '';

        const userCode = editor.getValue();

        try {
            const ast = parse(userCode);
            const jsCode = transpile(ast);

            console.log("--- Generated JavaScript ---");
            console.log(jsCode);

            eval(jsCode);

        } catch (e) {
            if (output.textContent === '') {
                output.style.color = '#ff5555';
                output.textContent = e.stack;
            }
            console.error(e);
        }
    });

    clearBtn.addEventListener('click', () => {
        output.textContent = '';
        output.style.color = '';
    });

    // --- UI Enhancement Logic ---

    // 1. Status Bar
    function updateStatusBar() {
        const cursor = editor.getCursor();
        statusBar.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    }
    editor.on('cursorActivity', updateStatusBar);
    updateStatusBar(); // Initial update

    // 2. Resizable Panels
    const resizer = document.getElementById('resizer');
    const editorContainer = document.querySelector('.editor-container');

    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize'; // Change cursor for the whole page
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isResizing) return;
        const editorLeft = editorContainer.getBoundingClientRect().left;
        const newWidth = e.clientX - editorLeft;
        // Set a min width to prevent panels from disappearing
        if (newWidth > 100) {
            editorContainer.style.width = `${newWidth}px`;
        }
    }

    function onMouseUp() {
        isResizing = false;
        document.body.style.cursor = 'default'; // Reset cursor
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // 3. Dropdown Menus
    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d.id !== dropdownId) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });
    }
    setupDropdown('file-btn', 'file-dropdown');
    setupDropdown('edit-btn', 'edit-dropdown');

    // Close dropdowns if user clicks outside
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.dropdown button')) {
            document.querySelectorAll('.dropdown-content').forEach(d => {
                d.classList.remove('show');
            });
        }
    });
});