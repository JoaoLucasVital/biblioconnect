import {useCallback,useSyncExternalStore} from "react";
import {favoritesStore} from "./favorites-client.js";
export default function useFavorites(id){
  const subscribe=useCallback(callback=>favoritesStore.subscribe(id,callback),[id]);
  const snapshot=useCallback(()=>favoritesStore.snapshot(id),[id]);
  return useSyncExternalStore(subscribe,snapshot,snapshot);
}
