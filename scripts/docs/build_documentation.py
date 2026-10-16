"""Build public documentation from tracked source only; never reads credentials.

Requires reportlab. Run from the repository root:
    python scripts/docs/build_documentation.py
"""
from __future__ import annotations
import html
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / 'docs'
OUTPUT = ROOT / 'output/pdf'
DIAGRAMS = DOCS / 'diagrams'
DATE = '15/10/2026'
INK = '#102A43'
ACCENT = '#DD8205'
MUTED = '#506579'
SOFT = '#F0F4F7'
SCALAR = {'String', 'Int', 'Float', 'Boolean', 'DateTime', 'BigInt', 'Decimal', 'Json', 'Bytes'}

MODEL_INFO = {
    'Usuario': 'Conta local: dados pessoais, endereço, papel, confirmação, foto e recuperação. Senha opcional permite contas inicialmente Google.',
    'Livro': 'Título do acervo: bibliografia, capa, preços, regras de aluguel, estoque e exibição.',
    'Pedido': 'Uma operação de um usuário para um livro. Separa situação do pedido, pagamento, entrega e extensão.',
    'Pagamento': 'Registro financeiro/tentativa vinculado ao pedido, inclusive extensão. Não contém cartão ou CVV.',
    'IdentidadeExterna': 'Vínculo do identificador do provedor com a conta local.',
    'Sessao': 'Sessão autenticada com hashes de tokens, rotação, expiração e revogação.',
    'DesafioGoogle': 'Desafio temporário e de uso único anterior à conclusão do login Google. Não possui FK para Usuario.',
    'Favorito': 'Relação usuário/livro salvo, com unicidade por par.',
    'EventoFavorito': 'Evento persistido de contagem por livro; serve à sincronização SSE com cursor.',
    'EventoGateway': 'Registro de evento do provedor financeiro, deduplicado pelo par gateway/eventId.',
    'OperacaoIdempotente': 'Proteção de retries por usuário/escopo/chave. resultadoId é referência lógica, não FK.',
    'LimiteOperacao': 'Contador de janela por escopo/chave derivada. Não possui FK direta para usuário.',
    'Avaliacao': 'Nota/comentário de usuário sobre livro, sujeitos à moderação.',
    'Conversa': 'Atendimento iniciado por um usuário, aberto ou encerrado.',
    'MensagemChat': 'Mensagem de uma conversa e seu autor real, com papel e indicação de leitura.',
}

def models():
    source = (ROOT / 'prisma/schema.prisma').read_text(encoding='utf-8')
    result = []
    for name, body in re.findall(r'^model\s+(\w+)\s*\{(.*?)^\}', source, re.M | re.S):
        fields, relations, constraints = [], [], []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith('//'):
                continue
            if line.startswith('@@'):
                constraints.append(line)
                continue
            match = re.match(r'(\w+)\s+([\w\[\]?]+)\s*(.*)', line)
            if not match:
                continue
            field, kind, attrs = match.groups()
            if kind.rstrip('?[]') in SCALAR:
                fields.append((field, kind, attrs))
            else:
                relations.append((field, kind, attrs))
        result.append({'name': name, 'fields': fields, 'relations': relations, 'constraints': constraints})
    assert len(result) == 15
    return result

def clean(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')

def schema_annex(data):
    out = ['# Anexo A | Dicionário de dados', '',
           f'Gerado do schema Prisma do repositório. Edição documental: {DATE}.', '',
           'Inclui todos os campos escalares e relações dos 15 modelos. `?` significa opcional; `[]`, coleção. '
           '`@id` indica chave primária; `@unique`/`@@unique`, unicidade; `@@index`, índice. '
           'Campos de relação do Prisma não são colunas duplicadas: a FK é o campo escalar indicado em `fields`.', '',
           'As declarações abaixo são estrutura de código, não inspeção de drift da produção. '
           'Nenhum valor de usuário, senha, hash real ou conexão privada é incluído.', '']
    for model in data:
        name = model['name']
        out += [f'## {name}', '', MODEL_INFO[name], '',
                '| Campo | Tipo Prisma | Aceita nulo | Regras declaradas |',
                '| --- | --- | --- | --- |']
        for field, kind, attrs in model['fields']:
            out.append(f'| `{field}` | {kind} | {"Sim" if "?" in kind else "Não"} | {clean(attrs) or "-"} |')
        if model['constraints']:
            out += ['', 'Índices e unicidade composta:', '']
            out += [f'- `{line}`' for line in model['constraints']]
        if model['relations']:
            out += ['', 'Relações declaradas:', '', '| Campo de relação | Destino | Definição |', '| --- | --- | --- |']
            for field, kind, attrs in model['relations']:
                out.append(f'| `{field}` | {kind} | {clean(attrs) or "Coleção/relação inversa; FK declarada na entidade dependente."} |')
        out.append('')
    (DOCS / 'dicionario-de-dados.md').write_text('\n'.join(out), encoding='utf-8')

def access(path, method):
    if path == '/internal/cron': return 'Segredo do cron'
    if path.startswith('/webhooks/'): return 'Validação do provedor'
    if path.startswith('/admin/') or path.startswith('/isbn/') or path.startswith('/media/book-'): return 'ADMIN / regras do handler'
    if path.startswith('/livros'):
        return 'Público ou sessão opcional' if method == 'GET' else ('Autenticado' if path.endswith(('/salvo', '/avaliacoes')) else 'ADMIN')
    if path.startswith('/auth/google/link') or path.startswith('/auth/logout') or path.startswith('/auth/session'):
        return 'Sessão / regras do handler'
    if path.startswith(('/me', '/chat', '/pedidos', '/entrega', '/integracoes')) or path in ['/comprar', '/alugar', '/reservar']:
        return 'Autenticado; dono/ADMIN conforme handler'
    return 'Público; limites/regras no handler'

def api_annex():
    files = [ROOT / 'server.js'] + sorted((ROOT / 'src/routes').glob('*.js')) + [ROOT / 'src/middleware/auth.js']
    rows = []
    for file in files:
        source = file.read_text(encoding='utf-8')
        for match in re.finditer(r'\b(?:app|router)\.(get|post|patch|delete|put)\s*\(\s*["\']([^"\']+)["\']', source):
            method, path = match.groups()
            line = source.count('\n', 0, match.start()) + 1
            rows.append((path, method.upper(), file.relative_to(ROOT).as_posix(), line))
    rows = sorted(set(rows))
    out = ['# Anexo B | Mapa de rotas', '',
           f'Inventário estático do código, edição {DATE}. {len(rows)} declarações HTTP encontradas.', '',
           'Na produção, prefixar os endpoints abaixo com `/api`. Os caminhos React da segunda parte não recebem esse prefixo. '
           'A classificação de acesso é um resumo: não substitui o middleware/handler. Este inventário não é um contrato OpenAPI de payloads e respostas.', '',
           '## Endpoints HTTP', '', '| Método | Caminho no backend | Acesso resumido | Origem |', '| --- | --- | --- | --- |']
    for path, method, file, line in rows:
        out.append(f'| {method} | `{path}` | {access(path, method)} | {file}:{line} |')
    out += ['', '## Observações operacionais', '',
            '- Endpoints internos, upload por ticket e webhooks têm validações específicas. Um endereço público não significa operação sem autorização.',
            '- /admin/resetar-sistema é destrutivo; não utilizar em deploy nem em testes de produção.',
            '- /pedidos/:id/simular-pagamento é bloqueado em produção.',
            '- O pagamento executável é Mercado Pago; não há endpoints Stripe neste inventário.',
            '- Eventos de favoritos usam text/event-stream; uploads usam formato próprio do handler.', '', '## Rotas da interface', '',
            '| Grupo | Caminho React |', '| --- | --- |']
    source = (ROOT / 'frontend/src/routes.js').read_text(encoding='utf-8')
    for group, label in [('publicRoutes', 'Público'), ('clientRoutes', 'Autenticado'), ('adminRoutes', 'ADMIN')]:
        body = re.search(r'export const ' + group + r'\s*=\s*\[(.*?)\];', source, re.S).group(1)
        for path in re.findall(r'path:\s*["\']([^"\']+)', body):
            out.append(f'| {label} | `{path}` |')
    out += ['', 'Guarda de navegação não substitui autorização na API. Rotas não encontradas exibem a página 404 da SPA.', '']
    (DOCS / 'api-rotas.md').write_text('\n'.join(out), encoding='utf-8')
    return len(rows)

# Shared vector specification: used both in SVG files and in PDF flowables.
def diagram_specs():
    # Nodes: x, y, width, height, title, body lines, accent boolean.
    architecture = dict(width=1000, height=570, nodes=[
        (320, 10, 360, 75, 'Navegador', ['Leitor ou administração | HTTPS'], False),
        (40, 135, 390, 88, 'Vercel | Frontend', ['React + Vite + Tailwind', 'SPA, assets e navegação'], False),
        (570, 135, 390, 88, 'Vercel | API /api', ['Express + serviços + Prisma', 'Sessão, autorização e regras'], False),
        (40, 290, 390, 88, 'Vercel Blob', ['Capas públicas | retratos privados', 'Bytes separados do banco'], False),
        (570, 290, 390, 88, 'Neon | PostgreSQL', ['15 entidades relacionais', 'Registros, sessões e transações'], False),
        (20, 460, 220, 78, 'Google', ['Identidade e ISBN'], False),
        (265, 460, 220, 78, 'Gmail SMTP', ['E-mails transacionais'], False),
        (510, 460, 220, 78, 'HeiGIT / ORS', ['Geocodificação e rota'], False),
        (755, 460, 220, 78, 'Mercado Pago', ['Código legado; pendente'], True),
    ], edges=[
        ([(405, 85), (235, 135)], 'Páginas', (250, 107), False),
        ([(595, 85), (765, 135)], 'API', (745, 107), False),
        ([(430, 178), (570, 178)], 'JSON / SSE', (455, 164), False),
        ([(765, 223), (765, 290)], 'Prisma / TLS', (780, 260), False),
        ([(570, 202), (495, 202), (495, 334), (430, 334)], 'Mídia', (447, 275), False),
        ([(960, 200), (990, 200), (990, 420), (130, 420)], 'Chamadas do backend', (390, 407), False),
        ([(130, 420), (130, 460)], '', (0, 0), False),
        ([(375, 420), (375, 460)], '', (0, 0), False),
        ([(620, 420), (620, 460)], '', (0, 0), False),
        ([(865, 420), (865, 460)], '', (0, 0), True),
    ])
    business = dict(width=940, height=730, nodes=[
        (25, 15, 260, 86, 'Usuario', ['PK id | email único', 'Conta e papel'], False),
        (655, 15, 260, 86, 'Livro', ['PK id | ISBN opcional único', 'Acervo, preço e estoque'], False),
        (25, 205, 260, 86, 'Favorito', ['FK usuarioId + livroId', 'Par único'], False),
        (340, 205, 260, 86, 'Avaliacao', ['FK usuarioId + livroId', 'Par único; moderação'], False),
        (655, 205, 260, 86, 'Pedido', ['FK usuarioId + livroId', 'Uma unidade por pedido'], False),
        (25, 405, 260, 86, 'Conversa', ['FK usuarioId', 'Atendimento'], False),
        (340, 405, 260, 86, 'EventoFavorito', ['FK livroId | PK BigInt', 'Contagem para SSE'], False),
        (655, 405, 260, 86, 'Pagamento', ['FK pedidoId', 'Uma ou mais tentativas'], False),
        (25, 605, 260, 86, 'MensagemChat', ['FK conversaId + remetenteId', 'Autor é um Usuario'], False),
        (655, 605, 260, 86, 'EventoGateway', ['FK pagamentoId opcional', 'Único gateway/eventId'], False),
    ], edges=[
        ([(100, 101), (100, 205)], '1:N', (110, 160), False),
        ([(210, 101), (400, 205)], '1:N', (290, 148), False),
        ([(285, 55), (615, 55), (615, 165), (710, 205)], '1:N', (430, 40), False),
        ([(720, 101), (230, 205)], '1:N', (510, 151), True),
        ([(775, 101), (555, 205)], '1:N', (660, 151), True),
        ([(860, 101), (860, 205)], '1:N', (870, 160), True),
        ([(25, 65), (10, 65), (10, 445), (25, 445)], '1:N', (15, 350), False),
        ([(155, 491), (155, 605)], '1:N', (167, 555), False),
        ([(65, 101), (0, 101), (0, 665), (25, 665)], '', (0, 0), False),
        ([(915, 55), (930, 55), (930, 355), (470, 355), (470, 405)], '1:N livro', (490, 341), True),
        ([(785, 291), (785, 405)], '1:N', (800, 350), False),
        ([(785, 491), (785, 605)], '1:N / FK opcional', (663, 555), False),
    ])
    technical = dict(width=940, height=540, nodes=[
        (340, 10, 260, 82, 'Usuario', ['Conta autenticada'], False),
        (25, 195, 260, 90, 'IdentidadeExterna', ['FK usuarioId', 'Único provider/subject'], False),
        (340, 195, 260, 90, 'Sessao', ['FK usuarioId', 'Hashes e expiração'], False),
        (655, 195, 260, 90, 'OperacaoIdempotente', ['FK usuarioId', 'Retry e fingerprint'], False),
        (25, 405, 260, 90, 'DesafioGoogle', ['Sem FK para Usuario', 'Nonce/cookie antes do login'], True),
        (340, 405, 260, 90, 'LimiteOperacao', ['Sem FK para Usuario', 'Janela e chave derivada'], True),
        (655, 405, 260, 90, 'Pedido', ['resultadoId lógico', 'Sem FK nesse vínculo'], True),
    ], edges=[
        ([(390, 92), (155, 195)], '1:N', (245, 147), False),
        ([(470, 92), (470, 195)], '1:N', (482, 150), False),
        ([(550, 92), (785, 195)], '1:N', (665, 147), False),
        ([(785, 285), (785, 405)], 'Referência lógica', (665, 350), True),
    ])
    return {'arquitetura': architecture, 'relacionamentos-negocio': business, 'relacionamentos-tecnicos': technical}

def svg_diagram(spec):
    w, h = spec['width'], spec['height']
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img">',
         '<title>Diagrama técnico do BiblioConnect</title>',
         '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#526B80"/></marker></defs>',
         '<rect width="100%" height="100%" fill="white"/>']
    for points, label, pos, dashed in spec['edges']:
        color = ACCENT if dashed else '#526B80'
        dash = ' stroke-dasharray="7 5"' if dashed else ''
        s.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in points)}" fill="none" stroke="{color}" stroke-width="2"{dash} marker-end="url(#arr)"/>')
        if label:
            s.append(f'<text x="{pos[0]}" y="{pos[1]}" fill="{color}" font-family="Arial,sans-serif" font-size="16">{escape(label)}</text>')
    for x, y, nw, nh, title, lines, accent in spec['nodes']:
        s += [f'<rect x="{x}" y="{y}" width="{nw}" height="{nh}" rx="12" fill="{SOFT}" stroke="{ACCENT if accent else INK}" stroke-width="1.5"/>',
              f'<text x="{x+17}" y="{y+29}" fill="{INK}" font-family="Arial,sans-serif" font-size="20" font-weight="bold">{escape(title)}</text>']
        for index, line in enumerate(lines):
            s.append(f'<text x="{x+17}" y="{y+52+index*21}" fill="{MUTED}" font-family="Arial,sans-serif" font-size="16">{escape(line)}</text>')
    s.append('</svg>')
    return '\n'.join(s)

class Diagram(Flowable):
    def __init__(self, spec, width=495):
        super().__init__()
        self.spec = spec
        self.width = width
        self.height = width * spec['height'] / spec['width']
    def draw(self):
        c, spec = self.canv, self.spec
        scale = self.width/spec['width']
        c.saveState()
        c.scale(scale, scale)
        H = spec['height']
        for points, label, pos, dashed in spec['edges']:
            c.setStrokeColor(colors.HexColor(ACCENT if dashed else '#526B80'))
            c.setLineWidth(2)
            c.setDash(7, 5) if dashed else c.setDash()
            p = c.beginPath()
            p.moveTo(points[0][0], H-points[0][1])
            for x,y in points[1:]: p.lineTo(x,H-y)
            c.drawPath(p)
            c.setDash()
            x,y = points[-1]
            px,py = points[-2]
            import math
            angle=math.atan2(y-py,x-px)
            p=c.beginPath();p.moveTo(x,H-y)
            for offset in [-.45,.45]:
                p.lineTo(x-9*math.cos(angle+offset),H-(y-9*math.sin(angle+offset)))
            p.close();c.setFillColor(colors.HexColor('#526B80'));c.drawPath(p,fill=1,stroke=0)
            if label:
                c.setFillColor(colors.HexColor(MUTED));c.setFont('BCSans',16);c.drawString(pos[0],H-pos[1],label)
        for x,y,nw,nh,title,lines,accent in spec['nodes']:
            c.setFillColor(colors.HexColor(SOFT));c.setStrokeColor(colors.HexColor(ACCENT if accent else INK));c.setLineWidth(1.5)
            c.roundRect(x,H-y-nh,nw,nh,12,stroke=1,fill=1)
            c.setFillColor(colors.HexColor(INK));c.setFont('BCSansBold',20);c.drawString(x+17,H-y-29,title)
            c.setFillColor(colors.HexColor(MUTED));c.setFont('BCSans',16)
            for index,line in enumerate(lines):c.drawString(x+17,H-y-52-index*21,line)
        c.restoreState()

def register_fonts():
    windows=Path('C:/Windows/Fonts')
    fallback=Path(__import__('reportlab').__file__).parent/'fonts'
    choices={'BCSans':('arial.ttf','Vera.ttf'),'BCSansBold':('arialbd.ttf','VeraBd.ttf'),
             'BCSerif':('georgia.ttf','Vera.ttf'),'BCSerifBold':('georgiab.ttf','VeraBd.ttf'),
             'BCMono':('consola.ttf','VeraMono.ttf')}
    for name,(win,alt) in choices.items():
        file=windows/win
        if not file.exists():file=fallback/alt
        pdfmetrics.registerFont(TTFont(name,str(file)))
    pdfmetrics.registerFontFamily('BCSans',normal='BCSans',bold='BCSansBold',italic='BCSans',boldItalic='BCSansBold')
    pdfmetrics.registerFontFamily('BCSerif',normal='BCSerif',bold='BCSerifBold',italic='BCSerif',boldItalic='BCSerifBold')

def inline(text):
    text=text.replace('—','-').replace('–','-').replace('\u2011','-').replace('→',' > ')
    text=escape(text)
    text=re.sub(r'`([^`]+)`',r'<font name="BCMono">\1</font>',text)
    text=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',text)
    def link(match):
        label,url=match.groups()
        if url.startswith(('http://','https://')):
            return f'<link href="{html.escape(url,quote=True)}" color="#245C85">{label}</link>'
        return label
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',link,text)

class Cover(Flowable):
    def __init__(self):
        super().__init__()
        self.width=495
        self.height=660
    def draw(self):
        c=self.canv
        c.setFillColor(colors.HexColor(INK));c.roundRect(-5,0,505,650,16,stroke=0,fill=1)
        c.setFillColor(colors.HexColor('#F6A43C'));c.rect(28,578,54,4,stroke=0,fill=1)
        c.setFont('BCSansBold',10);c.drawString(28,603,'BIBLIOTECA ONLINE / PROJETO ACADÊMICO')
        c.setFillColor(colors.white);c.setFont('BCSerifBold',37);c.drawString(28,520,'BiblioConnect')
        c.setFont('BCSerif',25);c.drawString(28,469,'Documentação técnica')
        c.setFont('BCSans',12)
        for i,line in enumerate(['Arquitetura e hospedagem','Funcionalidades, segurança e operação','Modelo de dados e mapa de rotas']):
            c.drawString(30,426-i*23,line)
        for i,(value,label) in enumerate([('15','entidades'),('131','livros na verificação'),('3','camadas principais')]):
            x=30+i*151
            c.setFillColor(colors.HexColor('#1C3E5B'));c.roundRect(x,245,138,93,8,stroke=0,fill=1)
            c.setFillColor(colors.HexColor('#F6A43C'));c.setFont('BCSerifBold',28);c.drawString(x+13,294,value)
            c.setFillColor(colors.white);c.setFont('BCSans',8);c.drawString(x+13,269,label)
        c.setFillColor(colors.HexColor('#C4D5E3'));c.setFont('BCSans',10)
        c.drawString(30,193,'React + Express + Prisma + PostgreSQL')
        c.drawString(30,171,'Vercel / Neon / Blob / Google / Gmail / HeiGIT')
        c.setStrokeColor(colors.HexColor('#38566E'));c.line(30,131,466,131)
        c.setFont('BCSans',9);c.drawString(30,104,'EDIÇÃO 15 DE OUTUBRO DE 2026')
        c.drawString(30,81,'biblioconnect-olive.vercel.app')
        c.setFont('BCSans',8);c.drawString(30,46,'Descrição fiel ao código. Pendências de pagamentos explicitadas.')

class TechnicalDoc(BaseDocTemplate):
    def afterFlowable(self,flowable):
        if isinstance(flowable,Paragraph) and flowable.style.name=='BCChapter':
            title=flowable.getPlainText()
            key=f'section-{len(self._section_keys)}'
            self._section_keys.append(key)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title,key,level=0)
            self.notify('TOCEntry',(0,title,self.page,key))
    def beforeDocument(self):
        self._section_keys=[]

def styles():
    base=getSampleStyleSheet()
    base.add(ParagraphStyle(name='BCBody',fontName='BCSans',fontSize=9.6,leading=14.6,textColor=colors.HexColor(INK),spaceAfter=8,splitLongWords=1))
    base.add(ParagraphStyle(name='BCChapter',fontName='BCSerifBold',fontSize=19,leading=24,spaceBefore=19,spaceAfter=12,keepWithNext=True,textColor=colors.HexColor(INK)))
    base.add(ParagraphStyle(name='BCSection',fontName='BCSansBold',fontSize=11.2,leading=16,spaceBefore=14,spaceAfter=7,keepWithNext=False,textColor=colors.HexColor(INK)))
    base.add(ParagraphStyle(name='BCSectionLinked',parent=base['BCSection'],keepWithNext=True))
    base.add(ParagraphStyle(name='BCTable',fontName='BCSans',fontSize=8,leading=11.3,splitLongWords=1,textColor=colors.HexColor(INK)))
    base.add(ParagraphStyle(name='BCTableHead',parent=base['BCTable'],fontName='BCSansBold',textColor=colors.white))
    base.add(ParagraphStyle(name='BCCode',fontName='BCMono',fontSize=8,leading=12,backColor=colors.HexColor(SOFT),borderPadding=9,spaceBefore=6,spaceAfter=10,splitLongWords=1))
    base.add(ParagraphStyle(name='BCBullet',parent=base['BCBody'],leftIndent=12,firstLineIndent=-9,spaceAfter=5))
    base.add(ParagraphStyle(name='BCToc',fontName='BCSans',fontSize=9.5,leading=15,spaceBefore=6,textColor=colors.HexColor(INK)))
    return base

def table_from(lines,st):
    parsed=[[p.strip() for p in line.strip().strip('|').split('|')]for line in lines]
    parsed=[row for row in parsed if not all(re.fullmatch(r':?-+:?',c.replace(' ','')) for c in row)]
    n=len(parsed[0])
    widths={2:[145,350],3:[108,155,232],4:[95,150,130,120]}.get(n,[495/n]*n)
    if parsed[0][0]=='Campo':widths=[174,62,57,202]
    elif parsed[0][0]=='Campo de relação':widths=[100,110,285]
    elif parsed[0][0]=='Método':widths=[42,177,156,120]
    elif parsed[0][0]=='Grupo' and n==3:widths=[73,247,175]
    elif parsed[0][0]=='Grupo' and n==2:widths=[100,395]
    data=[[Paragraph(inline(cell),st['BCTableHead' if ri==0 else 'BCTable'])for cell in row]for ri,row in enumerate(parsed)]
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor(INK)),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
        ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F6F8')]),
        ('LINEBELOW',(0,0),(-1,0),1.2,colors.HexColor(ACCENT)),
        ('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#D9E2E9')),
    ]))
    return [t,Spacer(1,10)]

def markdown_story(text,st,specs,annex=False):
    lines=text.splitlines();result=[];i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('# '):
            if annex:result += [PageBreak(),Paragraph(inline(line[2:]),st['BCChapter'])]
            i+=1;continue
        if line.startswith('!['):
            name=Path(re.search(r'\]\(([^)]+)',line).group(1)).stem
            result += [Spacer(1,5),Diagram(specs[name]),Spacer(1,11)]
            i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(lines)and not lines[i].startswith('```'):
                code.append(lines[i]);i+=1
            result.append(Paragraph('<br/>'.join(escape(x).replace(' ','&#160;')or'&#160;'for x in code),st['BCCode']))
            i+=1;continue
        if line.startswith('|'):
            block=[]
            while i<len(lines)and lines[i].strip().startswith('|'):
                block.append(lines[i]);i+=1
            result.extend(table_from(block,st));continue
        if line.startswith('## '):
            if annex and line[3:]=='Rotas da interface':result.append(PageBreak())
            result.append(CondPageBreak(100))
            result.append(Paragraph(inline(line[3:]),st['BCSection' if annex else 'BCChapter']))
            i+=1;continue
        if line.startswith('### '):
            following=i+1
            while following<len(lines) and not lines[following].strip():following+=1
            next_line=lines[following].strip() if following<len(lines) else ''
            if next_line.startswith('!['):
                name=Path(re.search(r'\]\(([^)]+)',next_line).group(1)).stem
                result.append(KeepTogether([Paragraph(inline(line[4:]),st['BCSection']),Spacer(1,5),Diagram(specs[name]),Spacer(1,11)]))
                i=following+1;continue
            result.append(CondPageBreak(85))
            result.append(Paragraph(inline(line[4:]),st['BCSection' if next_line.startswith('|') else 'BCSectionLinked']));i+=1;continue
        if re.match(r'^(?:- |\d+\. )',line):
            result.append(Paragraph(inline(line),st['BCBullet']));i+=1;continue
        paragraph=[line];i+=1
        while i<len(lines)and lines[i].strip()and not re.match(r'^(?:#|\||!\[|```|- |\d+\. )',lines[i].strip()):
            paragraph.append(lines[i].strip());i+=1
        result.append(Paragraph(inline(' '.join(paragraph)),st['BCBody']))
    return result

def page_frame(canvas,doc):
    if doc.page==1:return
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D7E1E9'));canvas.setLineWidth(.5);canvas.line(50,795,545,795)
    canvas.setFillColor(colors.HexColor(MUTED));canvas.setFont('BCSans',8)
    canvas.drawString(50,807,'BIBLIOCONNECT / DOCUMENTAÇÃO TÉCNICA')
    canvas.drawRightString(545,807,DATE)
    canvas.line(50,47,545,47);canvas.drawString(50,32,'Projeto acadêmico | Arquitetura, dados e operação')
    canvas.drawRightString(545,32,str(doc.page))
    canvas.restoreState()

def make_pdf(specs):
    register_fonts();st=styles()
    path=OUTPUT/'biblioconnect-documentacao-tecnica.pdf'
    doc=TechnicalDoc(str(path),pagesize=A4,leftMargin=50,rightMargin=50,topMargin=61,bottomMargin=61,
                     title='BiblioConnect - Documentação técnica',author='Equipe BiblioConnect',
                     subject='Arquitetura, infraestrutura, funcionalidades e relacionamentos PostgreSQL',lang='pt-BR')
    frame=Frame(50,61,495,A4[1]-122,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='body',frames=[frame],onPage=page_frame)])
    toc=TableOfContents();toc.levelStyles=[st['BCToc']]
    story=[Cover(),PageBreak(),Paragraph('Guia de leitura',st['BCChapter']),
           Paragraph('O documento descreve a aplicação publicada e o código em 15/10/2026. Os anexos inventariam todos os modelos e endpoints. As limitações de homologação estão explícitas; credenciais reais foram excluídas.',st['BCBody']),Spacer(1,12),toc,PageBreak()]
    story+=markdown_story((DOCS/'documentacao-tecnica.md').read_text(encoding='utf-8'),st,specs)
    story+=markdown_story((DOCS/'dicionario-de-dados.md').read_text(encoding='utf-8'),st,specs,annex=True)
    story+=markdown_story((DOCS/'api-rotas.md').read_text(encoding='utf-8'),st,specs,annex=True)
    doc.multiBuild(story)
    return path

def main():
    for folder in [DOCS,DIAGRAMS,OUTPUT]:folder.mkdir(parents=True,exist_ok=True)
    data=models();schema_annex(data);route_count=api_annex();specs=diagram_specs()
    for name,spec in specs.items():(DIAGRAMS/f'{name}.svg').write_text(svg_diagram(spec),encoding='utf-8')
    er=['erDiagram']
    for model in data:
        er.append(f'    {model["name"]} {{')
        for field,kind,attrs in model['fields']:
            key=' PK' if '@id' in attrs else (' UK' if '@unique' in attrs else '')
            er.append(f'        {kind.rstrip("?")} {field}{key}')
        er.append('    }')
        for field,kind,attrs in model['relations']:
            if '@relation(' in attrs:
                parent=kind.rstrip('?')
                marker='o|' if '?' in kind else '||'
                er.append(f'    {parent} {marker}--o{{ {model["name"]} : {field}')
    (DIAGRAMS/'banco.mmd').write_text('\n'.join(er)+'\n',encoding='utf-8')
    pdf=make_pdf(specs)
    print(json.dumps({'pdf':str(pdf),'models':len(data),'scalarFields':sum(len(x['fields'])for x in data),'httpDeclarations':route_count,'bytes':pdf.stat().st_size},ensure_ascii=False))

if __name__=='__main__':main()
