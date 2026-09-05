# Philanthropy gallery

`gallery.json` drives the photo and video area at `/philanthropy/`. Add an entry per item, then run `npm run build`.

Photos: drop the file in `assets/philanthropy/` (JPG or WebP, at least 1600px on the long side; the build does not resize).

```json
{
  "items": [
    {
      "type": "image",
      "src": "/assets/philanthropy/2026-03-school-visit.jpg",
      "alt": "Children at their desks during a school visit, March 2026",
      "caption": "Learning materials delivered to a primary school in New Delhi",
      "date": "2026-03",
      "wide": false
    },
    {
      "type": "video",
      "provider": "youtube",
      "id": "VIDEO_ID",
      "poster": "/assets/philanthropy/2026-03-visit-poster.jpg",
      "alt": "Video: distributing meals",
      "caption": "Nutrition programme, spring 2026",
      "date": "2026-04",
      "wide": true
    }
  ]
}
```

- `alt` is required and should describe the picture for someone who cannot see it.
- `wide: true` makes the tile span two columns; use it for landscape shots you want to lead with.
- Video uses a YouTube or Vimeo `id` plus a `poster` image, so nothing loads from those services until the visitor presses play.
- Consent: only publish photographs of children with the guardian's or organisation's permission.
