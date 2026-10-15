import {BookOpen} from 'lucide-react';
import './book-loader.css';
export function LoadingMark({label}){return <div role="status" aria-live="polite" className="bc-book-loading"><div className="bc-loading-emblem" aria-hidden="true"><svg viewBox="0 0 64 64" className="bc-loading-ring"><circle cx="32" cy="32" r="28"/></svg><BookOpen size={23}/></div><p className="text-sm text-muted">{label}</p></div>;}
