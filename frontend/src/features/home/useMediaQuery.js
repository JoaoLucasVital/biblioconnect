import { useEffect, useState } from "react";
export default function useMediaQuery(query) {
  const [matches,setMatches]=useState(()=>window.matchMedia(query).matches);
  useEffect(()=>{
    const media=window.matchMedia(query);
    const update=event=>setMatches(event.matches);
    media.addEventListener("change",update);
    return ()=>media.removeEventListener("change",update);
  },[query]);
  return matches;
}
