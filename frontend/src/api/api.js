import axios from "axios";
import {createOrderRequestKeys} from "./orderRequestKeys.js";

const api = axios.create({
  timeout: 30000,
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

let csrfToken = null;
let storage;try{storage=globalThis.sessionStorage;}catch{/* private browsing may block storage */}
const orderKeys=createOrderRequestKeys(storage);
api.setCsrfToken = value => { if(csrfToken&&!value)orderKeys.clear();csrfToken = value; };
api.interceptors.request.use(async(config) => {
  if (csrfToken && !["get", "head", "options"].includes((config.method || "get").toLowerCase())) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return orderKeys.attach(config);
});
api.interceptors.response.use(response=>{orderKeys.settle(response.config,true);return response;},error=>{
  const status=error.response?.status;
  orderKeys.settle(error.config,Boolean(status&&status>=400&&status<500&&![408,429].includes(status)));
  return Promise.reject(error);
});

export default api;
