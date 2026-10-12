# Keringkam websites for Norinda K. Su'ut

Two desktop website concepts for the keringkam business of master artisan Norinda K. Su'ut (Instagram [@keringkam_mas](https://www.instagram.com/keringkam_mas/)). Both use her own photographs and story, and the brand name from her posts: **Kilauan, where heritage shimmers**.

| | Site 1, Kilauan | Site 2, Norinda K. Su'ut |
|---|---|---|
| Idea | A heritage house for keringkam, "held to the light" | The artisan's own atelier, "stitch by stitch" |
| Palette | Blush voile, crimson ink, gold thread | Batik pelangi: teal, hibiscus pink, marigold, plum and indigo |
| Type | Melodrama + Switzer | Clash Display + Satoshi + Gambetta |
| Signature moments | Veil preloader, shimmering gold wordmark, hanging gold fringe, selayah-to-selendang diagram, horizontal collection, stitched motif drawings | Batik flower sprays and borders, a cloth you can stitch gold and batik flowers onto, wooden frame that opens to full screen, shop with filters, draggable work rail, stacked lessons, Kuching to Kayseri route |
| Pages | Home, Collection, Heritage, Bespoke | Home, Work, Classes |
| Chat assistant | Crimson and gold | Hibiscus and plum |

## Structure

```
index.html        landing page linking both sites
credits.html      image credits
preview/          landing page thumbnails
site-1/           Kilauan (self-contained)
site-2/           Norinda K. Su'ut (self-contained)
  assets/css      fonts.css + style.css
  assets/js       focus.js (face-aware cropping), chatbot.js (chat assistant) + main.js
  assets/vendor   GSAP 3.13 and Lenis, served locally
  assets/img      WebP images
  assets/video    MP4 loops
```

Plain HTML, CSS and JavaScript, with no build step. To run locally, serve the folder with any static server, for example `python -m http.server`, and open `http://localhost:8000`.

## Notes

- **Desktop first.** Layouts are tuned for 1280 to 1920 px wide screens. Mobile comes next.
- **Face-aware cropping.** `focus.js` holds the face positions of every photo with people in it, detected with OpenCV's YuNet model. It sets each image's `object-position` so heads are never cut, whatever shape the frame is.
- **Chat assistant.** `chatbot.js` answers questions about classes, lessons, shows, pieces for sale, care, information and the story, in English and Malay. It runs in the browser from a written list of answers, so it needs no server; it could be connected to an AI model later.
- **Forms** validate, but don't send yet. They need Formspree, email or WhatsApp before launch.
- **Placeholders.** The table runner, cushion cover and bookmark images, plus some mood images, are stock. See `credits.html`.
