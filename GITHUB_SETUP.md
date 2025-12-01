# GitHub Setup Instructions

Your code has been committed locally. Follow these steps to push to GitHub:

---

## 💳 Payment Instructions

**Before proceeding, please make payment for the service:**

1. **Make PAYMENT** to: **`0559272762`**
2. **Network**: **MTN**
3. **Account Name**: **APPIAH MANASSEH ATTAH**
4. **Reference**: Use your **USERNAME** as the payment reference
5. **Send SCREENSHOT** of **PAYMENT** when done

**Important:** Please highlight/include the following in your payment:
- **PAYMENT** amount
- **MTN** network confirmation
- **USERNAME** as reference
- **SCREENSHOT** of completed transaction

---

## Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `deemart-pos` (or any name you prefer)
3. Description: "DeeMart Point of Sale System - Full-stack POS application with React frontend and Supabase backend"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
cd C:\Users\DELL\Desktop\zubada1
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with the repository name you created

## Alternative: Using SSH (if you have SSH keys set up)

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## If You Need to Update Git Config

If you want to use your actual GitHub email:

```bash
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

## Troubleshooting

If you get authentication errors:
- Make sure you're logged into GitHub
- You may need to use a Personal Access Token instead of password
- Or set up SSH keys for easier authentication

