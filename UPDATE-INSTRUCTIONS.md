# Targeted update only

Replace only these repository files/folders:

- `valuation_option_lab.ipynb`
- `data/company_inputs.csv`
- `data/analyst_targets.csv`
- `docs/index.html`

Do **not** replace or edit `.github/workflows/deploy-pages.yml`.

## Student use
1. Edit one row in `data/company_inputs.csv`.
2. Replace the rows in `data/analyst_targets.csv`.
3. Commit the CSV changes.
4. The existing workflow runs the notebook, regenerates `docs/model_results.json`, and deploys the Plotly dashboard.
