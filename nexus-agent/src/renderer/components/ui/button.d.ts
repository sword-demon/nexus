import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from 'react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type ButtonVariant = 'default' | 'accent' | 'ghost' | 'outline'
export type ButtonSize = 'default' | 'sm' | 'icon' | 'icon-sm'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

export const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<ElementRef<'button'>>
>