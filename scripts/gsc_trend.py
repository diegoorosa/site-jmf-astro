"""Analisa queda de posicao media no GSC (jmfcontabilidade.com.br).

Compara periodos mensais e queries principais de contabilidade em Blumenau.
Dados brutos salvos em gsc_trend_analysis.json.
"""
import json
from datetime import date, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
SITE_URL = "sc-domain:jmfcontabilidade.com.br"


def get_service():
    creds = service_account.Credentials.from_service_account_file(
        "gsc-credentials.json", scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=creds)


def query(service, start, end, dimensions, row_limit=1000):
    req = {
        "startDate": str(start),
        "endDate": str(end),
        "dimensions": dimensions,
        "rowLimit": row_limit,
    }
    return service.searchanalytics().query(siteUrl=SITE_URL, body=req).execute().get("rows", [])


def agg(rows):
    c = sum(r["clicks"] for r in rows)
    i = sum(r["impressions"] for r in rows)
    # posicao media ponderada por impressoes
    p = sum(r["position"] * r["impressions"] for r in rows) / i if i else 0
    return {"clicks": c, "impressions": i, "ctr": c / i if i else 0, "avg_position": p}


def main():
    svc = get_service()
    today = date.today() - timedelta(days=3)  # margem de dados do GSC
    out = {"gerado": str(today), "meses": [], "queries_blumenau": {}, "queries_contabilidade": {}}

    # 1) Tendencia mensal (6 meses, janelas de 28 dias)
    end = today
    for _ in range(6):
        start = end - timedelta(days=27)
        rows = query(svc, start, end, ["query"])
        a = agg(rows)
        a["periodo"] = f"{start} a {end}"
        out["meses"].append(a)
        end = start - timedelta(days=1)

    # 2) Queries com "blumenau" - ultimos 28d vs 28d anteriores vs ~6 meses atras
    end = today
    for label in ["28d_recente", "28d_anterior", "28d_6meses_atras"]:
        start = end - timedelta(days=27)
        rows = query(svc, start, end, ["query"], 1000)
        filt = [r for r in rows if "blumenau" in r["keys"][0].lower()]
        filt.sort(key=lambda r: -r["impressions"])
        out["queries_blumenau"][label] = {
            "periodo": f"{start} a {end}",
            "total": agg(filt),
            "top": [
                {
                    "query": r["keys"][0],
                    "clicks": r["clicks"],
                    "impressions": r["impressions"],
                    "ctr": round(r["ctr"], 4),
                    "position": round(r["position"], 1),
                }
                for r in filt[:25]
            ],
        }
        if label == "28d_recente":
            end = end - timedelta(days=28)
        else:
            end = end - timedelta(days=28 * 5)

    # 3) Queries com "contabilidade" (sem blumenau) - mesmos 2 periodos recentes
    end = today
    for label in ["28d_recente", "28d_anterior"]:
        start = end - timedelta(days=27)
        rows = query(svc, start, end, ["query"], 1000)
        filt = [r for r in rows if "contabilidade" in r["keys"][0].lower() and "blumenau" not in r["keys"][0].lower()]
        filt.sort(key=lambda r: -r["impressions"])
        out["queries_contabilidade"][label] = {
            "periodo": f"{start} a {end}",
            "total": agg(filt),
            "top": [
                {
                    "query": r["keys"][0],
                    "clicks": r["clicks"],
                    "impressions": r["impressions"],
                    "ctr": round(r["ctr"], 4),
                    "position": round(r["position"], 1),
                }
                for r in filt[:20]
            ],
        }
        end = end - timedelta(days=28)

    # 4) Por pagina - ultimos 28d vs anteriores (ver quais paginas caíram)
    end = today
    for label in ["28d_recente", "28d_anterior"]:
        start = end - timedelta(days=27)
        rows = query(svc, start, end, ["page"])
        rows.sort(key=lambda r: -r["impressions"])
        out.setdefault("paginas", {})[label] = {
            "periodo": f"{start} a {end}",
            "total": agg(rows),
            "top": [
                {
                    "page": r["keys"][0],
                    "clicks": r["clicks"],
                    "impressions": r["impressions"],
                    "ctr": round(r["ctr"], 4),
                    "position": round(r["position"], 1),
                }
                for r in rows[:25]
            ],
        }
        end = end - timedelta(days=28)

    with open("gsc_trend_analysis.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("OK - salvo em gsc_trend_analysis.json")


if __name__ == "__main__":
    main()
