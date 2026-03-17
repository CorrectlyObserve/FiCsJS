export default (str: string, context: 'attr' | 'text-content' = 'attr'): string => {
  const escapedTextContent: string = str.replace(
    /[&<>]/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] as string
  )

  return context === 'attr'
    ? escapedTextContent.replace(/["']/g, char => ({ '"': '&quot;', "'": '&#39;' })[char] as string)
    : escapedTextContent
}
