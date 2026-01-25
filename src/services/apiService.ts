import { apiRequest } from "./apiClient";

/** GET */
export const getApi = (
  url: string,
  params: any = {}
) =>
  apiRequest({
    method: "GET",
    url,
    params,
  });

/** POST */
export const postApi = (
  url: string,
  data: any = {},
  isFormData = false
) =>
  apiRequest(
    {
      method: "POST",
      url,
      data,
    },
    isFormData
  );

/** PUT */
export const putApi = (
  url: string,
  data: any = {},
  params: any = {}
) =>
  apiRequest({
    method: "PUT",
    url,
    data,
    params,
  });

/** PATCH */
export const patchApi = (
  url: string,
  data: any = {},
  isFormData = false
) =>
  apiRequest(
    {
      method: "PATCH",
      url,
      data,
    },
    isFormData
  );

/** DELETE */
export const deleteApi = (url: string) =>
  apiRequest({
    method: "DELETE",
    url,
  });
