---

## Modelo oficial RAQ — Planilha Excel

O modelo oficial da planilha RAQ da Rede Free segue esta estrutura:

### Formatação obrigatória
- Biblioteca: xlsx (SheetJS) — já instalada
- Coluna A: labels em bold com borda fina
- Coluna B: valores sem bold com borda fina
- Largura coluna A: 40 chars, coluna B: 45 chars
- Cabeçalhos de seção: fundo #595959, texto branco, bold, mesclado A:B

### Seções em ordem
1. Título "POSTOS FREE" — laranja #E85C0D, bold, sz 16
2. "REGISTRO DE ANÁLISE DE QUALIDADE" — cinza #595959, branco
3. Seção "DADOS DO POSTO REVENDEDOR": razão social, CNPJ, endereço
4. Seção "DADOS DO RECEBIMENTO": produto, volume, data, distribuidor,
CNPJ distribuidor, transportador, CNPJ transportador, nota fiscal,
placa, motorista, CPF motorista, assinatura motorista, nome analista
5. Seção "RESULTADO DA ANÁLISE": aspecto, cor, densidade, temperatura,
massa específica 20°C, teor álcool gasolina, teor alcoólico AEHC,
responsável, assinatura
6. Resultado final: APROVADO (verde #16A34A) ou REPROVADO (vermelho #DC2626)

### Rota existente
GET /api/raq/[id]/xlsx — retorna buffer .xlsx
Use case: EmitRAQXlsxUseCase em src/application/use-cases/raq/emit-raq-xlsx.use-case.ts