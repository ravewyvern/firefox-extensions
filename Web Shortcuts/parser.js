// parser.js

function parse(code) {
    const lines = code.split('\n');
    let i = 0;
    const scope = new Set();

    function parseBlock(currentIndent = -1) {
        const block = { type: 'Program', body: [] };

        while (i < lines.length) {
            // ---- FIX FOR BUG #2 ----
            // Strip inline comments from the line first
            const rawLine = lines[i].split('#')[0];
            // ------------------------

            const indentMatch = rawLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0].length : 0;
            const trimmedLine = rawLine.trim();

            if (indent < currentIndent) {
                break;
            }

            if (!trimmedLine) { // Skip empty lines
                i++;
                continue;
            }

            // ---- FIX FOR BUG #3 ----
            // The aggressive `break` on `else` is removed from here.
            // The `if` statement handler is now fully responsible for consuming the else chain.
            // ------------------------

            i++;

            let node = parseLine(trimmedLine, scope);
            if (node) {
                if (['IfStatement', 'WhileStatement', 'ForStatement'].includes(node.type)) {
                    node.body = parseBlock(indent + 1);
                }

                // ---- NEW, ROBUST IF/ELSE IF/ELSE CHAINING LOGIC ----
                if (node.type === 'IfStatement') {
                    let currentNode = node; // Start the chain with the initial 'if'

                    // Keep looking for 'else if' statements
                    while (i < lines.length && lines[i].split('#')[0].trim().startsWith('else if')) {
                        const elseIfLineRaw = lines[i].split('#')[0];
                        const elseIfLine = elseIfLineRaw.trim();
                        i++; // Consume the 'else if' line

                        // Create a new IfStatement for the 'else if' part
                        const elseIfNode = parseLine(elseIfLine, scope);
                        elseIfNode.body = parseBlock(indent + 1);

                        // Link it to the end of the current chain
                        currentNode.alternate = elseIfNode;
                        // IMPORTANT: Move the end of the chain forward
                        currentNode = elseIfNode;
                    }

                    // After all 'else if's, check for a final 'else'
                    if (i < lines.length && lines[i].split('#')[0].trim().startsWith('else:')) {
                        i++; // Consume the 'else' line
                        // Link the 'else' block to the end of the chain
                        currentNode.alternate = parseBlock(indent + 1);
                    }
                }
                // --- END OF NEW LOGIC ---
                block.body.push(node);
            }
        }
        return block;
    }

    return parseBlock();
}



function parseLine(line, scope) {
    let match;

    if (match = line.match(/^(println|print)\((.*)\)$/)) {
        return {
            type: match[1] === 'println' ? 'PrintLineStatement' : 'PrintStatement',
            expression: parseExpression(match[2].trim())
        };
    }

    if (line.includes('=')) {
        match = line.match(/^(\w+)\s*=\s*(.*)$/);
        if (match) {
            const varName = match[1];
            const value = parseExpression(match[2].trim());
            if (!scope.has(varName)) {
                scope.add(varName);
                return { type: 'VariableDeclaration', name: varName, value: value };
            } else {
                return { type: 'AssignmentExpression', name: varName, value: value };
            }
        }
    }

    if (match = line.match(/^if (.*):$/)) {
        return {
            type: 'IfStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] },
            alternate: null
        };
    }

    if (match = line.match(/^while (.*):$/)) {
        return {
            type: 'WhileStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] }
        };
    }

    if (match = line.match(/^for (\w+) in range\((.*)\):$/)) {
        if (!scope.has(match[1])) scope.add(match[1]);
        return {
            type: 'ForStatement',
            variable: match[1],
            range: parseExpression(match[2].trim()),
            body: { type: 'Program', body: [] }
        };
    }

    // This case is now handled by the main `parseBlock` logic, making it more robust.
    if (match = line.match(/^else if (.*):$/)) {
        return {
            type: 'IfStatement',
            condition: parseExpression(match[1].trim()),
            body: { type: 'Program', body: [] },
            alternate: null,
        }
    }

    throw new Error(`Syntax Error: Unknown statement: ${line}`);
}

// No changes needed to parseExpression
function parseExpression(expr) {
    if (expr.includes('+')) {
        const parts = expr.split('+').map(p => p.trim());
        return {
            type: 'BinaryExpression',
            operator: '+',
            left: parseExpression(parts[0]),
            right: parseExpression(parts.slice(1).join('+'))
        };
    }
    if (expr.startsWith('"') && expr.endsWith('"')) {
        const strValue = expr.slice(1, -1);
        if (strValue.includes('<') && strValue.includes('>')) {
            const parts = [];
            let lastIndex = 0;
            const regex = /<(\w+)>/g;
            let match;
            while ((match = regex.exec(strValue)) !== null) {
                if (match.index > lastIndex) {
                    parts.push({ type: 'StringLiteral', value: strValue.substring(lastIndex, match.index) });
                }
                parts.push({ type: 'Identifier', name: match[1] });
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < strValue.length) {
                parts.push({ type: 'StringLiteral', value: strValue.substring(lastIndex) });
            }
            return { type: 'TemplateLiteral', parts: parts };
        }
        return { type: 'StringLiteral', value: strValue };
    }
    if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
        return { type: 'NumberLiteral', value: expr };
    }
    if (expr === 'True' || expr === 'False') {
        return { type: 'BooleanLiteral', value: expr };
    }
    if (expr.includes('>')) {
        const parts = expr.split('>').map(p => p.trim());
        return { type: 'BinaryExpression', operator: '>', left: parseExpression(parts[0]), right: parseExpression(parts[1]) };
    }
    if (expr.includes('<')) {
        const parts = expr.split('<').map(p => p.trim());
        return { type: 'BinaryExpression', operator: '<', left: parseExpression(parts[0]), right: parseExpression(parts[1]) };
    }
    return { type: 'Identifier', name: expr };
}