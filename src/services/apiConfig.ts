// export const BASE_URL = "http://localhost:3000";
export const BASE_URL = "https://starfish-app-djdfs.ondigitalocean.app"
const ApiConfig = {
  baseUrl: BASE_URL,
  // shopify products
  getProducts: `${BASE_URL}/api/shop/products`,
  getVendors: `${BASE_URL}/api/shop/vendors`,
  getCollections: `${BASE_URL}/api/shop/collections`,
  getProductType:`${BASE_URL}/api/shop/product-types`,
  getTags:`${BASE_URL}/api/shop/tags`,
  getCategories:`${BASE_URL}/api/shop/categories`,
  customProduct: `${BASE_URL}/api/optimization/customproducts`,
  storeProduct:`${BASE_URL}/api/optimization/store`,
  getStoredProduct:`${BASE_URL}/api/optimization/products?serviceName=title`,
  getStoredDesProduct:`${BASE_URL}/api/optimization/products?serviceName=description`,
  getStoredMetaTitileProduct:`${BASE_URL}/api/optimization/products?serviceName=metaTitle`,
  getStoredMetaDecProduct:`${BASE_URL}/api/optimization/products?serviceName=metaDescription`,
  getStoredMetaHandleProduct:`${BASE_URL}/api/optimization/products?serviceName=handle`,
  getStorePriceProduct:`${BASE_URL}/api/optimization/products?serviceName=pricing`,
  getStoredskuProducts:`${BASE_URL}/api/optimization/products?serviceName=sku`,


  getStoredImageProduct:`${BASE_URL}/api/optimization/products?serviceName=image`,
  aiTitleOptimization:`${BASE_URL}/api/optimization/ai/title`,
  aiDescriptionOptimization:`${BASE_URL}/api/optimization/ai/description`,
  updateShopifyTitle:`${BASE_URL}/api/optimization/apply/title`,
  updateShopifyDescription:`${BASE_URL}/api/optimization/apply/description`,

  // meta
  aiMetaTitleOptimization:`${BASE_URL}/api/meta/title/optimize`,
  updateMetaTitleOptimization:`${BASE_URL}/api/meta/title/save`,

  aiMetadescriptionOptimization:`${BASE_URL}/api/meta/description/optimize`,
  updateMetaDescriptionOptimization:`${BASE_URL}/api/meta/description/save`,

  aiMetaHandleOptimization:`${BASE_URL}/api/meta/handle/optimize`,
  updateMetaHandleOptimization:`${BASE_URL}/api/meta/handle/save`,

  // image
  aiImageOptimization:`${BASE_URL}/seo/image/optimize`,
  updateImageOptimization:`${BASE_URL}/seo/image/save`,

  // pricing
  priceCalulation:`${BASE_URL}/pricing/calculate`,
  priceApply:`${BASE_URL}/pricing/apply`,


  // sku
  updateSku:`${BASE_URL}/api/sku/update`,
  // revert funtion
  getRevertOptimizations:`${BASE_URL}/reviert`,
  saveRevertOptimizations:`${BASE_URL}/reviert/save`

};

export default ApiConfig;
