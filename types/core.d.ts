export type Values = Array<NodeValue | AttrValue>;
export type NodeValue = number | string | Instance | NodeOperator;
export type AttrValue = boolean | number | string | Function | AttrOperator;

export type NodeOperator = (binding: Binding, bindingContext: BindingContext) => void;
export type AttrOperator = (element: Element, attrName: string) => void;

export interface Instance {
  identifier: string,
  fragment: DocumentFragment,
  bindings: Array<Binding>,
  values: Values,
}
export interface Binding {
  index: number,
  type: BindingType,
  target: string,
}
export interface BindingContext {
  parent: Node,
  head: Node,
  tail: Node,
  value: AttrValue,
}
export enum BindingType {
  NODE_BINDING = 0,
  ATTR_BINDING = 1,
}

export function html(tpls: TemplatestringsArray, vals: Values): Instance;
export function svg(tpls: TemplatestringsArray, vals: Values): Instance;
export function patch(instance: Instance, parentNode: Node, rootNode: Node): void;
