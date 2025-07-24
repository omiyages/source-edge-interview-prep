
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			spacing: {
				'token-xs': 'var(--spacing-xs)',
				'token-sm': 'var(--spacing-sm)',
				'token-md': 'var(--spacing-md)',
				'token-lg': 'var(--spacing-lg)',
				'token-xl': 'var(--spacing-xl)',
				'token-2xl': 'var(--spacing-2xl)',
				'token-3xl': 'var(--spacing-3xl)',
				'token-4xl': 'var(--spacing-4xl)',
			},
			fontSize: {
				'xs': '14px',                // Changed from 12px to 14px
				'sm': '14px',                // Minimum font size
				'base': '16px',              // Standard body text size
				'lg': '18px',                // 18px
				'xl': '20px',                // 20px
				'2xl': '22px',               // 22px
				'3xl': '26px',               // 26px
				'4xl': '32px',               // 32px
				'token-xs': 'var(--text-xs)',
				'token-sm': 'var(--text-sm)',
				'token-base': 'var(--text-base)',
				'token-lg': 'var(--text-lg)',
				'token-xl': 'var(--text-xl)',
				'token-2xl': 'var(--text-2xl)',
				'token-3xl': 'var(--text-3xl)',
				'token-4xl': 'var(--text-4xl)',
			},
			boxShadow: {
				'token-xs': 'var(--shadow-xs)',
				'token-sm': 'var(--shadow-sm)',
				'token-md': 'var(--shadow-md)',
				'token-lg': 'var(--shadow-lg)',
				'token-xl': 'var(--shadow-xl)',
				'token-2xl': 'var(--shadow-2xl)',
				'token-inner': 'var(--shadow-inner)',
			},
			transitionDuration: {
				'fast': 'var(--duration-fast)',
				'normal': 'var(--duration-normal)',
				'slow': 'var(--duration-slow)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in var(--duration-normal) ease-out',
				'slide-up': 'slide-up var(--duration-normal) ease-out',
				'scale-in': 'scale-in var(--duration-normal) ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
