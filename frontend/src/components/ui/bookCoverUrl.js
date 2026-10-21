import coverAssets from './cover-assets.json';

export function resolveBookCoverUrl(value,apiUrl=import.meta.env.VITE_API_URL||'http://localhost:3000'){
  if(!value)return '';
  if(Object.hasOwn(coverAssets,value))return coverAssets[value];
  if(value.startsWith('/covers/'))return value;
  return /^https?:\/\//i.test(value)?value:`${apiUrl.replace(/\/$/,'')}/${value.replace(/^\/+/, '')}`;
}
