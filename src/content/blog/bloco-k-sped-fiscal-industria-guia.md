---
title: "Bloco K do SPED Fiscal: O Que É e Como Evitar Multas"
description: "Entenda o Bloco K do SPED Fiscal em Santa Catarina: controle de produção, Registro 0210 (fichas técnicas), perdas produtivas e conciliação de estoque."
pubDate: 2026-08-27
author: "Diego Rosa, CRC SC-035810/O"
image: "/assets/images/blog-bloque-k-industria.webp"
imageAlt: "Ilustração técnica do Bloco K do SPED Fiscal com fichas técnicas e controle de estoque industrial"
---
> **OBS:** Bloco K e Bloco K2 são diferentes. O Bloco K substituiu o antigo Livro de Controle da Produção e do Estoque (LCPE) a partir de 2011. Este artigo foca no Bloco K atual.

O **Bloco K** do SPED Fiscal é o registro que substituiu o antigo **Livro de Controle da Produção e do Estoque (LCPE)** em 2011, com a obrigatoriedade para todas as empresas do Lucro Real e Lucro Presumido que tenham atividades industriais. Em Santa Catarina, o non compliance com o Bloco K é uma das causas mais frequentes de intimação fiscal — a SEF/SC cruza o K200 (estoque escriturado) com as notas de entrada e saída para autuar por presunção de omissão de receita.

Aqui está o que todo contador, gerente fiscal ou dono de fábrica precisa saber.

---

## O que é o Bloco K do SPED Fiscal

O Bloco K é um conjunto de registros no arquivo SPED que descreve a **produção industrial** da empresa: o que entrou (insumos), o que saiu (produtos finais), e o que ficou (estoque final). Ele opera em **relação direta** com o Bloco H (apuração do ICMS/IPI) e o Bloco E (atributos dos documentos fiscais).

### Principais registros do Bloco K

| Registro | Descrição | Campo crítico |
|----------|-----------|---------------|
| **K000** | Cabeçalho do Bloco K (identificação da empresa, período) | Período fiscal, tipo de operação |
| **K100** | Informações complementares da produção | Descrição das atividades industriais |
| **K200** | Estoque escriturado (inicial, final, entradas, saídas) | **Valor total dos estoques** — usado como base de cruzamento |
| **K280** | Correção de apontamento (ajustes de estoque) | Motivo da correção, valor ajustado |
| **K300** | Informações sobre o estoque por NCM/Registro | NCM do produto, CST, quantidade |
| **K500** | Informações de produções não regulares | Produtos fora do normal, desperdício |

> **Nota:** Empresas optantes do Simples Nacional **não entregam o Bloco K** (obrigatoriedade restrita ao Lucro Real e Lucro Presumido com atividades industriais).

---

## Registro 0210 (Ficha Técnica) e Registro 0200

Além do Bloco K principal, existem os **Registros 0200 e 0210** que compõem a ficha técnica do produto no SPED. Eles são essenciais para o cruzamento com a NF-e de saída.

### Registro 0200 — Ficha Técnica do Produto

Registra as características do produto fabricado, essencial para o controle de estoque e validação fiscal.

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| C001 | Sim | Código do produto (geralmente NCM ou código interno) |
| C002 | Sim | Descrição do produto |
| C003 | Sim | NCM (Nomenclatura Comum do Mercosul) |
| C004 | Sim | CFOP da operação de saída |
| C005 | Não | Cód. de controle interno (opcional) |
| C006 | Sim | Unidade de medida |
| C007 | Não | Lote de produção |
| C008 | Não | Data de validade (se aplicável) |

### Registro 0210 — Detalhamento da Ficha Técnica

Complementa o 0200 com informações de consumo de insumo e ganho/perda de produção.

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| D001 | Sim | Código do insumo (NCM ou código interno) |
| D002 | Sim | Quantidade de insumo consumido |
| D003 | Sim | Unidade de medida do insumo |
| D004 | Sim | Percentual de perda ou ganho de produção |
| D005 | Não | Código do lote de insumo |
| D006 | Não | Data de consumo/referência |

> **O cruzamento 0200 × 0210 × Bloco K200 é o que a SEF/SC usa para calcular se há omissão de receita.** Se a soma dos insumos declarados não corresponde ao estoque movimentado + perdas justificadas, a intimação é automática.

---

## Como a SEF/SC cruza compras × ordens de produção × notas de saída

O mecanismo de autuação da SEF/SC via SPED funciona em **três estágios**:

### Estágio 1: Conciliação Bloco K × NF-e de entrada

1. **Bloco K K200** declara o estoque inicial + entradas de insumos (valor e quantidade)
2. **NF-e de entrada** (CFOP 3.101, 3.102, etc.) registra as compras de fios, tecidos, tintas, insumos
3. **Comparação:** SEF/SC compara K200 entradas × NF-e entradas

Se houver diferença entre o declarado no SPED e o que circulou na NF-e → **primeira intimação** para justificar.

### Estágio 2: Conciliação Bloco K × NF-e de saída

1. **Bloco K K200 + K300** declara o estoque final
2. **NF-e de saída** (CFOP 5.102, 5.405, 6.102, 6.405) registra as vendas (interna ou interestadual)
3. **Comparação:** SEF/SC compara o estoque movimentado declarado vs. o que realmente saiu

Se houver diferença insuperável → **segunda intimação** (autuação por omissão/redução de base de cálculo).

### Estágio 3: Cruzamento Registros 0200/0210

1. **Registro 0210** declara o consumo de insumo por produto fabricado
2. **Registro 0200** descreve cada produto fabricado
3. **Bloco K200** declara o estoque final global

A SEF/SC verifica:
- Para cada produto (Registro 0200): quantos insumos foram consumos (Registro 0210)
- Se a soma dos insumos consumidos gera o estoque declarado no K200
- Se as perdas (D004 no 0210) são **tecnicamente justificadas** ou parecem "desaparecimento de mercadoria"

> **Exemplo de autuação:** Fábrica declara no Bloco K K200 estoque final de R$ 500 mil. No Registro 0210, consumiu R$ 2,5 milhões em insumos. No Registro 0200, fabricou produtos com RC$ 2 milhões. A diferença de R$ 500 mil sem perda justificada no D004 = intimação por **presunção de omissão de receita não declarada**.

---

## Checklist para alinhar o ERP do chão de fábrica à contabilidade fiscal

Para evitar multas e intimações da SEF/SC, siga este checklist mensal:

### 1. Integração ERP × SPED (Dias 1–5 do mês seguinte)

- [ ] Conferir estoque físico × K200 (Bloco K)
- [ ] Validar NF-e de entrada × K200 entradas
- [ ] Validar NF-e de saída × K200 + K300 saídas
- [ ] Verificar consistência dos Registros 0200/0210

### 2. Controle de perdas (Dias 6–10)

- [ ] Levantamento de perdas anormais (quebra de máquina, erro de programação)
- [ ] Documentação técnica de perdas normais (por produto/processo)
- [ ] Preenchimento correto do D004 (percentual de perda) no Registro 0210
- [ ] Justificativa escrita para cada perda anormal (relatório de técnico ou engenheiro)

### 3. Conciliação fiscal (Dias 11–15)

- [ ] K200 entrada = soma NF-e entradas + perdas justificadas
- [ ] K200 saída = soma NF-e saídas − perdas anormais estornadas
- [ ] K300 (correções) com motivação técnica (não "ajuste por ajustar")
- [ ] 0200 × 0210 consistentes (insumos consumidos → produto fabricado)

### 4. Transmissão (Dia 20)

- [ ] Gerar arquivo SPED (Bloco K + 0200 + 0210)
- [ ] Validar no validador da SEF/SC (não pode haver erro de sintaxe)
- [ ] Enviar ao fisco até o dia 20 do mês subsequente
- [ ] Guardar cópia do protocolo e do arquivo gerado

### 5. Pós-envio (Dias 21–30)

- [ ] Acompanhamento de processamento na SEF/SC
- [ ] Resposta a eventuais dúvidas ou intimações (prazo: 30 dias úteis)
- [ ] Atualização de rotinas se inconsistências forem detectadas

> **Dica da JMF:** automação é crítica. Empresas que ainda fazem o SPED manualmente ou com planilhasExcel têm 80% mais chance de inconsistências do que as que integram o ERP (TOTVS, Advantec, Datasul, etc.) via API ou conector nativo.

---

## Consequências do non compliance com o Bloco K

| Falha | Conseqüência | Multa/Autuação |
|-------|--------------|----------------|
| K200 não entregue | Multa obrigatória (art. 78 do RICMS/SC) | R$ 200 por bloco (mínimo) |
| Inconsistência K200 × NF-e | Intimação fiscal | Até 20% do valor da diferença |
| Perdas não justificadas (D004 sem documentação) | Estorno de crédito + multa | R$ 500 a R$ 2.000 por ocorrência + juros |
| 0200/0210 não entregues | Multa + bloqueio de NF-e | R$ 100 por registro (mínimo) |
| Dados divergentes entre Bloco K e EFD-ICMS/IPI | Malha fiscal automática | Intimação + retenção de créditos |

---

<div class="bg-[#e0f7fa] border-l-4 border-cyan-500 p-6 my-8 rounded-r-xl">

**JMF Contabilidade:** "A maioria das multas por Bloco K acontece porque a fábrica aponta produção no ERP contábil mas não alimenta o SPED com as perdas e fichas técnicas reais. O erro não está no cálculo do imposto, mas na **documentação da operação**. Nosso trabalho é garantir que o que o chão de fábrica produz está 100% reflejado nos registros fiscais — e o que não passou por produção, não entra no estoque declarado."

</div>

---

## Próximos passos

Precisando alinhar a contabilidade da sua fábrica ao SPED Fiscal?

- [Fale com um especialista em SPED e Bloco K no WhatsApp](https://wa.me/554733265123?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20para%20entender%20o%20Bloco%20K%20do%20SPED%20Fiscal%20na%20minha%20ind%C3%BAstria%20em%20SC.)
- [Conheça nossa página completa de Contabilidade para Indústria](/contabilidade-para-industria)
- [Leia também: Contabilidade para Indústria Têxtil em Blumenau e SC: Gestão Fiscal](/blog/contabilidade-industria-textil-blumenau-sc)

---

**Fontes oficiais:**
- SEF/SC — Instrução Normativa nº 12/2024 (obrigatoriedade do SPED Fiscal)
- Secretaria da Receita Federal — Instrução SPED Fiscal (modelo 01/02)
- Decreto Estadual nº 2.870/1998 — RICMS/SC, arts. 31 e seguintes
- RFB — Convênio MCTI/ICMS n.º 109/2009 (implementação do SPED Fiscal)
- Manual de Orientação do SPED Fiscal (versão mais recente da SEF/SC)