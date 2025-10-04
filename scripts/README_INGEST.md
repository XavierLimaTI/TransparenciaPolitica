Ingest CSV datasets to JSON

This repo includes scripts to download and ingest public datasets from the Portal da Transparência into a local `resources/data/ingested/` directory. The frontend reads `resources/data/manifest.json` and `resources/data/ingested/*.json` to display despesas without relying on the remote API or CORS.

Quick commands

# Re-download latest portal datasets (optional)
# node scripts/scrape_and_download_portal_datasets.js 6

# Ingest CSV files under resources/data into JSON
npm run ingest

# Result
# - resources/data/ingested/*.json (normalized JSON)
# - resources/data/manifest.json (index used by the frontend)

Notes

- The ingestion uses `lib/csv-parser.js` to normalize values (dates, numeric parsing, common column names).
- This workflow is intended for development and demos. Keep in mind large CSVs can be big.
- To update datasets, drop new CSVs into `resources/data/` (or use the scraper script), then run `npm run ingest`.
