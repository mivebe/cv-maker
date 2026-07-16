/**
 * A banner is a heading-only block (a page-2 title). Its content is exactly
 * the title and subtitle the section shell already edits, so the body only
 * explains what the reader will get.
 */
export function BannerEditor() {
  return (
    <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
      A banner renders its title and subtitle as a centered full-width heading
      (a page divider). It has no items — edit the text via the section title
      above and the subtitle in the section settings.
    </p>
  )
}
