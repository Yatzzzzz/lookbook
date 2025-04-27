// Type declarations for UI components
declare module '@/components/ui/select' {
  import * as React from 'react'
  export const Select: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const SelectGroup: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const SelectValue: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>
  export const SelectTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>
  export const SelectContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const SelectLabel: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLLabelElement> & React.RefAttributes<HTMLLabelElement>>
  export const SelectItem: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const SelectSeparator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
}

declare module '@/components/ui/scroll-area' {
  import * as React from 'react'
  export const ScrollArea: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const ScrollBar: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
}

declare module '@/components/ui/dialog' {
  import * as React from 'react'
  export const Dialog: React.FC<React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>>
  export const DialogTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>
  export const DialogContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>
  export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>
  export const DialogDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>
}

declare module '@/components/ui/switch' {
  import * as React from 'react'
  export const Switch: React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
      checked?: boolean;
      onCheckedChange?: (checked: boolean) => void;
    } & React.RefAttributes<HTMLInputElement>
  >
} 