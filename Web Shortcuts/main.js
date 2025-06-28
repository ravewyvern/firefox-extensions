// main.js

let _printBuffer = '';
function _print(...args) {
    document.getElementById('output').textContent += args.join(' ');
}
function _println(...args) {
    document.getElementById('output').textContent += args.join(' ') + '\n';
}

document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const output = document.getElementById('output');

    const editor = CodeMirror(document.getElementById('code-editor'), {
        lineNumbers: true,
        mode: 'python',
        theme: 'material-darker',
        indentUnit: 2,
        tabSize: 2
    });

    const defaultCode = `
# Welcome to MyLang Studio!

name = "World"
println("Hello, <name>!")
x = 10
y = 20

# If/Else If/Else statements
if x > y:
  println("x is greater than y")
else if y > x:
  println("y is greater than x")
else:
  println("x and y are equal")


println("") # Blank line
println("Starting while loop:")

count = 0
while count < 3:
  println("count is <count>")
  # This now works correctly!
  count = count + 1

println("")
println("Starting for loop:")
for i in range(5):
  print("<i> ")
`;
    editor.setValue(defaultCode.trim());


    runBtn.addEventListener('click', () => {
        // ---- FIX FOR BUG #1 ----
        // Reset output state before every run
        output.textContent = '';
        output.style.color = ''; // Reset the color to default
        // ------------------------

        const userCode = editor.getValue();

        try {
            const ast = parse(userCode);
            const jsCode = transpile(ast);

            console.log("--- Generated JavaScript ---");
            console.log(jsCode);
            console.log("--------------------------");

            eval(jsCode);

        } catch (e) {
            output.style.color = '#ff5555';
            output.textContent = e.stack;
            console.error(e);
        }
    });

    clearBtn.addEventListener('click', () => {
        output.textContent = '';
        output.style.color = '';
    });
});