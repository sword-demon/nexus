import type * as Monaco from 'monaco-editor'

export const NEXUS_MONACO_THEME = 'nexus-diff'

let themeDefined = false

export function defineNexusMonacoTheme(monaco: typeof Monaco): void {
  if (themeDefined) {
    monaco.editor.setTheme(NEXUS_MONACO_THEME)
    return
  }

  monaco.editor.defineTheme(NEXUS_MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#10241b',
      'editor.foreground': '#d4e8dc',
      'editorLineNumber.foreground': '#7a9e8a',
      'editorLineNumber.activeForeground': '#d4e8dc',
      'diffEditor.insertedTextBackground': '#5b8a7233',
      'diffEditor.removedTextBackground': '#e85d3a33',
      'diffEditor.insertedLineBackground': '#5b8a721f',
      'diffEditor.removedLineBackground': '#e85d3a1f',
      'scrollbarSlider.background': '#7a9e8a33',
      'scrollbarSlider.hoverBackground': '#7a9e8a55',
    },
  })
  themeDefined = true
  monaco.editor.setTheme(NEXUS_MONACO_THEME)
}
