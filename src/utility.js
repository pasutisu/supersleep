const extendObject = (dest, part) => {
  for (let key in part) dest[key] = part[key];
  return dest;
};

const isEmpty = (value) => value == null;
const notEmpty = (value) => value != null;

const isBoolean = (value) => typeof value === 'boolean';
const isString = (value) => typeof value === 'string';
const isNumber = (value) => typeof value === 'number';
const isFunction = (value) => typeof value === 'function';

const isObject = (value) => value instanceof Object && Object.getPrototypeOf(value) === Object.prototype;
const isArray = (value) => Array.isArray(value);

export {
  extendObject,
  isEmpty,
  notEmpty,
  isBoolean,
  isString,
  isNumber,
  isFunction,
  isObject,
  isArray,
};
