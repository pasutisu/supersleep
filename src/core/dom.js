import { isEmpty, notEmpty, isBoolean, isString, isFunction, isObject } from '../utility';
import { NODE_BINDING, ATTR_BINDING, ASSEMBLY_IDENTIFIER, BINDING_CONTEXTS_HOLDER, LISTENERS_HOLDER } from '../const';
import { patch } from './patch';

const EVENT_PREFIX = 'on';
const isEvent = (attrName) => attrName[0] === EVENT_PREFIX[0] && attrName[1] === EVENT_PREFIX[1];
const hookEventHandler = (event) => event.currentTarget[LISTENERS_HOLDER][event.type](event);

const createNode = (instance) => {
  let rootNode = document.importNode(instance.fragment, true).firstChild;
  rootNode[ASSEMBLY_IDENTIFIER] = instance.identifier;
  rootNode[BINDING_CONTEXTS_HOLDER] = [];

  let walker = document.createTreeWalker(rootNode);
  let node = walker.currentNode;
  let nodeIdx = 0;

  let idx = 0;
  while (notEmpty(instance.bindings[idx])) {
    if (instance.bindings[idx].index === nodeIdx) {
      if (instance.bindings[idx].type === NODE_BINDING) {
        rootNode[BINDING_CONTEXTS_HOLDER][idx] = {
          parent: node.parentNode,
          head: node,
          tail: node.nextSibling,
          value: null,
        };
        node = walker.nextNode();

        if (isFunction(instance.values[idx])) {
          instance.values[idx](
            instance.bindings[idx],
            rootNode[BINDING_CONTEXTS_HOLDER][idx]
          );
        }
        else if (isObject(instance.values[idx])) {
          node.parentNode.insertBefore(
            createNode(instance.values[idx]),
            node
          );
        }
        else {
          node.parentNode.insertBefore(
            document.createTextNode(
              isEmpty(instance.values[idx])
                ? ''
                : isString(instance.values[idx])
                  ? instance.values[idx]
                  : instance.values[idx].toString()
            ),
            node
          );
        }
      }
      else if (instance.bindings[idx].type === ATTR_BINDING) {
        rootNode[BINDING_CONTEXTS_HOLDER][idx] = {
          parent: node,
          head: null,
          tail: null,
          value: null,
        };

        updateAttribute(
          node,
          instance.bindings[idx].target,
          rootNode[BINDING_CONTEXTS_HOLDER][idx].value,
          instance.values[idx]
        );

        rootNode[BINDING_CONTEXTS_HOLDER][idx].value = instance.values[idx];
      }

      if (notEmpty(instance.bindings[idx + 1]) && instance.bindings[idx].index !== instance.bindings[idx + 1].index) {
        node = walker.nextNode();
        ++nodeIdx;
      }

      ++idx;
    }
    else {
      node = walker.nextNode();
      ++nodeIdx;
    }
  }

  return rootNode;
};

const updateNode = (instance, rootNode) => {
  const len = instance.bindings.length;
  for (let idx = 0; idx < len; ++idx) {
    if (instance.bindings[idx].type === NODE_BINDING) {
      if (isFunction(instance.values[idx])) {
        instance.values[idx](
          instance.bindings[idx],
          rootNode[BINDING_CONTEXTS_HOLDER][idx]
        );
      }
      else if (isObject(instance.values[idx])) {
        let node = rootNode[BINDING_CONTEXTS_HOLDER][idx].head.nextSibling;
        patch(instance.values[idx], node.parentNode, node);
      }
      else {
        let node = rootNode[BINDING_CONTEXTS_HOLDER][idx].head.nextSibling;
        if (isEmpty(instance.values[idx])) {
          node.nodeValue = '';
        }
        else if (node.nodeValue !== (isString(instance.values[idx]) ? instance.values[idx] : instance.values[idx].toString())) {
          node.nodeValue =
            isString(instance.values[idx])
              ? instance.values[idx]
              : instance.values[idx].toString();
        }
      }
    }
    else if (instance.bindings[idx].type === ATTR_BINDING) {
      updateAttribute(
        rootNode[BINDING_CONTEXTS_HOLDER][idx].parent,
        instance.bindings[idx].target,
        rootNode[BINDING_CONTEXTS_HOLDER][idx].value,
        instance.values[idx]
      );

      rootNode[BINDING_CONTEXTS_HOLDER][idx].value = instance.values[idx];
    }
  }
};

const removeNode = (node) => {
  const len = node.childNodes.length;
  for (let idx = len - 1; idx >= 0; --idx) {
    removeNode(node.childNodes[idx]);
  }

  node.parentNode.removeChild(node);
};

const updateAttribute = (element, attrName, prevAttrValue, nextAttrValue) => {
  if (attrName === 'key') {}
  else if (isEvent(attrName) && isFunction(nextAttrValue)) {
    let eventName = attrName.substr(2);

    if (!(LISTENERS_HOLDER in element)) {
      element[LISTENERS_HOLDER] = {};
    }

    if (isEmpty(nextAttrValue)) {
      element.removeEventListener(eventName, hookEventHandler);
      element[LISTENERS_HOLDER][eventName] = null;
    }
    else if ((eventName in element[LISTENERS_HOLDER])) {
      element[LISTENERS_HOLDER][eventName] = nextAttrValue;
      element.addEventListener(eventName, hookEventHandler);
    }
    else if (element[LISTENERS_HOLDER][eventName] !== nextAttrValue) {
      element[LISTENERS_HOLDER][eventName] = nextAttrValue;
    }
  }
  else if (isFunction(nextAttrValue)) {
    nextAttrValue(
      element,
      attrName
    );
  }
  else if (prevAttrValue !== nextAttrValue) {
    if (isEmpty(nextAttrValue)) {
      element.removeAttribute(attrName);
    }
    else {
      if (isBoolean(nextAttrValue) && attrName in element) {
        element[attrName] = nextAttrValue;
      }
      else {
        element.setAttribute(attrName, nextAttrValue);
      }
    }
  }
};

export {
  createNode,
  updateNode,
  updateAttribute,
  removeNode,
};
