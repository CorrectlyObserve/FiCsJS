export type FromEntries<T extends readonly (readonly [PropertyKey, unknown])[]> = {
  [E in T[number] as E[0]]: E[1]
}
