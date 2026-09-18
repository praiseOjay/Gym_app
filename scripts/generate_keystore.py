import os
import sys
import base64
import datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

def generate_release_keystore(
    keystore_path="android/overload-release-key.jks",
    properties_path="android/keystore.properties",
    alias="overload",
    password="OverloadAI2026!ReleaseKey",
    validity_days=10000
):
    print("==================================================")
    print("  Generating Overload AI Release Keystore (RSA 2048)")
    print("==================================================")

    # 1. Generate RSA 2048-bit private key
    print("[1/4] Generating 2048-bit RSA cryptographic key pair...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )

    # 2. Build Self-Signed X.509 Certificate
    print("[2/4] Building X.509 release certificate (valid for 10,000 days)...")
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "Overload AI"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Overload AI"),
        x509.NameAttribute(NameOID.COUNTRY_NAME, "GB")
    ])

    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + datetime.timedelta(days=validity_days))
        .sign(private_key, hashes.SHA256())
    )

    # 3. Serialize as industry-standard PKCS#12 Keystore (.jks / .p12)
    print(f"[3/4] Packaging keystore with alias '{alias}'...")
    pass_bytes = password.encode("utf-8")
    p12_bytes = pkcs12.serialize_key_and_certificates(
        name=alias.encode("utf-8"),
        key=private_key,
        cert=cert,
        cas=None,
        encryption_algorithm=serialization.BestAvailableEncryption(pass_bytes)
    )

    os.makedirs(os.path.dirname(keystore_path) or ".", exist_ok=True)
    with open(keystore_path, "wb") as f:
        f.write(p12_bytes)

    print(f" -> Keystore successfully written to: {keystore_path} ({len(p12_bytes)} bytes)")

    # 4. Generate android/keystore.properties
    print(f"[4/4] Writing local signing configuration to {properties_path}...")
    relative_keystore_filename = os.path.basename(keystore_path)
    props_content = f"""# Local Release Signing Configuration for Overload AI
# Generated automatically. Keep this file and password secure!
storeFile={relative_keystore_filename}
storePassword={password}
keyAlias={alias}
keyPassword={password}
"""
    with open(properties_path, "w", encoding="utf-8") as f:
        f.write(props_content)

    print(f" -> Signing configuration written to: {properties_path}")

    # Generate Base64 for GitHub Actions CI/CD
    b64_keystore = base64.b64encode(p12_bytes).decode("utf-8")
    b64_file_path = "android/keystore-base64.txt"
    with open(b64_file_path, "w", encoding="utf-8") as f:
        f.write(b64_keystore)

    print("\n==================================================")
    print("  [SUCCESS] Keystore & Local Signing Configured!  ")
    print("==================================================")
    print(f"Keystore File   : {keystore_path}")
    print(f"Config File     : {properties_path}")
    print(f"Key Alias       : {alias}")
    print(f"Password        : {password}")
    print(f"GitHub Secret   : Saved to {b64_file_path} (for GitHub Actions)")
    print("==================================================")

if __name__ == "__main__":
    generate_release_keystore()
