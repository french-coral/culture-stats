import os
import json
from datetime import datetime, timezone

from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

notion = Client(auth=os.environ["NOTION_TOKEN"])


DATABASES = {
    "video_games": {
        "name": "Video Games",
        "id": "3dc15790-972b-8091-92e5-000b2c819a74",
    },
    "games": {
        "name": "Games",
        "id": "3dd15790-972b-8037-863e-000bbfb56f35",
    },
    "reads": {
        "name": "Reads",
        "id": "3dc15790-972b-80d9-9ec7-000b265cc4b4",
    },
    "multimedia": {
        "name": "Multimedia",
        "id": "3dd15790-972b-80df-980d-000ba0d8470c",
    },
    "music": {
        "name": "Music",
        "id": "3dd15790-972b-805d-b226-000ba62b07ec",
    },
}


def get_entries(data_source_id):
    entries = []
    cursor = None

    while True:
        response = notion.data_sources.query(
            data_source_id=data_source_id,
            start_cursor=cursor,
            page_size=100,
        )

        entries.extend(response["results"])

        if not response["has_more"]:
            break

        cursor = response["next_cursor"]

    return entries


stats = {
    "updated_at": datetime.now(timezone.utc).isoformat(),
    "databases": {},
}


for key, database in DATABASES.items():
    entries = get_entries(database["id"])

    stats["databases"][key] = {
        "name": database["name"],
        "total": len(entries),
    }

    print(f"{database['name']}: {len(entries)}")


with open("stats.json", "w", encoding="utf-8") as file:
    json.dump(stats, file, indent=2, ensure_ascii=False)


print("\nGenerated stats.json")