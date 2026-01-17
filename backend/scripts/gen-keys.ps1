#!/usr/bin/env pwsh
# Generate RSA private/public key pair into backend/secrets
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$secretsDir = Join-Path $scriptRoot "..\secrets" | Resolve-Path -Relative -ErrorAction SilentlyContinue
if (-not $secretsDir) { $secretsDir = Join-Path $scriptRoot "..\secrets" }
if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir | Out-Null }

$private = Join-Path $secretsDir "private_key.pem"
$public  = Join-Path $secretsDir "public_key.pem"

Write-Host "Secrets directory: $secretsDir"

if (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Host "Using OpenSSL to generate 2048-bit RSA keypair..."
    & openssl genpkey -algorithm RSA -out $private -pkeyopt rsa_keygen_bits:2048
    & openssl rsa -pubout -in $private -out $public
    Write-Host "Generated keys: $private, $public"
} else {
    Write-Host "OpenSSL not found. To create keys manually run:" -ForegroundColor Yellow
    Write-Host "  openssl genpkey -algorithm RSA -out $private -pkeyopt rsa_keygen_bits:2048"
    Write-Host "  openssl rsa -pubout -in $private -out $public"
    Write-Host "Or install OpenSSL (e.g., choco install openssl) and re-run this script." -ForegroundColor Yellow
}
