#!/usr/bin/env bash
# Generate a release keystore for APK signing
# Usage: bash scripts/generate-keystore.sh
#
# After running this script:
# 1. Encode the keystore: base64 < staticquo-release.keystore | tr -d '\n'
# 2. Add the base64 string as GitHub secret: ANDROID_KEYSTORE_BASE64
# 3. Add these secrets:
#    - ANDROID_KEYSTORE_PASSWORD (the password you enter below)
#    - ANDROID_KEY_ALIAS (the alias you enter below)
#    - ANDROID_KEY_PASSWORD (the key password you enter below)

set -euo pipefail

KEYSTORE_FILE="staticquo-release.keystore"
KEY_ALIAS="staticquo"

echo "=== StaticQuo Release Keystore Generator ==="
echo ""
echo "This will generate a Java keystore for signing release APKs."
echo "You will be prompted to create passwords."
echo ""

keytool -genkey -v \
  -keystore "$KEYSTORE_FILE" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias "$KEY_ALIAS"

echo ""
echo "Keystore generated: $KEYSTORE_FILE"
echo ""
echo "Next steps:"
echo "  1. base64 < $KEYSTORE_FILE | tr -d '\n'   # copy the output"
echo "  2. Add GitHub secret ANDROID_KEYSTORE_BASE64 with the base64 output"
echo "  3. Add GitHub secret ANDROID_KEYSTORE_PASSWORD with your keystore password"
echo "  4. Add GitHub secret ANDROID_KEY_ALIAS with '$KEY_ALIAS'"
echo "  5. Add GitHub secret ANDROID_KEY_PASSWORD with your key password"
echo "  6. rm $KEYSTORE_FILE   # delete local copy after encoding"
