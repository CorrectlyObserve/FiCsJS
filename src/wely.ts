import {  } from '@/libs/types'
import Class from '@/class'

export const  = <T, D, P>({
  name,
  className,
  dependencies,
  inheritances,
  data,
  html,
  css,
  slot,
  events
}: <T, D, P>) =>
  new Class({
    name,
    className,
    dependencies,
    inheritances,
    data,
    html,
    css,
    slot,
    events
  })
