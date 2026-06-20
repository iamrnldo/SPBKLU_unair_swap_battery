#!/usr/bin/env bash

# Exit immediately if any command fails
set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==================================================${NC}"
echo -e "${GREEN}      SPBKLU APK BUILD AUTOMATION SCRIPT        ${NC}"
echo -e "${YELLOW}==================================================${NC}"

# 1. Ensure we are in the correct directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 2. Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[1/5] Installing npm dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}[1/5] npm dependencies already installed.${NC}"
fi

# 3. Build the production React + Vite web assets
echo -e "${YELLOW}[2/5] Building React + Vite web production assets...${NC}"
npm run build

# 4. Check if android platform folder exists, if not add it
if [ ! -d "android" ]; then
    echo -e "${YELLOW}[3/5] Adding Android platform via Capacitor...${NC}"
    npx cap add android
else
    echo -e "${GREEN}[3/5] Android platform already added.${NC}"
fi

# 5. Sync React assets and plugins to Native Android project
echo -e "${YELLOW}[4/5] Syncing assets to native Android project...${NC}"
npx cap sync android

# 6. Check if gradle wrapper gradlew is executable, make it executable if not
cd android
chmod +x gradlew

# 7. Build Debug APK
echo -e "${YELLOW}[5/5] Building Debug APK using Gradle Wrapper...${NC}"
./gradlew assembleDebug

# 8. Build Unsigned Release APK
echo -e "${YELLOW}Building Release APK using Gradle Wrapper...${NC}"
./gradlew assembleRelease

echo -e "${YELLOW}==================================================${NC}"
echo -e "${GREEN}            BUILD SUCCESSFUL / BERHASIL!          ${NC}"
echo -e "${YELLOW}==================================================${NC}"
echo -e ""
echo -e "Berikut adalah lokasi hasil kompilasi file APK Anda:"
echo -e ""
echo -e "1. ${GREEN}DEBUG APK (Siap Install untuk Testing):${NC}"
echo -e "   📍 Lokasi: ${GREEN}spbklu/user/android/app/build/outputs/apk/debug/app-debug.apk${NC}"
echo -e ""
echo -e "2. ${GREEN}RELEASE APK (Unsigned - Butuh Tanda Tangan/Signature Keystore):${NC}"
echo -e "   📍 Lokasi: ${GREEN}spbklu/user/android/app/build/outputs/apk/release/app-release-unsigned.apk${NC}"
echo -e ""
echo -e "--------------------------------------------------"
echo -e "${YELLOW}💡 TIPS: Cara Menandatangani (Signing) Release APK di CachyOS Anda:${NC}"
echo -e "Jika Anda ingin merilis atau menginstall Release APK di HP tanpa peringatan blokir:"
echo -e ""
echo -e "a. Buat file Keystore baru (jika belum punya):"
echo -e "   ${YELLOW}keytool -genkey -v -keystore spbklu-release.keystore -alias spbklu-alias -keyalg RSA -keysize 2048 -validity 10000${NC}"
echo -e ""
echo -e "b. Lakukan zipalign untuk mengoptimalkan APK:"
echo -e "   ${YELLOW}zipalign -v 4 app-release-unsigned.apk app-release-aligned.apk${NC}"
echo -e ""
echo -e "c. Tandatangani APK menggunakan apksigner (Ada di Android SDK build-tools):"
echo -e "   ${YELLOW}apksigner sign --ks spbklu-release.keystore --out spbklu-release.apk app-release-aligned.apk${NC}"
echo -e "--------------------------------------------------"
