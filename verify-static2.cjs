const realStaticRoutes = [
  '/',
  '/404',
  '/abertura-de-empresa',
  '/abertura-empresa-sc',
  '/autor/[slug]',
  '/blog/[slug]',
  '/blog/index',
  '/calculadora-fator-r',
  '/calendario-fiscal-2026',
  '/como-abrir-empresa-em-blumenau',
  '/consultoria-e-planejamento-tributario',
  '/contabilidade-em-balneario-camboriu',
  '/contabilidade-em-blumenau',
  '/contabilidade-em-bombas',
  '/contabilidade-em-bombinhas',
  '/contabilidade-em-florianopolis',
  '/contabilidade-em-gaspar',
  '/contabilidade-em-indaial',
  '/contabilidade-em-itajai',
  '/contabilidade-em-pomerode',
  '/contabilidade-em-porto-belo',
  '/contabilidade-em-timbo',
  '/contabilidade-garcia-blumenau',
  '/contabilidade-para-clinicas-medicas',
  '/contabilidade-para-construcao-civil',
  '/contabilidade-para-empresas',
  '/contabilidade-para-empresas-de-ti',
  '/contabilidade-para-importacao-sc',
  '/contabilidade-para-industria',
  '/contabilidade-para-pessoa-fisica',
  '/contabilidade-para-transportadoras',
  '/contabilidade-velha-blumenau',
  '/contabilidade-vila-nova-blumenau',
  '/fale-conosco',
  '/gestao-contabil',
  '/gestao-fiscal-e-tributaria',
  '/gestao-pessoal',
  '/imposto-de-renda',
  '/index',
  '/mapa-do-site',
  '/migrar-de-mei-para-ltda',
  '/politica-de-privacidade',
  '/reforma-tributaria',
  '/regimes-tributarios',
  '/retirada-de-socios',
  '/segmentos',
  '/seguranca-dos-dados',
  '/simples-nacional',
  '/simulador-regime-tributario',
  '/sobre',
  '/termos-de-uso',
  '/trabalhe-conosco',
  '/transformar-mei-em-ltda'
];

// Check if a link matches any real route (including dynamic routes)
function isValidRoute(link) {
  if (link.includes('?')) return true; // skip query params
  if (link.startsWith('/assets/') || link.startsWith('/fonts/') || link.startsWith('/bi/') || link.startsWith('/_astro/')) return true; // assets
  
  // Exact match
  if (realStaticRoutes.includes(link)) return true;
  
  // Dynamic route /blog/[slug] matches /blog/*
  if (link.startsWith('/blog/') && link !== '/blog' && link !== '/blog/index') return true;
  
  // Dynamic route /autor/[slug] matches /autor/*
  if (link.startsWith('/autor/') && link !== '/autor') return true;
  
  return false;
}

// Referenced static links from astro files
const referencedStaticLinks = [
  '/',
  '/abertura-de-empresa',
  '/abertura-empresa-sc',
  '/blog',
  '/calculadora-fator-r',
  '/calendario-fiscal-2026',
  '/como-abrir-empresa-em-blumenau',
  '/consultoria-e-planejamento-tributario',
  '/contabilidade-em-balneario-camboriu',
  '/contabilidade-em-blumenau',
  '/contabilidade-em-bombas',
  '/contabilidade-em-bombinhas',
  '/contabilidade-em-florianopolis',
  '/contabilidade-em-gaspar',
  '/contabilidade-em-indaial',
  '/contabilidade-em-itajai',
  '/contabilidade-em-pomerode',
  '/contabilidade-em-porto-belo',
  '/contabilidade-em-timbo',
  '/contabilidade-para-clinicas-medicas',
  '/contabilidade-para-empresas',
  '/contabilidade-para-importacao-sc',
  '/contabilidade-para-industria',
  '/contabilidade-para-pessoa-fisica',
  '/fale-conosco',
  '/fale-conosco?assunto=troca-de-contador',
  '/gestao-contabil',
  '/gestao-fiscal-e-tributaria',
  '/gestao-pessoal',
  '/imposto-de-renda',
  '/mapa-do-site',
  '/migrar-de-mei-para-ltda',
  '/politica-de-privacidade',
  '/reforma-tributaria',
  '/retirada-de-socios',
  '/seguranca-dos-dados',
  '/simples-nacional',
  '/simulador-regime-tributario',
  '/sobre',
  '/termos-de-uso',
  '/trabalhe-conosco'
];

console.log('=== VALIDATION ===');
for (const link of referencedStaticLinks) {
  if (isValidRoute(link)) {
    console.log('OK: ' + link);
  } else {
    console.log('BROKEN: ' + link);
  }
}
