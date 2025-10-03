Portal da Transparência - datasets

Place downloaded CSV/ZIP files here. The repository includes a downloader script:

  node scripts/download_portal_datasets.js <url1> <url2> ...

Examples (these are sample portal URLs shown on the Portal pages and may redirect to actual file URLs):

  https://portaldatransparencia.gov.br/download-de-dados/despesas/20250101
  https://portaldatransparencia.gov.br/download-de-dados/servidores/202501_Aposentados_BACEN

Note: Some download endpoints may require the portal to be available and may perform redirects. If a link returns an HTML page or an error, open the URL in a browser to inspect and copy the direct link to the CSV/ZIP.