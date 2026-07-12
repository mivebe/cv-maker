/**
 * Dialing codes for the phone field. The code is stored separately from the
 * number (basics.phoneCode) so it can be picked from a list instead of typed,
 * and so the rendered CV and the `tel:` link agree on the international form.
 *
 * Not exhaustive by design — a hand-picked list of the countries a user of this
 * tool is likely to apply from, plus whatever they type in themselves.
 */
export interface DialCode {
  /** ISO 3166-1 alpha-2, used only as a stable key. */
  iso: string
  country: string
  code: string
}

export const DIAL_CODES: DialCode[] = [
  { iso: 'BG', country: 'Bulgaria', code: '+359' },
  // One entry per code: two items sharing a value confuse a Radix Select.
  { iso: 'US', country: 'United States / Canada', code: '+1' },
  { iso: 'GB', country: 'United Kingdom', code: '+44' },
  { iso: 'DE', country: 'Germany', code: '+49' },
  { iso: 'NL', country: 'Netherlands', code: '+31' },
  { iso: 'FR', country: 'France', code: '+33' },
  { iso: 'ES', country: 'Spain', code: '+34' },
  { iso: 'IT', country: 'Italy', code: '+39' },
  { iso: 'PT', country: 'Portugal', code: '+351' },
  { iso: 'IE', country: 'Ireland', code: '+353' },
  { iso: 'CH', country: 'Switzerland', code: '+41' },
  { iso: 'AT', country: 'Austria', code: '+43' },
  { iso: 'BE', country: 'Belgium', code: '+32' },
  { iso: 'DK', country: 'Denmark', code: '+45' },
  { iso: 'SE', country: 'Sweden', code: '+46' },
  { iso: 'NO', country: 'Norway', code: '+47' },
  { iso: 'FI', country: 'Finland', code: '+358' },
  { iso: 'PL', country: 'Poland', code: '+48' },
  { iso: 'CZ', country: 'Czechia', code: '+420' },
  { iso: 'RO', country: 'Romania', code: '+40' },
  { iso: 'GR', country: 'Greece', code: '+30' },
  { iso: 'TR', country: 'Türkiye', code: '+90' },
  { iso: 'UA', country: 'Ukraine', code: '+380' },
  { iso: 'AU', country: 'Australia', code: '+61' },
  { iso: 'NZ', country: 'New Zealand', code: '+64' },
  { iso: 'IN', country: 'India', code: '+91' },
  { iso: 'SG', country: 'Singapore', code: '+65' },
  { iso: 'AE', country: 'United Arab Emirates', code: '+971' },
  { iso: 'IL', country: 'Israel', code: '+972' },
  { iso: 'ZA', country: 'South Africa', code: '+27' },
  { iso: 'BR', country: 'Brazil', code: '+55' },
  { iso: 'JP', country: 'Japan', code: '+81' },
]

/** The phone as shown on the CV: "+359 88 123 4567". */
export function displayPhone(code: string, phone: string): string {
  return [code.trim(), phone.trim()].filter(Boolean).join(' ')
}

/** The phone as a `tel:` target — digits and a leading `+` only. */
export function telHref(code: string, phone: string): string {
  const raw = displayPhone(code, phone)
  const digits = raw.replace(/[^\d+]/g, '')
  return `tel:${digits}`
}
