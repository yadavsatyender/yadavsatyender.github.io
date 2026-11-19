# yadavsatyender.github.io

Personal research website of Satyender Yadav, with the Hazard Hub open-data catalogue and the Field notes blog. Plain HTML, CSS and JavaScript: no build step, so it runs on GitHub Pages as it is.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home: globe, research (risk equation), map-unit explainer, AI assistant, publications, about, contact |
| `hub.html` | Hazard Hub: live Uttarakhand rainfall and river outlook, global hazard pulse, dataset catalogue |
| `blog.html` | Field notes: list of posts and the post reader (`blog.html#post-slug`) |
| `cv.pdf` | **Add this.** Use a public version of your CV without phone number and referee contacts |

## Put it online (GitHub Pages, free)

1. Create a GitHub repository named exactly `yadavsatyender.github.io`.
2. Upload every file and folder in this project, keeping the folder structure.
3. In the repository, open **Settings, Pages**, set the source to the `main` branch and root folder, and save.
4. After a minute the site is live at `https://yadavsatyender.github.io`.
5. Optional: buy a domain such as `satyenderyadav.com` and add it under **Settings, Pages, Custom domain**.

The live feeds (Open-Meteo, GloFAS, NASA EONET, USGS) only work on the real website, not in previews.

## Add your weekly blog post

1. Write the story as a Markdown file in `posts/`, named `YYYY-MM-DD-short-title.md`.
2. Add an entry at the top of `posts/index.json`:

```json
{
  "slug": "short-title",
  "title": "Your title",
  "date": "2026-11-26",
  "tags": ["Landslides"],
  "summary": "One or two sentences that make people want to read it.",
  "file": "posts/2026-11-26-short-title.md"
}
```

3. Remove `"draft": true` from a post when it is ready. Images go in `posts/img/` and are linked as `![Caption](posts/img/photo.jpg)`.

Or ask Claude Code: *"Add this story as this week's blog post"* and paste the text.

## Add a dataset to Hazard Hub

Add an object to `assets/data/datasets.json` with `name, provider, group, hazards, access, coverage, resolution, period, desc, url`, plus `gee` and `ee` if it is in Google Earth Engine. `group` must be one of the seven groups already used.

## Credits

globe.gl (MIT), three.js (MIT), topojson-client (ISC), world-atlas from Natural Earth (ISC, public domain data), marked (MIT). Weather data by Open-Meteo.com (CC BY 4.0), GloFAS (Copernicus Emergency Management Service), NASA EONET, USGS.
