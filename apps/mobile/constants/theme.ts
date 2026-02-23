/**
 * zZLean UI — strict adherence to UI_GUIDELINES.md
 */
export const colors = {
  primary: '#E4FF50',
  background: '#FFFFFF',
  surface: '#F6F8FC',
  text: '#111827',
  textSubtle: '#6B7280',
  accentBlack: '#000000',
  border: '#F0F0F0',
} as const;

export const spacing = {
  container: 24,
  tile: 24,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  tile: 24,
  tileLarge: 32,
  icon: 12,
  button: 12,
} as const;

export const shadow = {
  tile: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
} as const;

export const typography = {
  heading: {
    fontWeight: '700' as const,
    letterSpacing: -0.02,
  },
  headingBold: {
    fontWeight: '800' as const,
    letterSpacing: -0.02,
  },
} as const;
