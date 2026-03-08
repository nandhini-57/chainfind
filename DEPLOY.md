# ChainFind Deployment Guide

## ✅ Build Complete!
Your frontend is ready in the `dist` folder.

---

## Option 1: Netlify Drop (Easiest - 30 seconds)

1. **Go to:** https://app.netlify.com/drop
2. **Open this folder:** `chainfind/frontend/dist`
3. **Drag & drop** the entire `dist` folder onto the page
4. **Done!** Your site is live! 🎉

---

## Option 2: GitHub Pages

### Step 1: Upload to GitHub
1. Create a new repository on GitHub (github.com/new)
2. Name it `chainfind`
3. Don't initialize with README

### Step 2: Push your code
```bash
cd chainfind
git init
git add .
git commit -m "ChainFind - Decentralized Lost & Found"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chainfind.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repo on GitHub
2. Settings → Pages (left menu)
3. Source: **Deploy from a branch**
4. Branch: **main** → Folder: **/(root)**
5. Save and wait 2 minutes

Your site will be at: `https://YOUR_USERNAME.github.io/chainfind`

---

## Option 3: Vercel (Best Performance)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Add New Project → Import your GitHub repo
4. Framework Preset: **Vite**
5. Deploy! 🎉

---

## IMPORTANT: Backend Required!

The frontend needs a backend API to work. Deploy the backend separately:

### Deploy Backend (Render - Free)
1. Go to https://render.com
2. Sign up with GitHub
3. New → Web Service
4. Connect your GitHub repo (backend folder)
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Quick Help

**Frontend folder location:**
```
chainfind/frontend/dist
```

**Need to rebuild?**
```bash
cd chainfind/frontend
npm run build
```

