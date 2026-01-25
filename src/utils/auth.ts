export function getShopFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('shop');
}