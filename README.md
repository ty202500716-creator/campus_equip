# CampusEquip React (VS Code)

A React + Vite conversion of the supplied CampusEquip HTML/CSS/JavaScript pages. It includes the home page, equipment catalog with live search/filter/sort, and equipment detail pages.

## Run locally
1. Install **Node.js (LTS)** if it is not installed.
2. Extract this folder and open it in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the local URL Vite prints (usually `http://localhost:5173`).

## Pages
- `/` — Home
- `/equipment` — Equipment catalog
- `/details?item=laptop` — Equipment details (replace `laptop` with an item ID)

## Images
The HTML/CSS uploads reference image files under `/assets/images/...`, but image files were not among the uploaded files. To show your original equipment photos, copy your existing `assets` folder into this project's `public` folder so the images are at paths such as `public/assets/images/CA/Laptop.webp`. The hero uses the remote Unsplash background URL from your original stylesheet.

## Notes
Login, signup, and equipment requests remain demo interactions, matching the original project; there is no authentication or backend connected.
