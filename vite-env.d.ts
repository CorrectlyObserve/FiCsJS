/// <reference types="vite/client" />

export interface WelyArgs {
  name: string
  parent: string
  html: string
  css: string
  events: { [key: string]: () => void }
}

export type BranchFunc = string | ((...args: string[]) => void)
