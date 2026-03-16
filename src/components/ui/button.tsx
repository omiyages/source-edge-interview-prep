
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline transition-colors",
        gradient: "text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Apply gradient styles directly via style prop for gradient variant
    const gradientStyle = variant === "gradient" ? {
      background: "linear-gradient(135deg, hsl(270 36% 71%), hsl(270 36% 58%))",
      boxShadow: "0 2px 8px hsl(270 36% 60% / 0.3)",
      ...(props.style || {})
    } : props.style;

    const gradientHoverClass = variant === "gradient" ?
      "hover:bg-none" : "";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), gradientHoverClass, className)}
        style={gradientStyle}
        ref={ref}
        {...props}
        onMouseEnter={(e) => {
          if (variant === "gradient") {
            e.currentTarget.style.background = "linear-gradient(135deg, hsl(270 36% 65%), hsl(270 36% 52%))";
            e.currentTarget.style.boxShadow = "0 4px 14px hsl(270 36% 60% / 0.4)";
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (variant === "gradient") {
            e.currentTarget.style.background = "linear-gradient(135deg, hsl(270 36% 71%), hsl(270 36% 58%))";
            e.currentTarget.style.boxShadow = "0 2px 8px hsl(270 36% 60% / 0.3)";
          }
          props.onMouseLeave?.(e);
        }}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
