import { escape, removeTrailingSlash } from '../../core/helpers'
import { indent, joinLines } from '../helpers'

/**
 * @remarks
 * Omit lastmod, priority and changefreq
 * as build date is not the true update date and search engines ignore the last two.
 */
export const buildSitemap = ({ origin, paths }: { origin: string; paths: string[] }): string =>
  joinLines([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      path =>
        `${indent()}<url><loc>${escape(`${removeTrailingSlash(origin)}${path}`, 'xml')}</loc></url>`
    ),
    '</urlset>',
    ''
  ])
