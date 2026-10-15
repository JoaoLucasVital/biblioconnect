import { useEffect, useImperativeHandle, useRef, useState } from "react";
import useMediaQuery from "../../features/home/useMediaQuery.js";
import "./fade-input.css";

/** Native editing remains authoritative; the short-lived mirror is purely visual. */
export default function FadeInput({ref:forwardedRef,as:Control="input",type="text",value,defaultValue,className="",style,
  onChange,onKeyDown,onPointerDown,onSelect,onScroll,onBlur,onCompositionStart,onCompositionEnd,...props}) {
  const inputRef=useRef(null);
  const previous=useRef(String(value??defaultValue??""));
  const composing=useRef(false);
  const timer=useRef(null);
  const sequence=useRef(0);
  const [mirror,setMirror]=useState(null);
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  const forced=useMediaQuery("(forced-colors: active)");
  useImperativeHandle(forwardedRef,()=>inputRef.current);
  useEffect(()=>{if(value!==undefined)previous.current=String(value);},[value]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const active=mirror && !reduced && !forced && (value===undefined || mirror.value===String(value));
  function cancel() { clearTimeout(timer.current);setMirror(null); }
  function change(event) {
    const input=event.target,next=input.value,before=previous.current;
    previous.current=next;
    cancel();
    const added=next.slice(before.length);
    const native=event.nativeEvent;
    const supported=["text","search","email","tel","url"].includes(type) && !reduced && !forced;
    const atEnd=input.selectionStart===null||(input.selectionStart===next.length&&input.selectionEnd===next.length);
    const append=next.startsWith(before) && added.length>0 && added.length<=2 && atEnd;
    if(supported && append && !composing.current && !native.isComposing && native.inputType==="insertText" && input.scrollWidth<=input.clientWidth && input.scrollHeight<=input.clientHeight+1){
      const cs=getComputedStyle(input);
      if(cs.direction!=="rtl"){
        const styles=Object.fromEntries(["fontFamily","fontSize","fontWeight","fontStyle","fontStretch","letterSpacing","lineHeight","textAlign","paddingTop","paddingRight","paddingBottom","paddingLeft","textIndent"].map(key=>[key,cs[key]]));
        styles.color=mirror?.styles.color||cs.color;
        setMirror({value:next,before,added,styles,key:++sequence.current});
        timer.current=setTimeout(()=>setMirror(null),180);
      }
    }
    onChange?.(event);
  }
  return <span className="bc-fade-field" data-multiline={Control==="textarea"?"true":undefined}>
    <Control {...props} ref={inputRef} type={Control==="input"?type:undefined} value={value} defaultValue={defaultValue} className={className}
      data-fading={active?"true":undefined} style={{...style,...(active?{color:"transparent",WebkitTextFillColor:"transparent"}:{})}}
      onChange={change}
      onKeyDown={event=>{if(event.ctrlKey||event.metaKey||event.altKey||event.key.length!==1)cancel();onKeyDown?.(event);}}
      onPointerDown={event=>{cancel();onPointerDown?.(event);}}
      onSelect={event=>{if(event.target.selectionStart!==null&&(event.target.selectionStart!==event.target.value.length || event.target.selectionEnd!==event.target.value.length))cancel();onSelect?.(event);}}
      onScroll={event=>{cancel();onScroll?.(event);}}
      onBlur={event=>{cancel();onBlur?.(event);}}
      onCompositionStart={event=>{composing.current=true;cancel();onCompositionStart?.(event);}}
      onCompositionEnd={event=>{composing.current=false;previous.current=event.target.value;cancel();onCompositionEnd?.(event);}}/>
    {active && <span className="bc-input-mirror" style={mirror.styles} aria-hidden="true">{mirror.before}<span key={mirror.key} className="bc-input-new-letter">{mirror.added}</span></span>}
  </span>;
}
