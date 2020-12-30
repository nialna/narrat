export function findDataHelper<T>(sourceObj: any, path: string): [T, string] {
  const keys = path.split('.');
  let obj = sourceObj;
  let end = keys.length - 1;
  let key = keys[0];
  let i = 0;
  for (i = 0; i < end; i++) {
    key = keys[i];
    if (!obj[key]) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  key = keys[i];
  return [obj, key];
}

export function setDataHelper<T>(sourceObj: any, path: string, value: T) {
  const [obj, key] = findDataHelper<T>(sourceObj, path);
  (obj as any)[key] = value;
}
