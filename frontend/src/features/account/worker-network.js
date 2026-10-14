/** Keep this portrait-only worker offline except for its own hosted model/WASM.
 * MediaPipe 1.1.1 initializes a metrics sender; it must not reach Google.
 */
export function restrictWorkerNetwork(scope){
  const local=value=>{
    const url=new URL(typeof value==="string"||value instanceof URL?value:value.url,scope.location.href);
    if(url.origin!==scope.location.origin)throw new Error("O processador de foto só acessa recursos locais.");
  };
  const fetch=scope.fetch.bind(scope);
  scope.fetch=async(input,options)=>{local(input);return fetch(input,{...options,redirect:"error"});};
  if(scope.XMLHttpRequest){
    const Original=scope.XMLHttpRequest;
    scope.XMLHttpRequest=class extends Original{open(method,url,...rest){local(url);return super.open(method,url,...rest);}};
  }
}
