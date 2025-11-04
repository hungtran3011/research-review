#!/usr/bin/env sh
set -e

# Generates PKCS#8 RSA keypair (private_key.pem and public_key.pem) into ./secrets
# Usage: ./scripts/gen-keys.sh [--force]

FORCE=0
if [ "$1" = "--force" ]; then
  FORCE=1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRETS_DIR="$PROJECT_ROOT/secrets"

echo "[gen-keys] project root: $PROJECT_ROOT"
mkdir -p "$SECRETS_DIR"
sudo chmod 700 "$SECRETS_DIR"

PRIV="$SECRETS_DIR/private_key.pem"
PUB="$SECRETS_DIR/public_key.pem"

# Backup existing keys if present and not forcing overwrite
timestamp() { date +%Y%m%d%H%M%S; }
if [ -f "$PRIV" ] || [ -f "$PUB" ]; then
  if [ "$FORCE" -eq 1 ]; then
    echo "[gen-keys] --force: overwriting existing keys"
  else
    BACKUP_DIR="$SECRETS_DIR/backup-$(timestamp)"
    echo "[gen-keys] Existing key(s) detected, moving to $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    [ -f "$PRIV" ] && mv "$PRIV" "$BACKUP_DIR/"
    [ -f "$PUB" ] && mv "$PUB" "$BACKUP_DIR/"
  fi
fi

# Check for openssl
if ! command -v openssl >/dev/null 2>&1; then
  echo "[gen-keys] ERROR: openssl not found in PATH. Install openssl and retry."
  exit 2
fi

# Generate PKCS#8 private key (4096 bits)
echo "[gen-keys] Generating 4096-bit RSA private key (PKCS#8) -> $PRIV"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out "$PRIV"

# Extract public key (X.509)
echo "[gen-keys] Extracting public key -> $PUB"
openssl rsa -in "$PRIV" -pubout -out "$PUB"

# Normalize newlines and set permissions
if command -v sed >/dev/null 2>&1; then
  sed -i 's/\r$//' "$PRIV" || true
  sed -i 's/\r$//' "$PUB" || true
fi
chmod 600 "$PRIV" || true
chmod 644 "$PUB" || true

# Show brief confirmation
echo "[gen-keys] Generated keys:"
ls -l "$PRIV" "$PUB" || true

echo "[gen-keys] Private key header:"
head -n 1 "$PRIV"
echo "[gen-keys] Public key header:"
head -n 1 "$PUB"

echo "[gen-keys] Done. Keep the private key secret. ./secrets is in .gitignore."

