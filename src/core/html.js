import { NODE_BINDING, ATTR_BINDING } from '../const';
import { updateAttribute } from './dom';

const NONE = 0;
const TEXT = 1;
const COMMENT = 2;
const TAG_OPEN = 4;
const TAG_CLOSE = 8;
const ELEM_START = 16;
const ELEM_END = 32;
const ELEM_NAME = 64;
const ELEM_ATTR = 128;
const ATTR_NAME = 256;
const ATTR_VALUE = 512;
const VALUE_INST = 1024;

const INST = 0;
const PARAM = 1;

const HTML_XMLNS = 'http://www.w3.org/1999/xhtml';
const SVG_XMLNS = 'http://www.w3.org/2000/svg';

const assembleCache = new WeakMap();

const parseTemplate = (tpls, vals) => {
  let stack = [];
  let inst = NONE;
  let param = '';

  const valLen = vals.length;
  const tplLen = tpls.length;
  for (let tplIdx = 0; tplIdx < tplLen; ++tplIdx) {
    let tpl = tpls[tplIdx];

    const len = tpl.length;
    let idx = 0;
    while (idx < len) {
      if (inst === COMMENT) {
        if (tpl[idx] === '>' && tpl[idx - 1] === '-' && tpl[idx - 2] === '-') {
          inst = NONE;
        }
      }
      else if (inst === NONE) {
        if (tpl[idx] === '<') {
          inst = TAG_OPEN;
          --idx;
        }
        else if (tpl[idx] !== ' ' && tpl[idx] !== '\t' && tpl[idx] !== '\n') {
          inst = TEXT;
          --idx;
        }
      }
      else if (inst === TEXT) {
        if ((tpl[idx] === ' ' || tpl[idx] === '\t') && (tpl[idx + 1] === ' ' || tpl[idx + 1] === '\t' || tpl[idx + 1] === '\n' || tpl[idx + 1] === '<' || idx + 1 === len)) {}
        else {
          param += tpl[idx];
        }
        if (tpl[idx + 1] === '\n' || tpl[idx + 1] === '<' || idx + 1 === len) {
          inst = NONE;
          stack.push([TEXT, param]);
          param = '';
        }
      }
      else if (inst === TAG_OPEN) {
        if (tpl[idx + 1] === '!' && tpl[idx + 2] === '-' && tpl[idx + 3] === '-') {
          inst = COMMENT;
        }
        else if (tpl[idx + 1] === '/') {
          inst = TAG_CLOSE;
        }
        else {
          inst = ELEM_NAME;
        }
      }
      else if (inst === TAG_CLOSE) {
        if (tpl[idx] === '>') {
          inst = NONE;
          stack.push([ELEM_END, null]);
        }
      }
      else if (inst === ELEM_NAME) {
        param += tpl[idx];
        if (tpl[idx + 1] === ' ' || tpl[idx + 1] === '\t' || tpl[idx + 1] === '\n' || tpl[idx + 1] === '/' || tpl[idx + 1] === '>') {
          inst = ELEM_ATTR;
          stack.push([ELEM_START, param]);
          param = '';
        }
      }
      else if (inst === ELEM_ATTR) {
        if (tpl[idx] === ' ' || tpl[idx] === '\t' || tpl[idx] === '\n') {}
        else if (tpl[idx] === '>') {
          inst = NONE;
        }
        else if (tpl[idx] === '/') {
          inst = TAG_CLOSE;
        }
        else if (tpl[idx] === '"') {
          inst = ATTR_VALUE;
        }
        else {
          inst = ATTR_NAME;
          --idx;
        }
        if (tpl[idx] === '/' || tpl[idx] === '>') {
          stack.push([ELEM_ATTR, null]);
        }
      }
      else if (inst === ATTR_NAME) {
        if (tpl[idx] === ' ' || tpl[idx] === '\t' || tpl[idx] === '\n') {}
        else if (tpl[idx] === '=') {
          inst = ELEM_ATTR;
          stack.push([ATTR_NAME, param]);
          param = '';
        }
        else {
          param += tpl[idx];
        }
      }
      else if (inst === ATTR_VALUE) {
        if (tpl[idx] === '"') {
          inst = ELEM_ATTR;
        }
        else {
          param += tpl[idx];
        }

        if (tpl[idx] === '"' && idx !== 0) {
          stack.push([ATTR_VALUE, param]);
          param = '';
        }
      }
      ++idx;
    }

    if (tplIdx < valLen && inst !== COMMENT) {
      stack.push([VALUE_INST, inst]);
    }
  }

  return stack;
};

const assembleInstruction = (insts, xmlns) => {
  let assembly = {
    identifier: Math.round(Number.MAX_SAFE_INTEGER / Math.random()).toString(16).substr(0, 12),
    fragment: document.createDocumentFragment(),
    bindings: [],
  };
  let name = '';
  let attrs = {};
  let currentParent = assembly.fragment;

  let nodeIdx = 0;
  const len = insts.length;
  for (let idx = 0; idx < len; ++idx) {
    if (insts[idx][INST] === TEXT) {
      currentParent.appendChild(document.createTextNode(insts[idx][PARAM]));
      ++nodeIdx;
    }
    else if (insts[idx][INST] === ELEM_START) {
      name = insts[idx][PARAM];
    }
    else if (insts[idx][INST] === ELEM_END) {
      currentParent = currentParent.parentNode;
    }
    else if (insts[idx][INST] === ELEM_ATTR) {
      let element = document.createElementNS(attrs.xmlns || currentParent.namespaceURI || xmlns, name);
      for (let attrName in attrs) {
        updateAttribute(element, attrName, null, attrs[attrName]);
      }

      name = '';
      attrs = {};

      currentParent = currentParent.appendChild(element);
      ++nodeIdx;
    }
    else if (insts[idx][INST] === ATTR_VALUE) {
      attrs[insts[idx - 1][PARAM]] = insts[idx][PARAM];
    }
    else if (insts[idx][INST] === VALUE_INST) {
      if (insts[idx][PARAM] === NONE) {
        currentParent.appendChild(new Comment());
        currentParent.appendChild(new Comment());

        assembly.bindings.push({
          index: nodeIdx,
          type: NODE_BINDING,
          target: null,
        });
        ++nodeIdx;
      }
      else if (insts[idx][PARAM] === ELEM_ATTR || insts[idx][PARAM] === ATTR_VALUE) {
        assembly.bindings.push({
          index: nodeIdx,
          type: ATTR_BINDING,
          target: insts[idx - 1][PARAM],
        });
      }
    }
  }

  return assembly;
};

const createInstance = (tpls, vals, xmlns) => {
  if (!assembleCache.has(tpls)) {
    assembleCache.set(
      tpls,
      assembleInstruction(parseTemplate(tpls, vals), xmlns)
    );
  }

  let assembly = assembleCache.get(tpls);
  return {
    identifier: assembly.identifier,
    fragment: assembly.fragment,
    bindings: assembly.bindings,
    values: vals,
  }
};

const html = (tpls, ...vals) => createInstance(tpls, vals, HTML_XMLNS);

const svg = (tpls, ...vals) => createInstance(tpls, vals, SVG_XMLNS);

export {
  html,
  svg,
};
