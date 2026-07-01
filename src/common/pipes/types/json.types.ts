/** A JSON scalar value. */
export type JSONPrimitive = string | number | boolean | null;
/** A JSON object with string keys and {@link JSONValue} values. */
export type JSONObject = { [key: string]: JSONValue };
/** Any valid JSON value: primitive, object, or array. */
export type JSONValue = JSONPrimitive | JSONObject | JSONValue[];
