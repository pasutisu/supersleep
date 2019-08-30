import { isEmpty, notEmpty } from '../utility';
import { ASSEMBLY_IDENTIFIER } from '../const';
import { createNode, updateNode, removeNode } from './dom';

const patch = (instance, parentNode, rootNode) => {
  if (isEmpty(rootNode) || rootNode[ASSEMBLY_IDENTIFIER] !== instance.identifier) {
    parentNode.insertBefore(createNode(instance), rootNode);
    if (notEmpty(rootNode)) {
      removeNode(rootNode);
    }
  }
  else {
    updateNode(instance, rootNode);
  }
};

export {
  patch,
};
