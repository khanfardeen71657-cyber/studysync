import { useEffect } from 'react'

export default function PageTheme({ theme = 'default' }) {
  useEffect(() => {
    const classesToRemove = []
    document.body.classList.forEach((cls) => {
      if (cls.startsWith('page-theme-')) {
        classesToRemove.push(cls)
      }
    })
    classesToRemove.forEach((cls) => document.body.classList.remove(cls))
    document.body.classList.add(`page-theme-${theme}`)

    return () => {
      document.body.classList.remove(`page-theme-${theme}`)
    }
  }, [theme])

  return null
}