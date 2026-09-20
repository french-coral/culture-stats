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

for database_name, data_source_id in DATABASES.items():
    print("\n" + "=" * 60)
    print(database_name)
    print("=" * 60)

    response = notion.data_sources.retrieve(
        data_source_id=data_source_id
    )

    properties = response.get("properties", {})

    for name, prop in properties.items():
        print(f"\n{name}")
        print(f"  type: {prop.get('type')}")

        prop_type = prop.get("type")

        if prop_type in ("select", "status"):
            options = prop.get(prop_type, {}).get("options", [])
            if options:
                print(
                    "  options:",
                    ", ".join(option["name"] for option in options)
                )

        elif prop_type == "multi_select":
            options = prop.get("multi_select", {}).get("options", [])
            if options:
                print(
                    "  options:",
                    ", ".join(option["name"] for option in options)
                )