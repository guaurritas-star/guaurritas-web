console.log('[GUAURRITAS EXTERNAL TEST] file evaluated');

class GuaurritasExternalTest extends HTMLElement {
  constructor() {
    super();
    console.log('[GUAURRITAS EXTERNAL TEST] constructor');
  }

  connectedCallback() {
    console.log('[GUAURRITAS EXTERNAL TEST] connectedCallback');
    this.style.display = 'grid';
    this.style.placeItems = 'center';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.minHeight = '300px';
    this.style.boxSizing = 'border-box';
    this.style.background = '#425b8c';
    this.style.color = '#ffffff';
    this.style.border = '6px solid #263650';
    this.style.font = '700 32px Arial, sans-serif';
    this.textContent = 'GUAURRITAS EXTERNAL TEST OK';
  }
}

if (!customElements.get('guaurritas-external-test')) {
  customElements.define('guaurritas-external-test', GuaurritasExternalTest);
  console.log('[GUAURRITAS EXTERNAL TEST] customElements.define OK');
}
