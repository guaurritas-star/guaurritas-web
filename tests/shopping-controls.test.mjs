import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, ServerStyleSheet, StyleSheetManager } from 'styled-components';
import original from 'react95/dist/themes/original.js';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/ui/ShoppingControls.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, { module: mod, exports: mod.exports, require });

test('React95 controls render on the server with native button semantics and scoped styles', () => {
  const { ShoppingButton, ShoppingWindow, ShoppingWindowHeader, shouldForwardShoppingProp } = mod.exports;
  const sheet = new ServerStyleSheet();
  const warnings = [];
  const previousError = console.error;
  console.error = (...args) => warnings.push(args);
  try {
    const markup = renderToStaticMarkup(sheet.collectStyles(React.createElement(StyleSheetManager, { shouldForwardProp: shouldForwardShoppingProp }, React.createElement(ThemeProvider, { theme: original },
      React.createElement(ShoppingWindow, { role: 'dialog', 'aria-label': 'Tienda' },
        React.createElement(ShoppingWindowHeader, null, 'Tienda'),
        React.createElement(ShoppingButton, { $tone: 'blue', 'aria-pressed': true }, 'León'),
        React.createElement(ShoppingButton, { disabled: true }, 'Continuar'),
      )))));
    assert.match(markup, /<button[^>]*type="button"/);
    assert.match(markup, /aria-pressed="true"/);
    assert.match(markup, /<button[^>]*disabled=""/);
    assert.doesNotMatch(markup, /\$tone=|theme=|as="/);
    const css = sheet.getStyleTags();
    assert.match(css, /#425b8c/);
    assert.match(css, /focus-visible/);
    assert.match(css, /prefers-reduced-motion/);
    assert.doesNotMatch(css, /body\s*\{/);
    assert.deepEqual(warnings, [], 'No React DOM prop warnings during server rendering');
  } finally { console.error = previousError; sheet.seal(); }
});
