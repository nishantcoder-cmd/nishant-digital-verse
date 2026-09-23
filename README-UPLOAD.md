# FLAT-PACK — UPLOAD GUIDE (2 minute)

Tumhara GitHub repo (`nishant-digital-verse`) files ko ROOT par flat rakhta hai
(koi `assets/` folder nahi), isliye purani HTML files `assets/...` dhund kar
404 kha rahi thin aur site bina style ke khul rahi thi.

Ye 10 files root-level paths use karti hain — tumhare CURRENT repo ke saath
100% match. Bas upload karo:

1. GitHub → repo `nishant-digital-verse` → **Add file → Upload files**
2. Is folder ki **ye 10 files** drag-drop karo:
   - index.html, about.html, works.html, projects.html, skills.html,
     gallery.html, music.html, status.html, contact.html
   - main.js
3. GitHub bolega "replace existing files" → **Commit changes**
4. Kholo: https://nishantcoder-cmd.github.io/nishant-digital-verse/
   Hard refresh: `Ctrl + Shift + R`

## Chhune ki zaroorat NAHI
- style.css, phonk.mp3, saare .webp/.jpg — root par already sahi naam se hain ✔
- README.md — waisa hi rehne do

## Optional safai
- `gen_art.py` / `gen_music.py` repo se delete kar sakte ho (ye generator
  tools hain, site ka hissa nahi).

## Bonus
- `../profile-README.md` ab tumhare username (`nishantcoder-cmd`) ke saath
  ready hai — `nishantcoder-cmd/nishantcoder-cmd` naam ke special repo me
  README.md + banner.webp daalo → profile bhi futuristic hogi.
