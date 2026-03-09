import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")

import requests
from requests.auth import HTTPBasicAuth

site = os.environ["JIRA_CLOUD_INSTANCE_URL"]  # https://seudominio.atlassian.net
email = os.environ["JIRA_EMAIL"]
token = os.environ["JIRA_API_TOKEN"]

url = f"{site}rest/api/3/search/jql"
payload = {
    "jql": "filter = 10629",
    "maxResults": 50,
    "fields": ["summary", "status", "assignee", "updated"]
}
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

resp = requests.post(url, json=payload, headers=headers, auth=HTTPBasicAuth(email, token))
resp.raise_for_status()

data = resp.json()
print("Total issues:", data.get("total"), "| Returned:", len(data.get("issues", [])))
print("Response keys:", list(data.keys()))

for issue in data.get("issues", []):
    print(issue["key"], issue["fields"].get("summary"))