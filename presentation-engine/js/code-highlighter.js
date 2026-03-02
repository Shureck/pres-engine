/**
 * Simple syntax highlighter for Kotlin (and basic support for other languages).
 * No external dependencies. Provides basic but visually appealing highlighting.
 */
class CodeHighlighter {
    constructor() {
        this.languages = {
            kotlin: {
                keywords: [
                    'fun', 'val', 'var', 'if', 'else', 'when', 'for', 'while', 'do',
                    'return', 'class', 'object', 'interface', 'abstract', 'open',
                    'override', 'private', 'protected', 'public', 'internal',
                    'data', 'sealed', 'enum', 'annotation', 'companion',
                    'import', 'package', 'as', 'is', 'in', 'out', 'by',
                    'constructor', 'init', 'this', 'super', 'typeof',
                    'throw', 'try', 'catch', 'finally', 'break', 'continue',
                    'null', 'true', 'false', 'it', 'suspend', 'inline',
                    'reified', 'crossinline', 'noinline', 'tailrec', 'operator',
                    'infix', 'lateinit', 'const', 'vararg', 'expect', 'actual'
                ],
                types: [
                    'Int', 'Long', 'Short', 'Byte', 'Float', 'Double', 'Boolean',
                    'Char', 'String', 'Unit', 'Nothing', 'Any', 'Array',
                    'List', 'MutableList', 'Map', 'MutableMap', 'Set', 'MutableSet',
                    'Pair', 'Triple', 'Sequence', 'Iterable', 'Collection',
                    'UByte', 'UShort', 'UInt', 'ULong',
                    'StringBuilder', 'StringBuffer', 'CharSequence', 'Regex',
                    'Comparable', 'Number', 'Enum'
                ],
                builtins: [
                    'println', 'print', 'readln', 'readLine', 'require', 'check',
                    'assert', 'error', 'TODO', 'run', 'let', 'also', 'apply', 'with',
                    'repeat', 'lazy', 'buildString', 'buildList', 'buildMap',
                    'listOf', 'mutableListOf', 'mapOf', 'mutableMapOf', 'setOf',
                    'arrayOf', 'intArrayOf', 'emptyList', 'emptyMap',
                    'maxOf', 'minOf', 'sortedBy', 'filter', 'map', 'forEach',
                    'toInt', 'toLong', 'toDouble', 'toFloat', 'toString',
                    'toMutableList', 'toList', 'toSet', 'toMutableSet',
                    'format', 'trimIndent', 'trim', 'split', 'joinToString',
                    'substring', 'replace', 'contains', 'startsWith', 'endsWith',
                    'isDigit', 'isLetter', 'isLetterOrDigit', 'isWhitespace',
                    'isUpperCase', 'isLowerCase', 'uppercase', 'lowercase',
                    'uppercaseChar', 'lowercaseChar', 'toUpperCase', 'toLowerCase',
                    'first', 'last', 'count', 'sum', 'average',
                    'append', 'insert', 'delete', 'capacity', 'length',
                    'subSequence', 'charAt',
                    'inv', 'and', 'or', 'xor', 'shl', 'shr', 'ushr'
                ]
            },
            javascript: {
                keywords: [
                    'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
                    'do', 'return', 'class', 'extends', 'new', 'this', 'super',
                    'import', 'export', 'default', 'from', 'async', 'await',
                    'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof',
                    'switch', 'case', 'break', 'continue', 'null', 'undefined',
                    'true', 'false', 'yield', 'of', 'in', 'delete', 'void',
                    'static', 'get', 'set'
                ],
                types: [
                    'Array', 'Object', 'String', 'Number', 'Boolean', 'Symbol',
                    'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Date',
                    'RegExp', 'Error', 'JSON', 'Math', 'console'
                ],
                builtins: [
                    'console', 'log', 'warn', 'error', 'parseInt', 'parseFloat',
                    'isNaN', 'isFinite', 'setTimeout', 'setInterval', 'clearTimeout',
                    'clearInterval', 'fetch', 'then', 'catch', 'finally',
                    'push', 'pop', 'shift', 'unshift', 'map', 'filter', 'reduce',
                    'forEach', 'find', 'indexOf', 'includes', 'join', 'split',
                    'slice', 'splice', 'sort', 'reverse', 'keys', 'values', 'entries',
                    'length', 'toString', 'valueOf', 'hasOwnProperty',
                    'addEventListener', 'removeEventListener', 'querySelector',
                    'querySelectorAll', 'getElementById', 'createElement',
                    'appendChild', 'removeChild', 'setAttribute', 'getAttribute'
                ]
            },
            python: {
                keywords: [
                    'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return',
                    'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
                    'with', 'pass', 'break', 'continue', 'lambda', 'yield',
                    'global', 'nonlocal', 'assert', 'del', 'in', 'not', 'and', 'or',
                    'is', 'True', 'False', 'None', 'async', 'await'
                ],
                types: [
                    'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set',
                    'type', 'object', 'Exception', 'ValueError', 'TypeError',
                    'range', 'enumerate', 'zip', 'map', 'filter'
                ],
                builtins: [
                    'print', 'input', 'len', 'range', 'enumerate', 'zip',
                    'map', 'filter', 'sorted', 'reversed', 'sum', 'min', 'max',
                    'abs', 'round', 'isinstance', 'issubclass', 'hasattr',
                    'getattr', 'setattr', 'open', 'super', 'property',
                    'staticmethod', 'classmethod', 'append', 'extend', 'insert',
                    'remove', 'pop', 'index', 'count', 'sort', 'reverse',
                    'join', 'split', 'strip', 'replace', 'format', 'upper', 'lower',
                    'startswith', 'endswith', 'find', 'rfind'
                ]
            }
        };
    }

    /**
     * Highlight code string
     * @param {string} code - Source code
     * @param {string} language - Language name
     * @param {object} options - { lineNumbers: bool, highlightLines: number[] }
     * @returns {string|object} HTML string or { type, code, lineNumbers? }
     */
    highlight(code, language = 'kotlin', options = {}) {
        const lang = this.languages[language] || this.languages.kotlin;
        let result = this._escapeHtml(code);

        const tokens = [];
        let tokenId = 0;

        // Extract strings (double-quoted, including raw strings)
        result = result.replace(/("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (match) => {
            const id = `__TOKEN_STR_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-string">${match}</span>` });
            return id;
        });

        // Extract comments (language-specific)
        if (language === 'python') {
            result = result.replace(/(#.*$)/gm, (match) => {
                const id = `__TOKEN_CMT_${tokenId++}__`;
                tokens.push({ id, html: `<span class="hl-comment">${match}</span>` });
                return id;
            });
        } else {
            result = result.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (match) => {
                const id = `__TOKEN_CMT_${tokenId++}__`;
                tokens.push({ id, html: `<span class="hl-comment">${match}</span>` });
                return id;
            });
        }

        // Annotations (Kotlin @...)
        if (language === 'kotlin') {
            result = result.replace(/@\w+/g, (match) => {
                const id = `__TOKEN_ANN_${tokenId++}__`;
                tokens.push({ id, html: `<span class="hl-annotation">${match}</span>` });
                return id;
            });
        }

        // Numbers
        result = result.replace(/\b(\d+\.?\d*[fFLuU]?|0[xX][0-9a-fA-F]+|0[bB][01]+)\b/g, (match) => {
            const id = `__TOKEN_NUM_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-number">${match}</span>` });
            return id;
        });

        // Types
        const typePattern = new RegExp(`\\b(${lang.types.join('|')})\\b`, 'g');
        result = result.replace(typePattern, (match) => {
            const id = `__TOKEN_TYPE_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-type">${match}</span>` });
            return id;
        });

        // Keywords
        const kwPattern = new RegExp(`\\b(${lang.keywords.join('|')})\\b`, 'g');
        result = result.replace(kwPattern, (match) => {
            const id = `__TOKEN_KW_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-keyword">${match}</span>` });
            return id;
        });

        // Built-in functions (only when followed by parenthesis)
        const builtinPattern = new RegExp(`\\b(${lang.builtins.join('|')})(?=\\s*[\\(])`, 'g');
        result = result.replace(builtinPattern, (match) => {
            const id = `__TOKEN_FN_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-function">${match}</span>` });
            return id;
        });

        // .method() calls
        result = result.replace(/\.(\w+)(?=\s*\()/g, (match, name) => {
            if (match.includes('__TOKEN_')) return match;
            const id = `__TOKEN_METH_${tokenId++}__`;
            tokens.push({ id, html: `.<span class="hl-function">${name}</span>` });
            return id;
        });

        // Operators
        result = result.replace(/([\+\-\*\/%]=?|[=!<>]=|&&|\|\||!!|->|\.\.|\?[.:]?|::)/g, (match) => {
            if (match.includes('__TOKEN_')) return match;
            const id = `__TOKEN_OP_${tokenId++}__`;
            tokens.push({ id, html: `<span class="hl-operator">${match}</span>` });
            return id;
        });

        // Template expressions in strings
        tokens.forEach((token) => {
            if (token.id.includes('_STR_')) {
                token.html = token.html
                    .replace(/(\$\{[^}]*\})/g, '<span class="hl-template">$1</span>')
                    .replace(/(\$\w+)/g, '<span class="hl-template">$1</span>');
            }
        });

        // Restore tokens in REVERSE order so that placeholders inside comments
        // (e.g. // [__TOKEN_STR_2__, __TOKEN_STR_3__]) get replaced by string content
        tokens.slice().reverse().forEach(token => {
            result = result.split(token.id).join(token.html);
        });

        // Line numbers and line highlighting
        if (options.lineNumbers || options.highlightLines) {
            const lines = result.split('\n');
            const highlightSet = new Set(options.highlightLines || []);

            const numberedLines = lines.map((line, i) => {
                const lineNum = i + 1;
                const isHighlighted = highlightSet.has(lineNum);
                const lineClass = isHighlighted ? ' hl-line-highlight' : '';
                return `<span class="code-line${lineClass}">${line}</span>`;
            });

            if (options.lineNumbers) {
                const lineNums = lines.map((_, i) =>
                    `<span>${i + 1}</span>`
                ).join('\n');

                return {
                    type: 'numbered',
                    lineNumbers: lineNums,
                    code: numberedLines.join('\n')
                };
            }

            result = numberedLines.join('\n');
        }

        return { type: 'simple', code: result };
    }

    _escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

window.CodeHighlighter = CodeHighlighter;
