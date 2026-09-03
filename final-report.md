# Auditoria de Links Internos Quebrados (404)

Relatório consolidado de links internos que retornam 404 no site jmfcontabilidade.com.br.

---

## Links Quebrados — Blog Posts (`/blog/[slug]`)

| Arquivo de Origem | Link Quebrado / 404 | Status / Sugestão de Correção |
|-------------------|---------------------|-------------------------------|
| `src/pages/contabilidade-para-industria.astro:337` | `/blog/bloco-k-sped-fiscal-como-evitar-multas` | **Slug inexistente** — O post real é `/blog/bloco-k-sped-fiscal-industria-guia`. Corrigir para o slug correto. |
| `src/components/Footer.astro:403` | `/como-abrir-empresa-em-blumenau` | **Rota estática, não blog** — A página existe em `/como-abrir-empresa-em-blumenau` (rota estática). Remover prefixo `/blog/`. |
| `src/pages/abertura-de-empresa.astro:304,322,355` | `/como-abrir-empresa-em-blumenau` | Mesmo caso acima — linkar para rota estática `/como-abrir-empresa-em-blumenau`. |
| `src/pages/index.astro:939` | `/como-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/pages/contabilidade-para-importacao-sc.astro:392` | `/blog/como-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/pages/contabilidade-para-industria.astro:332` | `/blog/creditos-icms-ipi-pis-cofins-industria` | **Slug inexistente** — Não há post com esse slug. Possível candidato: `/blog/credito-icms-diesel-transportadoras-santa-catarina-2026` (verificar conteúdo). |
| `src/content/blog/credito-icms-diesel-transportadoras-santa-catarina-2026.md:249` | `/blog/cte-mde-frete-transportadoras-como-evitar-multas` | **Slug inexistente** — Não há post com esse slug. Verificar se o post existe ou remover link. |
| `src/pages/contabilidade-para-transportadoras.astro:349` | `/blog/cte-mde-frete-transportadoras-como-evitar-multas` | Mesmo caso acima. |
| `src/pages/contabilidade-para-empresas-de-ti.astro:331` | `/blog/fator-r-simples-nacional-contabilidade-ti` | **Slug inexistente** — Post real: `/blog/fator-r-simples-nacional-como-calcular` ou `/blog/fator-r-no-simples-nacional-guia-reduzir-impostos`. Corrigir. |
| `src/content/blog/exportacao-de-software-servicos-ti-impostos-2026.md:171` | `/blog/fator-r-simples-nacional-contabilidade-ti` | Mesmo caso acima. |
| `src/pages/contabilidade-para-empresas-de-ti.astro:336` | `/blog/lei-do-bem-empresas-tecnologia-inovacao` | **Slug inexistente** — Não há post com esse slug. Verificar se o post existe ou remover link. |
| `src/content/blog/exportacao-de-software-servicos-ti-impostos-2026.md:172` | `/blog/lei-do-bem-empresas-tecnologia-inovacao` | Mesmo caso acima. |
| `src/content/blog/credito-icms-diesel-transportadoras-santa-catarina-2026.md:250` | `/blog/simples-nacional-lucro-real-transportadora-frota-2026` | **Slug inexistente** — Não há post com esse slug. Verificar se o post existe ou remover link. |
| `src/pages/contabilidade-para-transportadoras.astro:354` | `/blog/simples-nacional-lucro-real-transportadora-frota-2026` | Mesmo caso acima. |
| `src/content/blog/credito-icms-diesel-transportadoras-santa-catarina-2026.md` | `/blog/fale-conosco` | **Link para rota estática com prefixo `/blog/` incorreto** — A página de contato é `/fale-conosco`. Remover prefixo `/blog/`. |
| `src/content/blog/desoneracao-da-folha-2026-o-que-muda-com-a-reoneracao.md` | `/blog/fale-conosco` | Mesmo caso acima. |
| `src/content/blog/mei-2026-guia-completo-microempreendedor-individual.md:124` | `/blog/fale-conosco` | Mesmo caso acima. |
| `src/content/blog/mei-estourou-o-faturamento-o-que-fazer-agora.md:137` | `/blog/fale-conosco` | Mesmo caso acima. |
| `src/content/blog/migrar-de-mei-para-ltda-guia-completo-2026.md:164` | `/blog/fale-conosco` | Mesmo caso acima. |
| `src/content/blog/quanto-custa-abrir-empresa-em-blumenau-custos-e-taxas-2026.md:119` | `/blog/fale-conosco` | Mesmo caso acima. |
| `src/content/blog/abertura-de-empresa-em-santa-catarina-passo-a-passo-2026.md:167` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | **Slug inexistente** — O guia completo é a rota estática `/como-abrir-empresa-em-blumenau`. Corrigir para rota estática sem `/blog/`. |
| `src/content/blog/cnae-como-escolher-o-certo-e-por-que-errar-sai-caro.md:101` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/content/blog/mei-2026-guia-completo-microempreendedor-individual.md:124` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/content/blog/mei-estourou-o-faturamento-o-que-fazer-agora.md:137` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/content/blog/migrar-de-mei-para-ltda-guia-completo-2026.md:164` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | Mesmo caso acima. |
| `src/content/blog/quanto-custa-abrir-empresa-em-blumenau-custos-e-taxas-2026.md:12,119` | `/blog/guia-completo-para-abrir-empresa-em-blumenau` | Mesmo caso acima. |

---

## Links Quebrados — Rotas Estáticas

| Arquivo de Origem | Link Quebrado / 404 | Status / Sugestão de Correção |
|-------------------|---------------------|-------------------------------|
| `src/components/Header.astro`, `src/components/Footer.astro`, `src/layouts/Layout.astro:140` | `/blog` | **Rota de índice do blog é `/blog/index`** — Em Astro, `/blog` sozinho não gera rota (existe `/blog/index.astro` e `/blog/[slug].astro`). Corrigir para `/blog/index` ou manter como está se o servidor redireciona (verificar build). |

---

## Resumo

- **Total de links quebrados únicos:** 9 (blog) + 1 (estática) = **10 problemas únicos**
- **Ocorrências totais:** ~30 referências nos arquivos
- **Padrão principal:** Links para posts de blog que não existem (slugs incorretos) e rotas estáticas referenciadas com prefixo `/blog/` incorreto

---

## Próximos Passos Recomendados

1. **Corrigir slugs de posts inexistentes** — Atualizar para slugs reais existentes na lista de 84 posts
2. **Remover prefixo `/blog/` de rotas estáticas** — `/como-abrir-empresa-em-blumenau`, `/fale-conosco` são rotas de nível raiz
3. **Verificar `/blog` vs `/blog/index`** — Testar no build se `/blog` resolve corretamente ou precisa ser `/blog/index`
