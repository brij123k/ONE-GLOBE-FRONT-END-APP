import axios, { AxiosRequestConfig } from "axios";

/** 🔐 Get token */
const getToken = (): string => {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Authentication token missing");
  return token;
};

/** 📦 Headers */
const getHeaders = (isFormData = false) => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": isFormData
    ? "multipart/form-data"
    : "application/json",
});

/** ✅ Response handler */
const handleResponse = (res: any) => {
  if (res.status >= 200 && res.status < 300) {
    return res.data;
  }
  throw res;
};

/** ❌ Error handler */
const handleError = (error: any) => {
  throw (
    error?.response?.data ||
    error?.message ||
    "Something went wrong"
  );
};

/** 🚀 Core request */
export const apiRequest = async (
  config: AxiosRequestConfig,
  isFormData = false
) => {
  try {
    const response = await axios({
      ...config,
      headers: {
        ...getHeaders(isFormData),
        ...config.headers,
      },
    });

    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};
