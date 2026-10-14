export const publicItems = [{label:"Início",to:"/"},{label:"Catálogo",to:"/livros"}];
export const clientItems = [{label:"Meus pedidos",to:"/meus-pedidos"},{label:"Atendimento",to:"/chat"},{label:"Perfil",to:"/perfil"}];
export const adminGroups = [
  {label:"Visão geral",items:[{label:"Painel",to:"/admin"}]},
  {label:"Acervo",items:[{label:"Livros",to:"/admin/livros"},{label:"Novo livro",to:"/adicionar-livro"},{label:"Avaliações",to:"/admin/avaliacoes"}]},
  {label:"Operações",items:[{label:"Pedidos",to:"/admin/pedidos"},{label:"Entregas",to:"/admin/entregas"},{label:"Atrasos",to:"/admin/atrasos"},{label:"Atendimento",to:"/admin/chat"}]},
  {label:"Gestão",items:[{label:"Financeiro",to:"/admin/financeiro"},{label:"Usuários",to:"/admin/usuarios"}]},
];
