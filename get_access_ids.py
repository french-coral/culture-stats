import os
from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

notion = Client(auth=os.environ["NOTION_TOKEN"])

response = notion.search(
    filter={
        "property": "object",
        "value": "data_source",
    }
)

print("Accessible data sources:")
print()

for result in response["results"]:
    print(f"- {result.get('title', [{}])[0].get('plain_text', 'Untitled')}")
    print(f"  ID: {result['id']}")
    print()