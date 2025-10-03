# 🛒 ShopEase - Smart Shopping Scanner App

<div align="center">
  <img src="./assets/icon.png" alt="ShopEase Logo" width="120" height="120" />
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.6-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-53.0.20-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📱 Overview

ShopEase is a modern React Native shopping scanner application that allows users to scan product barcodes/QR codes, manage their shopping cart, and complete purchases seamlessly. Built with Expo and featuring a production-ready architecture.

## ✨ Features

### 🔍 **Smart Scanner**
- **Animated Scanner**: Engaging animations with scanning line, pulse effects, and floating particles
- **Clear Scanning Area**: Transparent scanning zone for optimal visibility
- **Multi-format Support**: QR codes, Code128, EAN13 barcodes
- **Auto-timeout**: Automatic scanner closure after 25 seconds of inactivity
- **Torch Control**: Built-in flashlight toggle for low-light scanning

### 👤 **User Authentication**
- **Guest Mode**: Quick access without registration
- **Phone Authentication**: SMS-based login with OTP verification
- **User Registration**: Full account creation flow
- **Profile Management**: User profile with shopping history

### 🏪 **Store Management**
- **Store Selection**: Choose from available stores
- **Store-specific Features**: Customized experience per store
- **Location Integration**: Store finder functionality

### 🛒 **Shopping Cart**
- **Real-time Cart Updates**: Instant product additions
- **Product Information**: Detailed product data with pricing
- **Quantity Management**: Increase/decrease product quantities
- **Total Calculation**: Automatic price calculations

### 💳 **Payment Integration**
- **Multiple Payment Methods**: Cash, UPI, Cards
- **Receipt Generation**: Digital receipts with transaction details
- **Payment History**: Track all transactions

## 🏗️ Architecture

### 📁 **Folder Structure**
```
ShopEase/
├── src/                     # Source code
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── services/           # API and business logic
│   ├── utils/              # Helper functions
│   ├── constants/          # App constants
│   ├── config/             # Configuration files
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   └── App.js              # Main app component
├── assets/                 # Images, fonts, etc.
├── android/                # Android-specific files
├── Screens/                # Legacy screens (to be migrated)
└── smart-scan-backend/     # Backend server
```

### 🔧 **Tech Stack**
- **Frontend**: React Native with Expo
- **Navigation**: React Navigation v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Camera**: Expo Camera with barcode scanning
- **Animations**: React Native Animated API
- **State Management**: React Hooks + Context (planned)
- **Backend**: Node.js with Express

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/shopease.git
   cd shopease
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Supabase**
   - Create a Supabase project
   - Update `src/config/supabase.js` with your credentials
   - Run database migrations (see Database Setup)

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## 🗄️ Database Setup

### Supabase Tables

1. **Users Table**
   ```sql
   create table users (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     phone text unique not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

2. **Guests Table**
   ```sql
   create table guests (
     id uuid default gen_random_uuid() primary key,
     device_id text unique not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

3. **Stores Table**
   ```sql
   create table stores (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     address text,
     phone text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

4. **Products Table**
   ```sql
   create table products (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     price decimal(10,2) not null,
     barcode text unique,
     category text,
     brand text,
     weight text,
     image_url text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

5. **Shopping History Table**
   ```sql
   create table shopping_history (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references users(id),
     store_id uuid references stores(id),
     receipt_number text not null,
     total_amount decimal(10,2) not null,
     payment_method text not null,
     products jsonb not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# App Configuration
EXPO_PUBLIC_APP_NAME=ShopEase
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### App Configuration
Update `src/constants/AppConstants.js` with your settings:

```javascript
export const AppConstants = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  // ... other constants
};
```

## 📱 Usage

### 1. **Launch the App**
- Open ShopEase on your device
- Choose between Guest Mode or User Registration

### 2. **Select Store**
- Choose your preferred store from the list
- Store-specific features will be activated

### 3. **Start Shopping**
- Tap the circular scan button to open the scanner
- Point the camera at product barcodes or QR codes
- Products will be automatically added to your cart

### 4. **Manage Cart**
- View scanned products in your cart
- Adjust quantities using +/- buttons
- Review total amount

### 5. **Checkout**
- Select payment method (Cash, UPI, Cards)
- Complete the payment process
- Receive digital receipt

### 6. **View History**
- Access your shopping history from the profile menu
- View detailed receipts and transaction information

## 🎨 Customization

### Colors and Themes
Update `src/constants/Colors.js` to customize the app's color scheme:

```javascript
export const Colors = {
  PRIMARY_GREEN: '#116142',    // Main brand color
  ACCENT_TEAL: '#4ECDC4',     // Secondary color
  // ... other colors
};
```

### Scanner Settings
Modify scanner behavior in `src/constants/AppConstants.js`:

```javascript
export const AppConstants = {
  SCANNER_TIMEOUT: 25000,     // Auto-close timeout
  SCANNER_BARCODE_TYPES: ['qr', 'code128', 'ean13'],
  // ... other settings
};
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Individual components and utilities
- **Integration Tests**: API services and data flow
- **E2E Tests**: Complete user workflows

## 📦 Building for Production

### Android
```bash
# Build APK
npm run build:android

# Build AAB (recommended for Play Store)
npm run build:android:bundle
```

### iOS
```bash
# Build for iOS
npm run build:ios
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all
```

## 🚀 Deployment

### Expo Application Services (EAS)
1. Configure `eas.json`
2. Build the app: `eas build`
3. Submit to stores: `eas submit`

### Manual Deployment
1. Build production bundles
2. Upload to respective app stores
3. Configure store listings and metadata

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style
- Use ESLint and Prettier for code formatting
- Follow React Native best practices
- Write meaningful commit messages
- Add tests for new features

## 🐛 Troubleshooting

### Common Issues

**Scanner not working**
- Ensure camera permissions are granted
- Check if device supports camera access
- Verify barcode types are supported

**Build failures**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Expo CLI version: `expo --version`

**Database connection issues**
- Verify Supabase credentials in environment variables
- Check internet connection
- Ensure database tables are created

### Getting Help
- 📖 [Documentation](./docs)
- 💬 [Discord Community](https://discord.gg/shopease)
- 🐛 [Issue Tracker](https://github.com/yourusername/shopease/issues)
- 📧 [Email Support](mailto:support@shopease.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [Expo Team](https://expo.dev) for the amazing development platform
- [Supabase](https://supabase.com) for the backend infrastructure
- [React Native Community](https://reactnative.dev) for continuous improvements
- All contributors who helped make this project possible

## 📊 Project Stats

- **Lines of Code**: ~5,000+
- **Components**: 15+
- **Screens**: 7
- **Services**: 3
- **Utilities**: 10+
- **Constants**: 50+

---

<div align="center">
  <p>Made with ❤️ by the ShopEase Team</p>
  <p>
    <a href="https://github.com/yourusername/shopease">⭐ Star us on GitHub</a> |
    <a href="https://shopease.com">🌐 Visit our website</a> |
    <a href="https://twitter.com/shopease">🐦 Follow us on Twitter</a>
  </p>
</div>