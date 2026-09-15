"""Indexa todas as URLs do sitemap do cartasapp via Google Indexing API.

Uso (a partir da raiz do site-jmf-astro, onde fica gsc-credentials.json):
    python scripts/index_cartasapp.py          # todas as URLs
    python scripts/index_cartasapp.py 5         # apenas as 5 primeiras (teste)
"""
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

from google_indexer import notify_google

SITEMAP = "https://www.cartasapp.com.br/sitemap.xml"


def get_urls():
    with urllib.request.urlopen(SITEMAP) as r:
        tree = ET.fromstring(r.read())
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in tree.findall(".//sm:loc", ns)]


if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    urls = get_urls()
    if limit:
        urls = urls[:limit]
    print(f"Total de URLs: {len(urls)}")
    ok = err = 0
    for u in urls:
        try:
            notify_google(u)
            ok += 1
        except Exception as e:
            print(f"FALHOU: {u} | {e}")
            err += 1
            if "403" in str(e):
                print("Permissao negada: service account nao e owner do cartasapp no Search Console. Parando.")
                break
        time.sleep(0.2)
    print(f"\nConcluido. OK: {ok} | Erros: {err}")
