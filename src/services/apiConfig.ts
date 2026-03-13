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
  getStoredImageAltProduct:`${BASE_URL}/api/optimization/products?serviceName=imageALT`,
  getStoredImageNameProduct:`${BASE_URL}/api/optimization/products?serviceName=imageName`,
  getStoredProductType:`${BASE_URL}/api/optimization/products?serviceName=productType`,
  getStoredVendor:`${BASE_URL}/api/optimization/products?serviceName=vendor`,
  getStoredCollectionProduct:`${BASE_URL}/api/optimization/products?serviceName=collection`,
  getStoredTagsProduct:`${BASE_URL}/api/optimization/products?serviceName=tag`,

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

  // image ALT
  aiImageOptimization:`${BASE_URL}/api/image/ai/alt`,
  updateImageOptimization:`${BASE_URL}/api/image/alt/update`,

    // image ALT
  aiImageNameOptimization:`${BASE_URL}/api/image/ai/name`,
  updateImageNameOptimization:`${BASE_URL}/api/image/name/update`,

  // pricing
  priceCalulation:`${BASE_URL}/pricing/calculate`,
  priceApply:`${BASE_URL}/pricing/apply`,


  // sku
  updateSku:`${BASE_URL}/api/sku/update`,

  // product Type
  aiproductTypeOptimization:`${BASE_URL}/product-type/ai/generate`,
  updateProductType:`${BASE_URL}/product-type/update`,

  // vendor
  updateVendor:`${BASE_URL}/api/vendor/update`,

  // collection builder
  getCollectiononly:`${BASE_URL}/collection-builder/collections`,
  getSelectedProductCollection:`${BASE_URL}/collection-builder/product-collections`,
  aiOptimization:`${BASE_URL}/collection-builder/analyze-category`,
  createCollection:`${BASE_URL}/collection-builder/create-collection`,
  addProductToCollection:`${BASE_URL}/collection-builder/add-products`,


  //tags builder
  aitagOptimization:`${BASE_URL}/tags-builder/analyze-tags`,
  addtagsProducts:`${BASE_URL}/tags-builder/add-tags`,
  // revert funtion
  getRevertOptimizations:`${BASE_URL}/reviert`,
  saveRevertOptimizations:`${BASE_URL}/reviert/save`,

  // image alt
  
};

export default ApiConfig;
