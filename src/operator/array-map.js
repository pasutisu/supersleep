import { createNode, updateNode, removeNode } from '../core/dom';
import { isEmpty } from '../utility';

const nodeMapCache = new WeakMap();
const keyResolverCache = new WeakMap();

const arrayMap = (items, instanceFrom, keyFrom = null) => (binding, bindingContext) => {
  let idx, len, key, node;

  if (isEmpty(keyFrom)) {
    node = bindingContext.head.nextSibling;
    for (idx = 0, len = items.length; idx < len; ++idx) {
      if (node === bindingContext.tail) {
        node.parentNode.insertBefore(
          createNode(instanceFrom(items[idx])),
          node
        );
      }
      else {
        updateNode(instanceFrom(items[idx]), node);
        node = node.nextSibling;
      }
    }

    node = node.previousSibling;
    while (node !== bindingContext.tail.previousSibling) {
      removeNode(bindingContext.tail.previousSibling);
    }
  }
  else {
    if (!nodeMapCache.has(bindingContext)) {
      nodeMapCache.set(bindingContext, new Map());
    }
    if (!keyResolverCache.has(bindingContext)) {
      keyResolverCache.set(bindingContext, new WeakMap());
    }
    let nodeMap = nodeMapCache.get(bindingContext);
    let keyResolver = keyResolverCache.get(bindingContext);

    let nextKeys = new Set();
    for (idx = 0, len = items.length, key; idx < len; ++idx) {
      key = keyFrom(items[idx]);
      nextKeys.add(key);

      if (!nodeMap.has(key)) {
        nodeMap.set(key, createNode(instanceFrom(items[idx])));
        keyResolver.set(nodeMap.get(key), key);
      }
      else {
        updateNode(instanceFrom(items[idx]), nodeMap.get(key));
      }
    }

    node = bindingContext.head;
    while ((node = node.nextSibling) && (node !== bindingContext.tail)) {
      key = keyResolver.get(node);
      if (!nextKeys.has(key)) {
        node = node.nextSibling;
        removeNode(node.nextSibling);
        nodeMap.delete(key);
      }
    }

    node = bindingContext.head;
    for (idx = 0, len = items.length; idx < len; ++idx) {
      key = keyFrom(items[idx]);

      if (node === bindingContext.tail || key !== keyResolver.get(node.nextSibling)) {
        node.parentNode.insertBefore(
          nodeMap.get(key),
          node
        );
      }
      else {
        node = node.nextSibling
      }
    }

    nodeMapCache.set(bindingContext, nodeMap);
    keyResolverCache.set(bindingContext, keyResolver);
  }
};

export {
  arrayMap,
};
