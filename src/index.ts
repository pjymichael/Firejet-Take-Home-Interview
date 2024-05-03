import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import prettier from 'prettier';
import fs from 'fs';

// Given lint function
async function lint(code: string): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const formattedCode = prettier.format(code);
            resolve(formattedCode);
        }, Math.random() * 1000); // Random delay between 0 and 1 seconds
    });
}

// Read the file contents
fs.readFile('src/exhibitA.ts', 'utf-8', async (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Parse the file contents into an AST
    const ast = parse(data, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });

    // Object to store the linted code
    const lintedCodeObj: { [key: string]: string } = {};

    // Traverse the AST to find and lint template literals prefixed with /*tsx*/
    await traverse(ast, {
        TemplateLiteral(path) {
            const comments = path.node.leadingComments;
            if (comments && comments.length > 0 && comments[0].value === 'tsx') {
                const code = path.node.quasis.map(quasi => quasi.value.raw).join('');
                lint(code).then((lintedCode) => {
                    // Remove backticks from linted code
                    const trimmedLintedCode = lintedCode.substring(1, lintedCode.length - 1);
                    // Store linted code in object
                    lintedCodeObj[path.node.start!] = trimmedLintedCode;
                });
            }
        },
    });

    // Wait for all linted code to be processed
    await Promise.all(Object.values(lintedCodeObj));

    // Generate modified code from the AST
    const modifiedCode = require('@babel/generator').default(ast).code;

    // Write the modified code to a new file
    fs.writeFile('src/lintedExhibitA.ts', modifiedCode, 'utf-8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Linted file created successfully.');
    });
});

// Edge cases: 
// - If file does not contain any template literals prefixed with /*tsx*/, the modified code will be the same as the original code.
// - iF file contains nested template literals prefixed with /*tsx*/, lint function will be called for each of them, but the order of linting is not guaranteed.


// Time Complexity:
// Parsing = O(n), n is size of code block
// Traversing = O(m), m nodes in AST
// Linting = O(k), k is size of template literal
// Overall time complexity = O(n + m + k)

// Space Complexity:
// Storing of AST data structure = O(m), m is number of nodes in AST
// Storing of the linted code Objects = O(p), p is number of template iterals prefixed with /*tsx*/
// Overall space complexity = O(m + p)