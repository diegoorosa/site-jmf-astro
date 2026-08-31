import os
import json
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
SITE_URL = "https://www.jmfcontabilidade.com.br"

def get_gsc_service():
    credentials = service_account.Credentials.from_service_account_file(
        "gsc-credentials.json", scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=credentials)

def query_search_analytics(service, start_date, end_date, dimensions=None, row_limit=1000):
    request = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": dimensions or ["query"],
        "rowLimit": row_limit,
    }
    response = service.searchanalytics().query(siteUrl=SITE_URL, body=request).execute()
    return response.get("rows", [])

def main():
    service = get_gsc_service()
    end_date = datetime.now().date() - timedelta(days=3)
    start_date = end_date - timedelta(days=7)

    print(f"Período: {start_date} a {end_date}")

    rows = query_search_analytics(service, str(start_date), str(end_date), ["query", "page"])

    total_clicks = sum(r.get("clicks", 0) for r in rows)
    total_impressions = sum(r.get("impressions", 0) for r in rows)

    print(f"Total de linhas: {len(rows)}")
    print(f"Total cliques: {total_clicks}")
    print(f"Total impressões: {total_impressions}")
    print()

    for r in rows[:20]:
        query = r["keys"][0] if len(r["keys"]) > 0 else ""
        page = r["keys"][1] if len(r["keys"]) > 1 else ""
        clicks = r.get("clicks", 0)
        impressions = r.get("impressions", 0)
        ctr = r.get("ctr", 0)
        position = r.get("position", 0)
        print(f"{query[:60]:<60} | {page[:40]:<40} | C:{clicks:>4} I:{impressions:>5} CTR:{ctr:.2%} Pos:{position:.1f}")

if __name__ == "__main__":
    main()