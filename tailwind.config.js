/** Tailwind config for mohdshayan.com. Compile with `npm run build:css`. */
module.exports = {
  content: ['./index.html', './blog/**/*.html', './philanthropy/**/*.html', './demo/**/*.html', './404.html'],
  theme: {
    extend: {
      colors: {
        paper:   'var(--paper)',
        cream:   'var(--cream)',
        card:    'var(--card)',
        dark:    'var(--dark)',
        'dark-2':'#24211b',
        'dark-3':'var(--dark-3)',
        ink:     'var(--ink)',
        body:    'var(--body)',
        muted:   'var(--muted)',
        faint:   'var(--faint)',
        ondark:  '#f5f2ea',
        'ondark-soft': 'rgba(245,242,234,0.66)',
        hairline: 'var(--hairline)',
        'hairline-soft': 'var(--hairline-soft)',
        'hairline-strong': 'var(--hairline-strong)',
        'gold-deep':   'var(--gold-text)',
        gold:          '#c19a3d',
        'gold-bright': '#d9b45b',
        chipwash: 'var(--chipwash)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', '"Times New Roman"', 'serif'],
        sans:    ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: { content: '70rem' },
    },
  },
  corePlugins: { preflight: true },
}
