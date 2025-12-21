# Internal Link Opportunity Finder

A lightweight, client-side tool for discovering internal link opportunities using semantic relevance instead of manual guesswork.

This project helps SEO freelancers and agencies quickly identify which existing pages on a site are most relevant to link from a new or existing article—without crawling, CMS access, or backend infrastructure.

---

## What This Project Does

The app takes two inputs:

1. **Sitemap data** 
2. **Article content** 

Each URL slug is treated as a proxy for a page’s primary topic. The tool analyzes the article’s content, infers its main themes and concepts, and then semantically compares them against all provided slugs.

The output is a **ranked list of internal link opportunities** (up to 20), each with a relevance score and short explanation describing why the page is a good match.

This allows users to quickly spot high-confidence internal links that would feel natural and helpful to readers.

---

## The Problem It Solves

Internal linking is often:

* Manual and time-consuming
* Based on keyword guessing or site searches
* Difficult to scale across many pages
* Poor at validating *semantic* relevance

Most tools require crawlers, CMS access, or complex setups. This project removes that friction by working entirely from user-provided inputs and running in the browser.

---

## Who This Is For

* Non-technical SEO freelancers
* SEO agencies and content teams
* Anyone doing on-page SEO who wants faster internal linking decisions
* Developers interested in semantic search or SEO tooling

Because this project is open source, developers can also fork it, run their own instance, or build on top of it.

---

## How It Works (High Level)

* URL slugs are tokenized and interpreted as topic summaries
* Article content is analyzed for key topics, concepts, and entities
* Lightweight semantic matching validates relevance (not just exact keywords)
* Results are ranked and returned with explainable scores

The tool does **not** insert links automatically. It surfaces high-confidence opportunities so humans stay in control.

---

## Tech Stack

* **Vite + React**
* **transformers.js (by Xenova)** for client-side semantic models

This project is inspired by and would not be possible without:

* **SemanticFinder**
  [https://github.com/do-me/SemanticFinder](https://github.com/do-me/SemanticFinder)
* **transformers.js documentation**
  [https://huggingface.co/docs/transformers.js/index#supported-tasksmodels](https://huggingface.co/docs/transformers.js/index#supported-tasksmodels)

---

## Installation & Onboarding

You can run the project locally:

```bash
git clone <repo-url>
cd <project-folder>
npm install
npm run dev
```

The app will be available at:

```
http://localhost:8080
```

No backend, database, or API keys are required.

---

## Contributing

Contributions are welcome in any form.

If you have experience with:

* SEO
* Internal linking strategies
* Semantic search
* UX for non-technical users
* Performance or optimization
* Documentation

…you’re encouraged to contribute.

Fork the repo, experiment freely, and submit a pull request. There are no strict contribution requirements—any help that improves the project is appreciated.

