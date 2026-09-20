import json
import os
from collections import Counter, defaultdict
from datetime import datetime

from dotenv import load_dotenv
from notion_client import Client


load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")

if not NOTION_TOKEN:
    raise RuntimeError("NOTION_TOKEN is missing")

notion = Client(auth=NOTION_TOKEN)


# Keep your existing IDs here.
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


RATING_VALUES = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]


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

        if not response.get("has_more"):
            break

        cursor = response["next_cursor"]

    return entries


def get_property_value(page, property_name):
    prop = page["properties"].get(property_name)

    if not prop:
        return None

    prop_type = prop["type"]

    if prop_type == "select":
        value = prop["select"]
        return value["name"] if value else None

    if prop_type == "multi_select":
        values = prop["multi_select"]
        return [item["name"] for item in values]

    if prop_type == "number":
        return prop["number"]

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
    except (TypeError, ValueError):
        return None


def parse_rating(value):
    if not value:
        return None

    value = str(value)

    star_map = {
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

    return star_map.get(value)


def get_created_date(page):
    created_time = page.get("created_time")

    if not created_time:
        return None

    try:
        return datetime.fromisoformat(created_time.replace("Z", "+00:00"))
    except ValueError:
        return None


def get_release_year(page, property_name):
    value = get_property_value(page, property_name)

    if not value:
        return None

    # Release Date is currently a select in the databases.
    # We try to extract a 4-digit year from it.
    value = str(value)

    for part in value.replace("/", "-").replace(".", "-").split("-"):
        if len(part) == 4 and part.isdigit():
            return int(part)

    return None


def generate_database_stats(config):

    entries = get_entries(config["id"])

    total = len(entries)

    years = Counter()
    year_months = defaultdict(Counter)
    heatmap = Counter()
    ratings = Counter()

    release_years = []
    release_ages = []

    for rating in RATING_VALUES:
        ratings[rating] = 0

    for page in entries:

        consumption_year = get_year(
            page,
            config["year_property"],
        )

        created_date = get_created_date(page)

        # --------------------------------------------------
        # Entries over time / year statistics
        # --------------------------------------------------

        if consumption_year is not None:

            years[consumption_year] += 1

            # Monthly activity is based on the entry's
            # creation month.
            if (
                created_date
                and created_date.year == consumption_year
            ):
                year_months[
                    consumption_year
                ][created_date.month] += 1


        # --------------------------------------------------
        # GitHub-style heatmap
        # --------------------------------------------------

        if created_date:

            date_key = created_date.date().isoformat()

            heatmap[date_key] += 1


        # --------------------------------------------------
        # Ratings
        # --------------------------------------------------

        rating_value = get_property_value(
            page,
            config["rating_property"],
        )

        rating = parse_rating(rating_value)

        if rating is not None:
            ratings[rating] += 1


        # --------------------------------------------------
        # Release dates
        # --------------------------------------------------

        release_year = get_release_year(
            page,
            config["release_property"],
        )

        # Average release year.
        #
        # This does NOT require a consumption year.
        if release_year is not None:
            release_years.append(release_year)

        # Release age.
        #
        # This DOES require both years.
        if (
            consumption_year is not None
            and release_year is not None
            and release_year <= consumption_year
        ):
            release_ages.append(
                consumption_year - release_year
            )


    # ------------------------------------------------------
    # Year statistics
    # ------------------------------------------------------

    year_stats = {}

    for year in sorted(years):

        months = year_months[year]

        active_months = sum(
            1
            for count in months.values()
            if count > 0
        )

        year_total = years[year]

        average_per_active_month = (
            year_total / active_months
            if active_months
            else 0
        )

        year_stats[str(year)] = {

            "total": year_total,

            "active_months": active_months,

            "average_per_active_month": round(
                average_per_active_month,
                2,
            ),

            "months": {
                str(month): count
                for month, count
                in sorted(months.items())
            },
        }


    # ------------------------------------------------------
    # Ratings
    # ------------------------------------------------------

    rated_total = sum(
        ratings.values()
    )

    rating_average = None

    if rated_total:

        rating_average = round(
            sum(
                rating * count
                for rating, count
                in ratings.items()
            ) / rated_total,
            2,
        )


    # ------------------------------------------------------
    # Release age
    # ------------------------------------------------------

    release_age_average = None

    if release_ages:

        release_age_average = round(
            sum(release_ages)
            / len(release_ages),
            2,
        )


    # ------------------------------------------------------
    # Average release year
    # ------------------------------------------------------

    average_release_year = None

    if release_years:

        average_release_year = round(
            sum(release_years)
            / len(release_years),
            1,
        )


    # ------------------------------------------------------
    # Return statistics
    # ------------------------------------------------------

    return {

        "name": config["name"],

        "total": total,

        "years": {
            str(year): count
            for year, count
            in sorted(years.items())
        },

        "year_stats": year_stats,

        "heatmap": {
            date: count
            for date, count
            in sorted(heatmap.items())
        },

        "ratings": {

            "distribution": {
                str(rating): ratings[rating]
                for rating in RATING_VALUES
            },

            "rated_total": rated_total,

            "average": rating_average,
        },

        "release_age": {

            "average": release_age_average,

            "average_release_year": average_release_year,

            "entries_with_data": len(
                release_ages),

            "release_year_entries_with_data": len(release_years),
            
        },
}


def combine_all_stats(database_stats):

    """
    Build the aggregate "All" view by combining the five databases.
    """

    total = 0

    years = Counter()
    year_months = defaultdict(Counter)
    heatmap = Counter()
    ratings = Counter()

    release_age_weighted_sum = 0
    release_age_entries = 0

    release_year_weighted_sum = 0
    release_year_entries = 0

    breakdown = {}

    for key, stats in database_stats.items():

        db_total = stats["total"]
        total += db_total

        breakdown[key] = db_total

        # Years.
        for year, count in stats["years"].items():
            years[int(year)] += count

        # Monthly statistics.
        for year, year_data in stats["year_stats"].items():

            for month, count in year_data["months"].items():
                year_months[int(year)][int(month)] += count

        # Heatmap.
        for date, count in stats["heatmap"].items():
            heatmap[date] += count

        # Ratings.
        for rating, count in stats["ratings"]["distribution"].items():
            ratings[int(rating)] += count

        # Release age weighted average.
        release_age = stats["release_age"]

        entries_with_data = release_age["entries_with_data"]
        average = release_age["average"]

        if average is not None and entries_with_data:
            release_age_weighted_sum += (
                average * entries_with_data
            )

            release_age_entries += entries_with_data

        # Average release year.
        release_year_average = release_age.get(
            "average_release_year"
        )

        release_year_data_entries = release_age.get(
            "release_year_entries_with_data",
            0,
        )

        if (
            release_year_average is not None
            and release_year_data_entries
        ):
            release_year_weighted_sum += (
                release_year_average
                * release_year_data_entries
            )

            release_year_entries += release_year_data_entries

    # Combined year statistics.
    year_stats = {}

    for year in sorted(years):

        months = year_months[year]

        active_months = sum(
            1
            for count in months.values()
            if count > 0
        )

        year_total = years[year]

        average_per_active_month = (
            year_total / active_months
            if active_months
            else 0
        )

        year_stats[str(year)] = {
            "total": year_total,
            "active_months": active_months,
            "average_per_active_month": round(
                average_per_active_month,
                2,
            ),
            "months": {
                str(month): count
                for month, count
                in sorted(months.items())
            },
        }

    # Combined rating statistics.
    rated_total = sum(ratings.values())

    rating_average = None

    if rated_total:
        rating_average = round(
            sum(
                rating * count
                for rating, count in ratings.items()
            ) / rated_total,
            2,
        )

    # Combined release age.
    release_age_average = None

    if release_age_entries:
        release_age_average = round(
            release_age_weighted_sum
            / release_age_entries,
            2,
        )

    # Combined average release year.
    average_release_year = None

    if release_year_entries:
        average_release_year = round(
            release_year_weighted_sum
            / release_year_entries,
            1,
        )

    return {
        "name": "All",

        "total": total,

        "years": {
            str(year): count
            for year, count
            in sorted(years.items())
        },

        "year_stats": year_stats,

        "heatmap": {
            date: count
            for date, count
            in sorted(heatmap.items())
        },

        "ratings": {
            "distribution": {
                str(rating): ratings[rating]
                for rating in RATING_VALUES
            },
            "rated_total": rated_total,
            "average": rating_average,
        },

        "release_age": {
            "average": release_age_average,
            "average_release_year": average_release_year,
            "entries_with_data": release_age_entries,
            "release_year_entries_with_data": release_year_entries,
        },

        # Used by the frontend to create the pastel donut.
        "breakdown": breakdown,
    }


def main():
    database_stats = {}

    for key, config in DATABASES.items():
        print(f"Generating statistics for {config['name']}...")

        database_stats[key] = generate_database_stats(config)

        print(
            f"  → {database_stats[key]['total']} entries"
        )

    all_stats = combine_all_stats(database_stats)

    # Put "all" first so it becomes the default dashboard view.
    output_databases = {
        "all": all_stats,
        **database_stats,
    }

    output = {
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "databases": output_databases,
    }

    with open("stats.json", "w", encoding="utf-8") as file:
        json.dump(
            output,
            file,
            indent=2,
            ensure_ascii=False,
        )

    print()
    print(f"Total entries: {all_stats['total']}")
    print("Breakdown:")

    for key, count in all_stats["breakdown"].items():
        print(f"  {key}: {count}")

    print()
    print("stats.json updated successfully.")


if __name__ == "__main__":
    main()