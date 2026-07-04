import { Menu, app } from 'electron'
import { createManagedWindow, focusMainWindow } from '../window/manager'
import type { MenuItemConstructorOptions } from 'electron'

export function installAppMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          id: 'new-window',
          label: '新建窗口',
          accelerator: 'CommandOrControl+Shift+N',
          click: () => {
            void createManagedWindow()
          },
        },
        { type: 'separator' },
        {
          label: '显示窗口',
          click: () => {
            focusMainWindow()
          },
        },
        { type: 'separator' },
        { role: process.platform === 'darwin' ? 'close' : 'quit' },
      ],
    },
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
