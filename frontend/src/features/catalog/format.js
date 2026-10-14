export const formatarMoeda = valor => Number(valor || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export const formatarData = data => data ? new Date(data).toLocaleDateString("pt-BR") : "Não informado";
