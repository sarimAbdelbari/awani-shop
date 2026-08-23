import type { StylesConfig } from 'react-select'

export type SelectOption = {
  value: string
  label: string
}

export const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    borderRadius: '1.5rem',
    borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
    backgroundColor: 'color-mix(in oklab, var(--input) 30%, transparent)',
    boxShadow: state.isFocused
      ? '0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent)'
      : 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
    },
    fontSize: '0.875rem',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    opacity: state.isDisabled ? 0.5 : 1,
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 12px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: 'var(--foreground)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--foreground)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
    padding: '0 10px',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--muted-foreground)',
    padding: '0 4px',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    boxShadow: '0 8px 24px hsl(0 0% 0% / 0.08)',
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? 'var(--primary)'
      : state.isFocused
        ? 'var(--accent)'
        : 'transparent',
    color: state.isSelected ? 'var(--primary-foreground)' : 'var(--popover-foreground)',
    cursor: 'pointer',
    ':active': {
      backgroundColor: state.isSelected ? 'var(--primary)' : 'var(--accent)',
    },
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
  }),
}
