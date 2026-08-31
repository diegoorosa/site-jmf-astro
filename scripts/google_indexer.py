import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/indexing"]
ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"

def notify_google(url_to_index, action="URL_UPDATED"):
    credentials = service_account.Credentials.from_service_account_file(
        "gsc-credentials.json", scopes=SCOPES
    )
    service = build("indexing", "v3", credentials=credentials)
    
    content = {
        "url": url_to_index,
        "type": action  # "URL_UPDATED" ou "URL_DELETED"
    }
    
    response = service.urlNotifications().publish(body=content).execute()
    print(f"URL: {url_to_index} | Resposta: {response}")
    return response

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        notify_google(target_url)
    else:
        print("Uso: python scripts/google_indexer.py https://www.jmfcontabilidade.com.br/sua-pagina")