# Keringkam websites for Norinda K. Su'ut

Two desktop website concepts for the keringkam business of master artisan Norinda K. Su'ut (Instagram [@keringkam_mas](https://www.instagram.com/keringkam_mas/)). Both use her own photographs and story, and the brand name from her posts: **Kilauan, where heritage shimmers**.

| | Site 1, Kilauan | Site 2, Norinda K. Su'ut |
|---|---|---|
| Idea | A heritage house for keringkam, "held to the light" | The artisan's own atelier, "stitch by stitch" |
| Palette | Blush voile, crimson ink, gold thread | Cotton white, royal blue, gold |
| Type | Melodrama + Switzer | Clash Display + Gambetta |
| Signature moments | Veil preloader, shimmering gold wordmark, hanging gold fringe, selayah-to-selendang diagram, horizontal collection, stitched motif drawings | Gauze grid you can stitch on with the cursor, wooden frame that opens to full screen, draggable work rail, stacked lessons, Kuching to Kayseri route |
| Pages | Home, Collection, Heritage, Bespoke | Home, Work, Classes |

## Structure

```
index.html        landing page linking both sites
credits.html      image credits
preview/          landing page thumbnails
site-1/           Kilauan (self-contained)
site-2/           Norinda K. Su'ut (self-contained)
  assets/css      fonts.css + style.css
  assets/js       focus.js (face-aware cropping) + main.js
  assets/vendor   GSAP 3.13 and Lenis, served locally
  assets/img      WebP images
  assets/video    MP4 loops
```

Plain HTML, CSS and JavaScript, with no build step. To run locally, serve the folder with any static server, for example `python -m http.server`, and open `http://localhost:8000`.

## Notes

- **Desktop first.** Layouts are tuned for 1280 to 1920 px wide screens. Mobile comes next.
- **Face-aware cropping.** `focus.js` holds the face positions of every photo with people in it, detected with OpenCV's YuNet model. It sets each image's `object-position` so heads are never cut, whatever shape the frame is.
- **Forms** validate, but don't send yet. They need Formspree, email or WhatsApp before launch.
- **Placeholders.** The table runner, cushion cover and bookmark images, plus some mood images, are stock. See `credits.html`.
