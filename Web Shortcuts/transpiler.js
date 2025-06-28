// transpiler.js

function generate(node) {
    if (!node) return '';
    switch (node.type) {
        case 'Program':
            return node.body.map(generate).filter(Boolean).join('\n');

        case 'PrintLineStatement':
            return `_println(${generate(node.expression)});`;
        case 'PrintStatement':
            return `_print(${generate(node.expression)});`;

        case 'VariableDeclaration':
            return `let ${node.name} = ${generate(node.value)};`;

        // NEW: Handles updating an existing variable
        case 'AssignmentExpression':
            return `${node.name} = ${generate(node.value)};`;

        case 'IfStatement':
            const condition = generate(node.condition);
            const consequent = generate(node.body);
            const alternate = node.alternate ? ` else ${generate(node.alternate)}` : '';
            // If the body is empty, we don't need curly braces.
            const bodyBlock = consequent ? `{\n${consequent}\n}` : '';
            return `if (${condition}) ${bodyBlock}${alternate}`;

        case 'WhileStatement':
            const whileCondition = generate(node.condition);
            const whileBody = generate(node.body);
            return `while (${whileCondition}) {\n${whileBody}\n}`;

        case 'ForStatement':
            const forVar = node.variable;
            const forRange = generate(node.range);
            const forBody = generate(node.body);
            return `for (let ${forVar} = 0; ${forVar} < ${forRange}; ${forVar}++) {\n${forBody}\n}`;

        case 'BinaryExpression':
            const left = generate(node.left);
            const right = generate(node.right);
            return `(${left} ${node.operator} ${right})`;

        case 'TemplateLiteral':
            const templateParts = node.parts.map(part => {
                if (part.type === 'StringLiteral') {
                    return part.value.replace(/`/g, '\\`'); // Escape backticks
                } else {
                    return `\${${part.name}}`;
                }
            }).join('');
            return `\`${templateParts}\``;

        case 'Identifier':
            return node.name;
        case 'NumberLiteral':
            return node.value;
        case 'StringLiteral':
            return JSON.stringify(node.value);
        case 'BooleanLiteral':
            return node.value.toLowerCase();

        default:
            throw new TypeError(`Unknown node type: ${node.type}`);
    }
}

function transpile(ast) {
    return generate(ast);
}