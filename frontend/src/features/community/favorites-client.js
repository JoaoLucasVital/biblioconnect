import api from "../../api/api.js";
import {createFavoritesStore} from "./favoritesStore.js";
export const favoritesStore=createFavoritesStore({api,apiBase:import.meta.env.VITE_API_URL||"http://localhost:3000",createEventSource:url=>new EventSource(url)});
