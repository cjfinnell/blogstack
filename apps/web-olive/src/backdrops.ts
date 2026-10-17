/**
 * Historic maps shown, blurred, behind a review's card on wide screens, keyed
 * by the review's city (lower-cased). A city with no entry gets the plain
 * --backdrop colour.
 *
 * Every map here must be free to use on a site that takes tips. US Geological
 * Survey sheets are works of the US government and in the public domain.
 * Collections licensed for non-commercial use only (David Rumsey, for one)
 * are not.
 *
 * Files are made with scripts/make-map-backdrop.ts; the arguments used are
 * noted beside each so a sheet can be re-cropped later.
 */

export interface MapBackdrop {
  light: string;
  dark: string;
}

export const CITY_BACKDROPS: Record<string, MapBackdrop> = {
  // USGS, Colorado, East Denver sheet, 1890, 1:125,000 (scan 402931), from the
  // USGS Historical Topographic Map Collection via mapx.co.
  // make-map-backdrop <scan> denver-1890 0.075 0.33 0.8 0.45
  denver: {
    light: '/backdrops/denver-1890-light.webp',
    dark: '/backdrops/denver-1890-dark.webp',
  },
};

export function cityBackdrop(city: string | undefined): MapBackdrop | undefined {
  return city ? CITY_BACKDROPS[city.trim().toLowerCase()] : undefined;
}
