import os
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone

from dotenv import load_dotenv
from notion_client import Client

load_dotenv()

notion = Client(auth=os.environ["NOTION_TOKEN"])


DATABASES = {
    "video_games": {
        "name": "Video Games",
        "id": "3dc15790-972b-8091-92e5-000b2c819a74",
        "year_property": "Year Played",
        "release_property": "Release Date",
        "rating_property": "Rating  -5/5",
    },
    "games": {
        "name": "Games",
        "id": "3dd15790-972b-8037-863e-000bbfb56f35",
        "year_property": "Played Year",
        "release_property": "Release Date",
        "rating_property": "Rating -5/5",
    },
    "reads": {
        "name": "Reads",
        "id": "3dc15790-972b-80d9-9ec7-000b265cc4b4",
        "year_property": "Year read",
        "release_property": "Release Date",
        "rating_property": "Rating  -5/5",
    },
    "multimedia": {
        "name": "Multimedia",
        "id": "3dd15790-972b-80df-980d-000ba0d8470c",
        "year_property": "Watch Year",
        "release_property": "Release Date",
        "rating_property": "Rating -5/5",
    },
    "music": {
        "name": "Music",
        "id": "3dd15790-972b-805d-b226-000ba62b07ec",
        "year_property": "Year Listened",
        "release_property": "Release Date",
        "rating_property": "Rating -5/5",
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


def get_property_value(page, property_name):
    prop = page["properties"].get(property_name)

    if not prop:
        return None

    prop_type = prop["type"]
    value = prop.get(prop_type)

    if not value:
        return None

    if prop_type == "select":
        return value.get("name")

    if prop_type == "multi_select":
        return [item["name"] for item in value]

    if prop_type == "number":
        return value

    return None


def get_year(page, property_name):
    value = get_property_value(page, property_name)

    if isinstance(value, list):
        if not value:
            return None
        value = value[0]

    if value is None:
        return None

    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def parse_rating(value):
    if not value:
        return None

    if isinstance(value, list):
        if not value:
            return None
        value = value[0]

    rating_map = {
        "★★★★★": 5,
        "★★★★": 4,
        "★★★": 3,
        "★★": 2,
        "★": 1,
        "☆": -1,
        "☆☆": -2,
        "☆☆☆": -3,
        "☆☆☆☆": -4,
        "☆☆☆☆☆": -5,
    }

    return rating_map.get(value)


def get_created_date(page):
    created_time = page.get("created_time")

    if not created_time:
        return None

    try:
        return datetime.fromisoformat(
            created_time.replace("Z", "+00:00")
        )
    except ValueError:
        return None


def empty_year_stats():
    return {
        "total": 0,
        "active_months": 0,
        "average_per_active_month": 0,
    }


all_stats = {
    "updated_at": datetime.now(timezone.utc).isoformat(),
    "databases": {},
}


for key, database in DATABASES.items():

    print(f"\nProcessing {database['name']}...")

    entries = get_entries(database["id"])

    yearly = Counter()
    monthly = defaultdict(Counter)

    heatmap = Counter()

    ratings = Counter()

    release_ages = []

    years_seen = set()

    for page in entries:

        # --------------------------------------------------
        # Creation date / heatmap
        # --------------------------------------------------

        created = get_created_date(page)

        if created:
            date_key = created.date().isoformat()
            heatmap[date_key] += 1

        # --------------------------------------------------
        # Consumption year
        # --------------------------------------------------

        consumption_year = get_year(
            page,
            database["year_property"],
        )

        if consumption_year:
            yearly[consumption_year] += 1

            if created:
                month = created.month
                monthly[consumption_year][month] += 1

            years_seen.add(consumption_year)

        # --------------------------------------------------
        # Rating
        # --------------------------------------------------

        rating_value = get_property_value(
            page,
            database["rating_property"],
        )

        rating = parse_rating(rating_value)

        if rating is not None:
            ratings[rating] += 1

        # --------------------------------------------------
        # Release age
        # --------------------------------------------------

        release_year = get_year(
            page,
            database["release_property"],
        )

        if consumption_year and release_year:
            age = consumption_year - release_year

            # Ignore impossible negative ages.
            if age >= 0:
                release_ages.append(age)

    # ------------------------------------------------------
    # Year summaries
    # ------------------------------------------------------

    year_stats = {}

    for year in sorted(years_seen):

        month_counts = monthly[year]

        total = yearly[year]
        active_months = len(month_counts)

        average = (
            total / active_months
            if active_months
            else 0
        )

        year_stats[str(year)] = {
            "total": total,
            "active_months": active_months,
            "average_per_active_month": round(
                average,
                2,
            ),
            "months": {
                str(month): count
                for month, count in sorted(
                    month_counts.items()
                )
            },
        }

    # ------------------------------------------------------
    # Rating distribution
    # ------------------------------------------------------

    rating_distribution = {
        str(rating): ratings.get(rating, 0)
        for rating in range(5, -6, -1)
        if rating != 0
    }

    rated_total = sum(ratings.values())

    average_rating = (
        sum(
            rating * count
            for rating, count in ratings.items()
        )
        / rated_total
        if rated_total
        else None
    )

    # ------------------------------------------------------
    # Release age
    # ------------------------------------------------------

    average_release_age = (
        sum(release_ages) / len(release_ages)
        if release_ages
        else None
    )

    # ------------------------------------------------------
    # Final database object
    # ------------------------------------------------------

    all_stats["databases"][key] = {
        "name": database["name"],

        "total": len(entries),

        "years": {
            str(year): count
            for year, count in sorted(
                yearly.items()
            )
        },

        "year_stats": year_stats,

        "heatmap": {
            date: count
            for date, count in sorted(
                heatmap.items()
            )
        },

        "ratings": {
            "distribution": rating_distribution,
            "rated_total": rated_total,
            "average": (
                round(average_rating, 2)
                if average_rating is not None
                else None
            ),
        },

        "release_age": {
            "average": (
                round(average_release_age, 2)
                if average_release_age is not None
                else None
            ),
            "entries_with_data": len(
                release_ages
            ),
        },
    }

    print(
        f"  Total entries: {len(entries)}"
    )

    print(
        f"  Years: {sorted(years_seen)}"
    )

    print(
        f"  Rated entries: {rated_total}"
    )

    print(
        f"  Average rating: "
        f"{average_rating:.2f}"
        if average_rating is not None
        else "  Average rating: N/A"
    )

    print(
        f"  Average release age: "
        f"{average_release_age:.2f} years"
        if average_release_age is not None
        else "  Average release age: N/A"
    )


with open(
    "stats.json",
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        all_stats,
        file,
        indent=2,
        ensure_ascii=False,
    )


print("\nGenerated stats.json")