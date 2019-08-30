const stylePropsCache = new WeakMap();

const styleMap = (nextStyleProps) => (element, attrName) => {
  let propName;
  let prevStyleProps = stylePropsCache.get(element) || {};

  for (propName in prevStyleProps) {
    if (!(propName in nextStyleProps)) {
      element.style[propName] = '';
    }
  }

  for (propName in nextStyleProps) {
    if (prevStyleProps[propName] !== nextStyleProps[propName]) {
      element.style[propName] = nextStyleProps[propName];
    }
  }

  stylePropsCache.set(element, nextStyleProps);
};

export {
  styleMap,
};
