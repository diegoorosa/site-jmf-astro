import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

LOGIN = os.getenv("DATAFORSEO_LOGIN")
PASSWORD = os.getenv("DATAFORSEO_PASSWORD")

def get_keyword_data(keywords, location_code=2076): # 2076 = Brasil
    url = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live"
    payload = [{
        "keywords": keywords,
        "location_code": location_code,
        "language_code": "pt"
    }]
    
    response = requests.post(url, auth=(LOGIN, PASSWORD), json=payload)
    return response.json()

if __name__ == "__main__":
    import sys
    terms = sys.argv[1:] if len(sys.argv) > 1 else ["contabilidade blumenau", "ttd 409 sc"]
    res = get_keyword_data(terms)
    print(json.dumps(res, indent=2))