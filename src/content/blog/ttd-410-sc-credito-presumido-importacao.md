---

title: "TTD 410 em SC: Entenda o Crédito Presumido na Importação"
description: "Entenda o crédito presumido de ICMS do TTD 410 em SC: cálculo prático, impacto no preço final e obrigações mensais (DIME, DCIP e EFD)."
pubDate: 2026-08-20
author: "Diego Rosa, CRC SC-035810/O"
image: "/assets/images/blog-ttd-410-sc.webp"
imageAlt: "Cálculo de crédito presumido ICMS — planilha demonstrando economia do TTD 410 em Santa Catarina"
---


O **TTD 410** é o regime que complementa o TTD 409: enquanto o 409 difere o ICMS no desembaraço, o 410 concede o **crédito presumido na saída interestadual** que reduz a alíquota efetiva de 4% para **0,6% a 2,6%**. É a perna que torna a operação financeiramente viável para tradings e importadoras que vendem para fora de Santa Catarina.

---

## TTD 409 vs TTD 410 — qual a diferença?

| Aspecto | TTD 409 | TTD 410 |
|---------|---------|---------|
| **Momento** | Desembaraço aduaneiro (entrada) | Saída interestadual (venda) |
| **Benefício** | Diferimento do ICMS (caixa preservado) | Crédito presumido (reduz alíquota efetiva) |
| **Alíquota base** | 17% a 19% (interno SC) | 4% (interestadual, Res. Senado 13/2012) |
| **Carga efetiva** | Pago apenas na saída | **0,6% a 2,6%** na saída interestadual |
| **Concessão** | Pleito junto à SEF/SC | Automático ao ter o TTD 409 deferido |

> **Na prática:** o TTD 410 **não tem pleito separado**. Ele é concedido automaticamente quando a empresa tem o TTD 409 ativo e atende aos requisitos de escrituração. A gestão contínua das obrigações (DIME, DCIP, EFD) é o que mantém o benefício vigente.

---

## Cálculo prático do crédito presumido (Resolução do Senado nº 13/2012)

A Resolução do Senado nº 13/2012 fixa a alíquota interestadual de ICMS em **4%** para operações com mercadorias importadas ou com conteúdo de importação superior a 40%.

O crédito presumido do TTD 410 é calculado sobre essa base de 4%:

```
Crédito Presumido = Base de Cálculo (4%) × Percentual de Crédito Concedido
```

### Tabela de cargas efetivas por enquadramento

| Enquadramento / Operação | % Crédito Presumido | Carga Efetiva ICMS Interestadual |
|--------------------------|---------------------|----------------------------------|
| Trading pura (comercialização) | 85% a 90% | **0,4% a 0,6%** |
| Importadora que industrializa | 70% a 80% | **0,8% a 1,2%** |
| Importadora mista (comercial + industrial) | 60% a 75% | **1,0% a 1,6%** |
| Operações específicas (consultar SEF) | 35% a 60% | **1,6% a 2,6%** |

### Exemplo numérico: importação de R$ 1.000.000 vendida para SP

| Item | Sem TTD | Com TTD 409 + 410 |
|------|---------|-------------------|
| ICMS no desembaraço (17%) | R$ 170.000 (pago na entrada) | **R$ 0** (diferido) |
| ICMS na saída interestadual (4%) | R$ 40.000 | **R$ 2.000 a R$ 6.000** (0,2% a 0,6%) |
| **Total ICMS na operação** | **R$ 210.000** | **R$ 2.000 a R$ 6.000** |
| **Economia** | — | **~R$ 204.000 a R$ 208.000** |

> **Atenção:** o crédito presumido só se aplica na **saída interestadual**. Vendas dentro de Santa Catarina seguem a alíquota interna normal (17% a 19%) com crédito do ICMS diferido na entrada.

---

## Obrigações acessórias estaduais — o que mantém o benefício ativo

Ter o TTD deferido não basta. A SEF/SC exige entrega pontual de três obrigações mensais. Atraso ou inconsistência **suspende o crédito presumido** retroativamente.

### 1. DIME (Declaração de Informações de Movimentação Econômica)
- **Periodicidade:** Mensal (até dia 20 do mês subsequente)
- **Conteúdo:** Entradas, saídas, estoques, apuração de ICMS, créditos presumidos utilizados
- **Formato:** Arquivo TXT/EDI no layout SEF/SC
- **Risco:** Inconsistência entre DIME e EFD gera malha fiscal automática

### 2. DCIP (Demonstração de Créditos de ICMS Presumidos)
- **Periodicidade:** Mensal (junto com a DIME)
- **Conteúdo:** Demonstração detalhada do crédito presumido apropriado no período, por CFOP, NCM e operação
- **Finalidade:** Comprovar à SEF/SC que o crédito foi calculado conforme o decreto e a IN 12/2024

### 3. EFD-ICMS/IPI (Escrituração Fiscal Digital)
- **Periodicidade:** Mensal (SPED Fiscal)
- **Blocos críticos:** Bloco C (notas fiscais), Bloco E (apuração ICMS/IPI), Bloco H (inventário)
- **Cruzamento:** A SEF cruza EFD × DIME × DCIP × NF-e. Diferença = intimação

---

## Rotina mensal recomendada pela JMF

1. **Dias 1–5:** Recebimento e conferência de XMLs de NF-e de entrada e saída
2. **Dias 6–10:** Parametrização de CFOPs (5.102, 6.102, 5.405, 6.405), CSTs (51, 60), cálculo de créditos
3. **Dias 11–15:** Geração da DIME e DCIP, conciliação com EFD do mês anterior
4. **Dias 16–19:** Revisão cruzada (DIME × EFD × DCIP × contas contábeis), ajustes se necessário
5. **Dia 20:** Transmissão da DIME + DCIP + EFD-ICMS/IPI
6. **Dias 21–30:** Acompanhamento de processamento na SEF/SC, resposta a eventuais pendências

---

## Armadilhas comuns que derrubam o benefício

| Armadilha | Consequência | Prevenção JMF |
|-----------|--------------|---------------|
| NF-e com CFOP errado na saída interestadual | Crédito presumido glosado | Validação automática de CFOP/NCM/CST no emissor |
| Estoque final na DIME diferente do EFD | Malha fiscal | Conciliação diária, não só no dia 20 |
| Garantia (seguro fiança) vencida | Suspensão imediata do TTD | Alerta 60 dias antes do vencimento |
| DIME transmitida com erro de layout | Rejeição + multa | Validador próprio antes da transmissão |
| Saída para consumidor final não contribuinte (CFOP 5.102) sem destaque de ICMS-ST | Crédito indevido | Mapeamento completo de CFOPs por destino |

---

## Reforma Tributária: o TTD 410 também vai até 2032

Assim como o TTD 409, o crédito presumido do TTD 410 tem transição garantida pelo **FCBF (Fundo de Compensação de Benefícios Fiscais)** até **2032** (EC 132/2023).

- **2026–2028:** Vigência plena
- **2029–2032:** Transição gradual para novo modelo (IBS/CBS)
- **Pós-2032:** Novo desenho de incentivos via fundos constitucionais

Empresas que estruturarem a operação **agora** capturam 6 a 7 anos de economia plena antes da transição.

---

## Próximos passos

A JMF cuida de toda a stack: **pleito TTD 409/410 + RADAR + parametrização NF-e + rotina mensal DIME/DCIP/EFD**.

- [Fale com um especialista em TTD no WhatsApp](https://wa.me/554733265123?text=Ol%C3%A1%2C%20quero%20entender%20o%20cr%C3%A9dito%20presumido%20do%20TTD%20410%20para%20minha%20importadora.)
- [Conheça nossa página completa de Contabilidade para Importação e TTD em SC](/contabilidade-para-importacao-sc)
- [Leia também: TTD 409 em Santa Catarina — O Que É, Quem Tem Direito e Como Funciona](/blog/ttd-409-santa-catarina-como-funciona-guia-2026)

---

**Fontes oficiais:**
- SEF/SC — [Instrução Normativa nº 12/2024 (TTD 409/410)](https://www.sef.sc.gov.br/)
- Decreto Estadual nº 2.870/1998 — Regulamento do TTD
- Resolução do Senado nº 13/2012 — Alíquotas interestaduais de ICMS
- Emenda Constitucional nº 132/2023 — Reforma Tributária e transição de incentivos
- Manual de Orientação DIME/DCIPIEFD — SEF/SC