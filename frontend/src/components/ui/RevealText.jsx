import "./reveal-text.css";

export default function RevealText({as:Element="span",children,className=""}) {
  const text=String(children??"");
  const words=text.split(" ");
  let position=0;
  const step=Math.min(28,400/Math.max(1,Array.from(text).length-1));
  return <Element className={`bc-reveal ${className}`}>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">{words.map((word,index)=><span key={index} className="bc-reveal-word">{Array.from(word).map((char,i)=><span key={i} style={{animationDelay:`${position++*step}ms`}}>{char}</span>)}{index<words.length-1?" ":""}</span>)}</span>
  </Element>;
}
