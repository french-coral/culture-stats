import os
from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

notion = Client(auth=os.environ["NOTION_TOKEN"])

DATABASES = {
    "Video Games": "3dc15790-972b-8091-92e5-000b2c819a74",
    "Games": "3dd15790-972b-8037-863e-000bbfb56f35",
    "Reads": "3dc15790-972b-80d9-9ec7-000b265cc4b4",
    "Multimedia": "3dd15790-972b-80df-980d-000ba0d8470c",
    "Music": "3dd15790-972b-805d-b226-000ba62b07ec",
}


def count_entries(data_source_id):
    total = 0
    cursor = None

    while True: # ATTENTION, Notion sends only per batch of a 100 (got stuck for some time here)
        response = notion.data_sources.query(
            data_source_id=data_source_id,
            start_cursor=cursor,
            page_size=100,
        )

        total += len(response["results"])

        if not response["has_more"]:
            break

        cursor = response["next_cursor"]

    return total


for name, data_source_id in DATABASES.items():
    count = count_entries(data_source_id)
    print(f"{name}: {count}")