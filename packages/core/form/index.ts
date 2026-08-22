export { defineFormSurface, formInternals } from './surface'
export { submitForm } from './submit'
export { syncForm } from './sync'

export const touchedControls: WeakSet<HTMLElement> = new WeakSet()
