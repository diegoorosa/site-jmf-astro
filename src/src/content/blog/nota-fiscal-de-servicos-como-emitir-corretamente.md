---
title: "Nota Fiscal de Serviços: Como Emitir Corretamente e Evitar Problemas com o Fisco"
description: "NFS-e, ISSQN, alíquota, tomador, prestador, retenção na fonte — entenda tudo o que envolve a emissão de nota fiscal de serviços e não deixe dinheiro ou conformidade na mesa."
pubDate: 2026-03-05
author: "Diego Rosa, CRC SC-035810/O"
image: "/assets/images/blog-nota-fiscal-servicos.jpg"
imageAlt: "Emissão de nota fiscal de serviços — NFS-e"
---

A nota fiscal de serviços é obrigatória para qualquer empresa ou profissional que preste serviços a pessoas jurídicas — e em muitos casos, também para pessoas físicas. Mesmo assim, erros na emissão são extremamente comuns: alíquota incorreta, retenção indevida, tomador errado. Cada erro pode gerar retrabalho, multa ou até autuação fiscal.

Neste artigo, explicamos o funcionamento da NFS-e, as regras de ISS, as situações de retenção na fonte e os erros mais frequentes que você deve evitar.

## NF-e vs. NFS-e: qual é a diferença?

- **NF-e (Nota Fiscal Eletrônica):** emitida para operações de **venda de produtos**. É regulamentada pela SEFAZ estadual, com base no ICMS.
- **NFS-e (Nota Fiscal de Serviços Eletrônica):** emitida para prestação de **serviços**. É regulamentada pela Prefeitura do município do prestador, com base no ISS (Imposto Sobre Serviços).

Empresas que vendem produtos **e** prestam serviços podem precisar emitir os dois tipos. Uma empresa de software que vende licença e também faz implementação, por exemplo, emite NF-e para a licença e NFS-e para os serviços.

## ISS: quem paga, quanto e para onde

O **ISS (Imposto Sobre Serviços)** é municipal. Cada município define sua alíquota, dentro dos limites federais: **mínimo de 2% e máximo de 5%** (Lei Complementar 116/2003).

**Quem recolhe:** o prestador do serviço, para o município onde está localizado (regra geral). Há exceções: para alguns tipos de serviço listados na LC 116 (como construção civil, limpeza, segurança e outros), o ISS é recolhido no município onde o serviço é executado.

**Alíquotas em Blumenau/SC:** a Prefeitura de Blumenau pratica alíquotas de 2% a 5% dependendo da atividade (código de serviço). A maioria dos serviços de tecnologia e consultoria enquadra-se em 5%, enquanto saúde, engenharia e arquitetura geralmente pagam 2%. Para a lista detalhada por código de atividade, veja o guia completo de [ISS em Blumenau: alíquotas por serviço e como calcular](/blog/iss-em-blumenau-aliquotas-por-servico-e-como-calcular).

## Retenção na fonte do ISS

Em muitos casos, quando o **tomador** (quem contrata o serviço) é uma pessoa jurídica e o serviço se enquadra em determinadas atividades, ele é obrigado a **reter o ISS na fonte** — ou seja, descontar o imposto do valor pago ao prestador e repassar diretamente ao município.

**Quando há retenção:**
- O município do tomador autoriza (ou exige) a retenção
- O serviço consta na lista do art. 6 da LC 116/2003
- O contrato ou a lei municipal exige

**O que fazer como prestador:** ao emitir a NFS-e, marque o campo "ISS retido pelo tomador" corretamente. Isso evita que você pague o ISS duas vezes — uma via nota e outra retida.

## Retenção de PIS, COFINS e CSLL

Além do ISS, empresas que prestam serviços para outras empresas (exceto Simples Nacional) podem ter **PIS (0,65%), COFINS (3%) e CSLL (1%)** retidos na fonte pelo tomador — totalizando 4,65% — quando o pagamento for acima de R$ 215,05 por competência.

**Empresas do Simples Nacional** estão dispensadas dessas retenções — mas devem informar ao tomador que são optantes do Simples na NFS-e.

## IRRF (Imposto de Renda Retido na Fonte)

Serviços de natureza profissional prestados por pessoas jurídicas a outras PJs (consultoria, assessoria, auditoria, gestão, entre outros) também podem ter **IRRF de 1,5%** retido pelo tomador.

O prestador do Simples Nacional também está dispensado dessa retenção.

## Erros mais comuns na emissão de NFS-e

**1. Código de serviço errado.** Cada atividade tem um código específico na lista da LC 116. O código errado pode gerar alíquota diferente da devida — para mais ou para menos.

**2. Não informar que é optante do Simples.** Tomadores podem reter PIS/COFINS/CSLL/IRRF indevidamente se o prestador não informar seu regime tributário.

**3. Emitir com o município errado.** Para serviços realizados em outro município (construção, instalação, eventos), a NFS-e pode ser devida ao município onde o serviço foi executado — não ao do prestador.

**4. Não emitir a nota.** A omissão de NFS-e é infração fiscal tanto para o prestador quanto para o tomador que deixou de exigir. Fiscalizações municipais cruzam dados de pagamentos declarados no DIRF com notas emitidas.

**5. Erro no valor da base de cálculo.** Custos de materiais fornecidos pelo prestador em contratos de construção civil podem ser deduzidos da base de ISS — mas precisam estar discriminados em contrato e nota.

## NFS-e Nacional: o novo padrão

A Receita Federal e o ENCAT (Encontro Nacional de Administradores Tributários) estão implementando a **NFS-e Nacional** — um padrão único que substitui os sistemas municipais fragmentados. Com a NFS-e Nacional, prestadores emitem em um único portal, independentemente do município.

A adesão é gradual, com municípios migrando ao longo de 2025 e 2026. Blumenau e outros municípios de grande porte já aderiram ou estão em processo de adesão.

## Exemplo prático: nota com retenções

Uma empresa de consultoria (Lucro Presumido) emite uma NFS-e de R$ 10.000 para outra empresa, com alíquota de ISS de 5% retida pelo tomador:

| Item | Cálculo | Valor |
|---|---|---|
| Valor do serviço |  | R$ 10.000,00 |
| ISS retido (5%) | 5% × R$ 10.000 | R$ 500,00 |
| PIS/COFINS/CSLL retidos (4,65%) | 4,65% × R$ 10.000 | R$ 465,00 |
| IRRF retido (1,5%) | 1,5% × R$ 10.000 | R$ 150,00 |
| **Valor líquido recebido** | R$ 10.000 - R$ 500 - R$ 465 - R$ 150 | **R$ 8.885,00** |

O prestador recebe R$ 8.885,00 líquidos, mas a nota fiscal continua sendo emitida pelo valor bruto de R$ 10.000 — as retenções aparecem destacadas na nota e são recolhidas diretamente pelo tomador aos respectivos órgãos. Se essa mesma empresa fosse optante do Simples Nacional, não haveria retenção de PIS/COFINS/CSLL nem de IRRF (só a do ISS, dependendo da legislação municipal) — por isso é tão importante informar corretamente o regime tributário na nota.

## O papel do contador na emissão de notas

Um contador especializado garante que as configurações de ISS, retenções e enquadramento estejam corretas no sistema de NFS-e antes de qualquer emissão. Isso evita erros que se repetem por meses, gerando retrabalho e risco fiscal.

Se você tem dúvidas sobre o enquadramento correto da sua atividade ou sobre as retenções aplicáveis, a JMF Contabilidade pode orientar você sem custo através do nosso serviço de [gestão fiscal e tributária](/gestao-fiscal-e-tributaria). [Fale com nossa equipe →](/fale-conosco)

## Perguntas frequentes

**O que acontece se eu esquecer de emitir a NFS-e de um serviço já pago?**
A nota deve ser emitida o quanto antes, mesmo em atraso — a maioria dos sistemas municipais permite emissão com data retroativa dentro de um prazo razoável. Atrasos recorrentes ou omissão deliberada podem ser interpretados como sonegação fiscal em uma fiscalização.

**Cliente pessoa física também pode reter impostos na minha nota?**
Não. As retenções de PIS/COFINS/CSLL e IRRF tratadas neste artigo se aplicam a tomadores pessoa jurídica. Para clientes pessoa física, não há essas retenções — o prestador recolhe seus próprios tributos normalmente.

**Por que o limite de R$ 215,05 importa para a retenção de PIS/COFINS/CSLL?**
Pagamentos de até R$ 215,05 por competência e por mesmo código de serviço ficam dispensados da retenção dessas contribuições — um valor pensado para não gerar uma carga operacional desproporcional em pagamentos pequenos e pontuais.

**Quando a NFS-e Nacional estiver totalmente implementada, muda alguma coisa para o prestador de Blumenau?**
A mudança principal é operacional: em vez de emitir pelo sistema específico da Prefeitura de Blumenau, a emissão passa a ser feita por um portal nacional único, válido para qualquer município aderente. As regras de alíquota e retenção continuam sendo definidas pela legislação municipal — só a interface de emissão muda.

---

**Fontes:**
- Lei Complementar 116/2003 — ISS
- Lei 9.430/1996 — Retenções de IRRF/PIS/COFINS/CSLL
- Decreto Municipal de Blumenau — Código Tributário Municipal
- SEFIN — NFS-e Nacional
