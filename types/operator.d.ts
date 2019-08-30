import { Instance, NodeOperator, AttrOperator } from './core';

export type Key = number | string;

export type InstanceFrom<T> = (item: T) => Instance;
export type KeyFrom<T> = (item: T) => Key;

export interface StyleProps {
  readonly [name: string]: string | null;
}

export function arrayMap<T>(items: T[], instanceFrom: InstanceFrom<T>, keyFrom?: KeyFrom<T>): NodeOperator;
export function styleMap(nextStyleProps: StyleProps): AttrOperator;
