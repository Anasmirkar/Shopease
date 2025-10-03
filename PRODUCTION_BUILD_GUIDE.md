# ShopEase Production Build Guide

## 🚀 Building for Production (Standalone Android APK)

### Prerequisites
1. **EAS CLI**: Install Expo Application Services CLI
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

### Google OAuth Setup for Android APK

#### 1. Get Your App's SHA-1 Certificate Fingerprint
When you build with EAS, you'll get a SHA-1 certificate fingerprint. You'll need this for Google OAuth.

#### 2. Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services → Credentials**
3. Click on your **Android** OAuth client ID (ending with `11u.apps.googleusercontent.com`)
4. Add your app's **Package name**: `com.shopease.app`
5. Add the **SHA-1 certificate fingerprint** (you'll get this after building)

#### 3. No Redirect URI Needed!
- For standalone Android apps, Google handles OAuth automatically
- No redirect URI configuration needed in Google Cloud Console for Android apps
- The web redirect URI (`https://auth.expo.io/@anasmirkar/shopease`) can be removed

### Building the APK

#### 1. Build Preview APK (for testing)
```bash
eas build -p android --profile preview
```

#### 2. Build Production APK
```bash
eas build -p android --profile production
```

#### 3. Build with Local Development
```bash
eas build -p android --profile development
```

### After Building

1. **Download the APK** from the EAS build dashboard
2. **Get the SHA-1 fingerprint** from the build logs
3. **Update Google Cloud Console** with the SHA-1 fingerprint
4. **Install the APK** on your Android device
5. **Test Google OAuth** - it should work perfectly!

### Backend Hosting

#### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### Option 2: Render
1. Connect your GitHub repository
2. Select `smart-scan-backend` folder
3. Deploy automatically

#### Option 3: Heroku
```bash
# Install Heroku CLI and deploy
heroku create shopease-api
git subtree push --prefix smart-scan-backend heroku main
```

### Environment Variables for Production
Update your backend with these environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `PORT`: 3000 (or Railway/Render assigned port)

### Testing Checklist
- [ ] Google OAuth works in standalone APK
- [ ] Guest mode works
- [ ] Scanner functionality works
- [ ] Product lookup works with hosted backend
- [ ] Store selection works
- [ ] All animations work smoothly

## 🎯 Why This Approach is Better

1. **No Expo Go limitations**: Full native functionality
2. **Real OAuth flow**: Proper Android OAuth integration
3. **Production-ready**: Actual APK that users will install
4. **Better performance**: Native compilation
5. **No redirect URI issues**: Android handles OAuth natively

## 📱 Distribution

Once tested, you can:
1. **Internal testing**: Share APK directly
2. **Google Play Store**: Upload for production
3. **App signing**: EAS handles code signing automatically