const flex = { display: 'flex' } as const
const justifyCenter = { justifyContent: 'center' } as const
const alignCenter = { alignItems: 'center' } as const

export const flexCenterXY = { ...flex, ...justifyCenter, ...alignCenter } as const
export const flexCenterX = { ...flex, ...justifyCenter } as const
export const flexCenterY = { ...flex, ...alignCenter } as const
