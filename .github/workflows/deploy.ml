name: Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

permissions:
  contents: write
  pages: write
  id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Elocuent
        run: |
          npx elocuent -d . -o meta/loc.csv

      - name: Commit and Push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          mkdir -p meta
          git pull
          git add -f meta/loc.csv
          git commit -m "Update code statistics" || echo "No changes to commit"
          git push
