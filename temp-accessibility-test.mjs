import { run } from 'axe-core';
import { JSDOM } from 'jsdom';
import React from 'react';
import ReactDOM from 'react-dom';
import fs from 'node:fs/promises';

// Importar componentes como strings para evitar problemas de compilação
const FloatingLabelInput = (await import('./components/common/FloatingLabelInput.js')).default;
const BrandHeader = (await import('./components/common/BrandHeader.js')).default;

async function testComponent(component, name) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;

  const root = document.getElementById('root');
  ReactDOM.render(component, root);

  const results = await run(document);
  if (results.violations.length > 0) {
    console.warn(`⚠️ ${name} encontrou ${results.violations.length} violações de acessibilidade`);
  }
  return results;
}

async function runTests() {
  const results = {};
  
  try {
    // Teste FloatingLabelInput
    const floatingLabelInput = React.createElement(FloatingLabelInput, {
      label: "Test Input",
      placeholder: "Digite algo..."
    });
    results.floatingLabel = await testComponent(floatingLabelInput, "FloatingLabelInput");

    // Teste BrandHeader
    const brandHeader = React.createElement(BrandHeader);
    results.brandHeader = await testComponent(brandHeader, "BrandHeader");

    await fs.writeFile('accessibility-results.json', JSON.stringify(results, null, 2));
    console.log('✅ Testes de acessibilidade concluídos com sucesso!');
    return results;
  } catch (err) {
    console.error('❌ Erro durante os testes:', err);
    throw err;
  }
}

runTests().catch(() => process.exit(1));