#!/usr/bin/env sh
set -e

APP_JAR=/app/app.jar
PK_FILE=/run/secrets/private_key.pem
PUB_FILE=/run/secrets/public_key.pem

# Helper to start JVM with provided PEMs
start_with_pems() {
  PRIVATE_PEM="$1"
  PUBLIC_PEM="$2"
  echo "[entrypoint] Starting JVM with provided PEMs (hiding contents)..."
  exec java \
    -Djwt.private-key-pem="$PRIVATE_PEM" \
    -Djwt.public-key-pem="$PUBLIC_PEM" \
    -Dcustom.jwt-private-pem-key="$PRIVATE_PEM" \
    -Dcustom.jwt-public-pem-key="$PUBLIC_PEM" \
    -DJWT_PRIVATE_PEM_KEY="$PRIVATE_PEM" \
    -DJWT_PUBLIC_PEM_KEY="$PUBLIC_PEM" \
    -jar "$APP_JAR"
}

# Prefer mounted secret files (K8s / docker secrets / bind mounts)
if [ -f "$PK_FILE" ] && [ -f "$PUB_FILE" ]; then
  echo "[entrypoint] Found mounted key files, loading..."
  PRIVATE_PEM="$(cat "$PK_FILE")"
  PUBLIC_PEM="$(cat "$PUB_FILE")"
  start_with_pems "$PRIVATE_PEM" "$PUBLIC_PEM"
fi

# Fallback to environment variables (common names used in project)
# Support both JWT_PRIVATE_PEM / JWT_PUBLIC_PEM and JWT_PRIVATE_PEM_KEY / JWT_PUBLIC_PEM_KEY
if [ -n "$JWT_PRIVATE_PEM_KEY" ] && [ -n "$JWT_PUBLIC_PEM_KEY" ]; then
  echo "[entrypoint] Found JWT env vars JWT_*_KEY, using them..."
  start_with_pems "$JWT_PRIVATE_PEM_KEY" "$JWT_PUBLIC_PEM_KEY"
fi

if [ -n "$JWT_PRIVATE_PEM" ] && [ -n "$JWT_PUBLIC_PEM" ]; then
  echo "[entrypoint] Found JWT env vars JWT_PRIVATE_PEM/JWT_PUBLIC_PEM, using them..."
  start_with_pems "$JWT_PRIVATE_PEM" "$JWT_PUBLIC_PEM"
fi

# Last fallback: run jar without passing keys (will fail if JwtConfig requires PEMs)
echo "[entrypoint] No keys provided via files or env vars, starting without jwt properties"
exec java -jar "$APP_JAR"
