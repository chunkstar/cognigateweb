# 🚀 Deploying Cognigate Website to cognigate.dev

This guide will help you publish the Cognigate landing page to **cognigate.dev** using GitHub Pages.

---

## 📋 Prerequisites

1. **Domain**: You own `cognigate.dev` (registered with a domain registrar)
2. **GitHub Account**: Access to create/manage repositories
3. **Git**: Installed locally

---

## 🌐 Step 1: Configure Your Domain (DNS Settings)

Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare) and add these DNS records:

### Option A: Using A Records (Recommended)

Add these **4 A records** pointing to GitHub's IP addresses:

```
Type: A
Host: @
Value: 185.199.108.153

Type: A
Host: @
Value: 185.199.109.153

Type: A
Host: @
Value: 185.199.110.153

Type: A
Host: @
Value: 185.199.111.153
```

### Option B: Using CNAME (Alternative)

If you prefer using `www.cognigate.dev`:

```
Type: CNAME
Host: www
Value: yourusername.github.io
```

**Important**: DNS changes can take 24-48 hours to propagate (usually much faster).

---

## 📦 Step 2: Create GitHub Repository

### 2.1 Create Repository on GitHub

1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Repository name: `cognigate` (or any name you prefer)
4. Visibility: **Public** (required for free GitHub Pages)
5. Click **"Create repository"**

### 2.2 Initialize Git in Your Project

```bash
# Navigate to your project
cd C:\BAI\cognigate

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Cognigate v1.0.0"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/cognigate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Replace `yourusername` with your actual GitHub username!**

---

## ⚙️ Step 3: Enable GitHub Pages

### 3.1 Configure Pages in GitHub

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **"Source"**:
   - Branch: `main`
   - Folder: `/docs`
5. Click **"Save"**

### 3.2 Configure Custom Domain

1. Still on the Pages settings page
2. Under **"Custom domain"**:
   - Enter: `cognigate.dev`
   - Click **"Save"**
3. Wait a moment, then check **"Enforce HTTPS"** (appears after DNS verification)

GitHub will automatically verify your domain. This may take a few minutes.

---

## ✅ Step 4: Verify Deployment

### 4.1 Check GitHub Pages Status

On the Pages settings, you should see:

```
✅ Your site is live at https://cognigate.dev
```

### 4.2 Visit Your Site

Open your browser and go to:
- **https://cognigate.dev**
- **https://www.cognigate.dev** (if configured)

The landing page should load with:
- Hero section with "Never Get Surprised by AI Bills Again"
- Features grid
- Code examples
- Provider cards
- Smooth animations

---

## 🔧 Step 5: Update Links in Website

Before final deployment, update these placeholders in `docs/index.html`:

### Replace GitHub Links

Find and replace **`yourusername`** with your actual GitHub username:

```html
<!-- Change from: -->
<a href="https://github.com/yourusername/cognigate">

<!-- To: -->
<a href="https://github.com/YOURACTUALUSERNAME/cognigate">
```

Update in these locations:
- Line 141: GitHub link in nav
- Line 176: View on GitHub button
- Line 411: GitHub CTA
- Line 418: Footer GitHub link

### Commit and Push Changes

```bash
# After updating the HTML
git add docs/index.html
git commit -m "Update GitHub links with actual username"
git push
```

Wait 1-2 minutes for GitHub Pages to rebuild.

---

## 🎨 Customization Guide

### Update Colors

Edit the CSS variables in `docs/index.html` (lines 13-23):

```css
:root {
    --primary: #6366f1;        /* Main brand color */
    --primary-dark: #4f46e5;   /* Darker shade */
    --secondary: #8b5cf6;      /* Secondary color */
    --success: #10b981;        /* Green for success */
    --warning: #f59e0b;        /* Orange for warnings */
    --danger: #ef4444;         /* Red for errors */
}
```

### Update Content

- **Hero Title**: Line 164
- **Hero Description**: Line 165
- **Features**: Lines 199-249
- **Stats**: Lines 187-203
- **Footer**: Lines 402-419

### Add Analytics (Optional)

Add before `</head>` tag (line 156):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🐛 Troubleshooting

### DNS Not Resolving

**Problem**: `cognigate.dev` doesn't load

**Solutions**:
1. Check DNS records are correct (use [dnschecker.org](https://dnschecker.org))
2. Wait 24-48 hours for DNS propagation
3. Clear your browser cache (Ctrl+Shift+Delete)
4. Try incognito mode

### 404 Error

**Problem**: Page shows "404 - Not Found"

**Solutions**:
1. Verify GitHub Pages is enabled in Settings → Pages
2. Check source is set to `/docs` folder
3. Verify `docs/index.html` exists in your repository
4. Wait 2-3 minutes after pushing changes

### HTTPS Not Available

**Problem**: Can't enable "Enforce HTTPS"

**Solutions**:
1. Verify DNS records are correct
2. Wait for DNS propagation
3. Remove and re-add custom domain in GitHub Pages settings
4. Wait 15-30 minutes for SSL certificate generation

### CNAME File Missing

**Problem**: Custom domain keeps resetting

**Solutions**:
1. Verify `docs/CNAME` file exists with content: `cognigate.dev`
2. Don't delete this file when pushing updates
3. If deleted, GitHub Pages will disable custom domain

---

## 🔄 Updating the Website

### Make Changes Locally

```bash
# Edit docs/index.html
code docs/index.html

# Save changes
git add docs/index.html
git commit -m "Update landing page content"
git push
```

### Changes Go Live Automatically

GitHub Pages automatically rebuilds your site when you push. Wait 1-2 minutes.

---

## 📊 Monitoring

### Check Build Status

1. Go to repository **Actions** tab
2. See **"pages build and deployment"** workflows
3. Green checkmark = success ✅
4. Red X = failed ❌ (check logs)

### View Traffic

1. Repository **Insights** tab
2. Click **Traffic**
3. See page views and visitor stats

---

## 🚀 Advanced: Custom Subdomain

Want to add `docs.cognigate.dev` or `www.cognigate.dev`?

### Add DNS Record

```
Type: CNAME
Host: docs (or www)
Value: yourusername.github.io
```

### Update CNAME File

Change `docs/CNAME` to:
```
docs.cognigate.dev
```

---

## ✨ Final Checklist

Before going live:

- [ ] DNS A records configured
- [ ] GitHub repository created and pushed
- [ ] GitHub Pages enabled with `/docs` folder
- [ ] Custom domain `cognigate.dev` added
- [ ] HTTPS enforced
- [ ] All GitHub links updated with real username
- [ ] Site loads at https://cognigate.dev
- [ ] Tested on mobile and desktop
- [ ] Smooth animations working
- [ ] All links work correctly

---

## 🎉 You're Live!

Your Cognigate landing page is now live at **https://cognigate.dev**!

Share it:
- Twitter: "Check out Cognigate - AI gateway with budget protection 🚀 https://cognigate.dev"
- LinkedIn: Post with #AI #OpenSource #TypeScript
- Reddit: r/webdev, r/javascript, r/typescript
- Hacker News: Submit your repository

---

## 📞 Need Help?

- **DNS Issues**: Check with your domain registrar support
- **GitHub Pages**: [GitHub Pages Documentation](https://docs.github.com/en/pages)
- **SSL/HTTPS**: [Custom Domain HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/securing-your-github-pages-site-with-https)

---

**Last Updated**: November 22, 2025
**Version**: 1.0.0
