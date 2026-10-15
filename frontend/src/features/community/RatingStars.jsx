import {Star} from 'lucide-react';
export default function RatingStars({value=0}){const score=Math.max(0,Math.min(5,Number(value)||0));return <span role="img" aria-label={`${score} de 5 estrelas`} className="inline-flex items-center gap-1">{[1,2,3,4,5].map(n=><Star key={n} size={17} aria-hidden="true" className={n<=Math.round(score)?'fill-accent text-accent':'text-muted opacity-40'}/>)}</span>;}
