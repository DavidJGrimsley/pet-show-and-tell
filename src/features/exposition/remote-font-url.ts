export function googleFontsCssUrl(familyParam: string) {
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@400;500;700;800&display=swap`;
}

export function googleFontsListUrl(apiKey: string) {
  return (
    'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=' +
    encodeURIComponent(apiKey)
  );
}
