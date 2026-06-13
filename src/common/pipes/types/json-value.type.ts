import { JSONObject } from '../interfaces';
import { JSONPrimitive } from './json-premitive.type';

export type JSONValue = JSONPrimitive | JSONObject | JSONValue[];
