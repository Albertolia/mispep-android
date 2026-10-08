#!/usr/bin/env python3
import os
import subprocess
import zipfile
import shutil

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_sdk_dir():
    env_sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
    if env_sdk and os.path.isdir(env_sdk):
        return env_sdk
    candidates = [
        os.path.expanduser('~/Library/Android/sdk'),           # macOS
        os.path.expanduser('~/Android/Sdk'),                   # Linux
        os.path.expanduser(r'~\AppData\Local\Android\Sdk'),    # Windows
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    raise RuntimeError("Android SDK no encontrado. Configura ANDROID_HOME o instala el SDK.")

SDK_DIR = get_sdk_dir()
BUILD_TOOLS = f'{SDK_DIR}/build-tools/34.0.0'
PLATFORM_JAR = f'{SDK_DIR}/platforms/android-34/android.jar'

os.chdir(PROJECT_DIR)

BUILD_DIR = os.path.join(PROJECT_DIR, 'build')
shutil.rmtree(BUILD_DIR, ignore_errors=True)
os.makedirs(BUILD_DIR, exist_ok=True)
os.makedirs(os.path.join(BUILD_DIR, 'obj'), exist_ok=True)
os.makedirs(os.path.join(BUILD_DIR, 'gen'), exist_ok=True)
os.makedirs(os.path.join(BUILD_DIR, 'dex'), exist_ok=True)

print("1. Compiling resources with aapt2...")
res_zip = os.path.join(BUILD_DIR, 'res.zip')
r1 = subprocess.run([
    f'{BUILD_TOOLS}/aapt2', 'compile',
    '--dir', 'res',
    '-o', res_zip
], capture_output=True, text=True)
if r1.returncode != 0:
    print("aapt2 compile failed:", r1.stderr)
    exit(1)

print("2. Linking resources and assets with aapt2 link...")
base_apk = os.path.join(BUILD_DIR, 'base.apk')
r2 = subprocess.run([
    f'{BUILD_TOOLS}/aapt2', 'link',
    '-I', PLATFORM_JAR,
    '--manifest', 'AndroidManifest.xml',
    '--min-sdk-version', '24',
    '--target-sdk-version', '34',
    '-A', 'assets',
    '-o', base_apk,
    '--java', os.path.join(BUILD_DIR, 'gen'),
    res_zip
], capture_output=True, text=True)
if r2.returncode != 0:
    print("aapt2 link failed:", r2.stderr)
    exit(1)

print("3. Compiling Java sources with javac...")
java_files = []
for root, dirs, files in os.walk(os.path.join(PROJECT_DIR, 'src')):
    for f in files:
        if f.endswith('.java'):
            java_files.append(os.path.join(root, f))
# Add generated R.java if exists (busqueda robusta, independiente del paquete)
for root, dirs, files in os.walk(os.path.join(BUILD_DIR, 'gen')):
    for f in files:
        if f == 'R.java':
            java_files.append(os.path.join(root, f))

r3 = subprocess.run([
    'javac',
    '-g',
    '-source', '17',
    '-target', '17',
    '-cp', PLATFORM_JAR,
    '-d', os.path.join(BUILD_DIR, 'obj')
] + java_files, capture_output=True, text=True)
if r3.returncode != 0:
    print("javac failed:", r3.stderr)
    exit(1)

print("4. Dexing classes with d8...")
class_files = []
for root, dirs, files in os.walk(os.path.join(BUILD_DIR, 'obj')):
    for f in files:
        if f.endswith('.class'):
            class_files.append(os.path.join(root, f))

r4 = subprocess.run([
    f'{BUILD_TOOLS}/d8',
    '--min-api', '24',
    '--lib', PLATFORM_JAR,
    '--output', os.path.join(BUILD_DIR, 'dex')
] + class_files, capture_output=True, text=True)
if r4.returncode != 0:
    print("d8 failed:", r4.stderr)
    exit(1)

print("5. Packing classes.dex into APK...")
dex_file = os.path.join(BUILD_DIR, 'dex/classes.dex')
with zipfile.ZipFile(base_apk, 'a') as zipf:
    zipf.write(dex_file, 'classes.dex')

print("6. Aligning APK with zipalign...")
aligned_apk = os.path.join(BUILD_DIR, 'aligned.apk')
r5 = subprocess.run([
    f'{BUILD_TOOLS}/zipalign',
    '-f', '-p', '4',
    base_apk, aligned_apk
], capture_output=True, text=True)
if r5.returncode != 0:
    print("zipalign failed:", r5.stderr)
    exit(1)

print("7. Signing APK with apksigner...")
keystore = os.path.join(PROJECT_DIR, 'mispep-release.keystore')
if not os.path.exists(keystore):
    subprocess.run([
        'keytool', '-genkeypair', '-v',
        '-keystore', keystore,
        '-storepass', 'REDACTED',
        '-alias', 'mispep',
        '-keypass', 'REDACTED',
        '-keyalg', 'RSA',
        '-keysize', '2048',
        '-validity', '10000',
        '-dname', 'CN=MisPep,OU=Medical,O=Health,C=ES'
    ], capture_output=True)

final_apk = os.path.join(PROJECT_DIR, 'MisPep.apk')
r6 = subprocess.run([
    f'{BUILD_TOOLS}/apksigner', 'sign',
    '--ks', keystore,
    '--ks-pass', 'pass:REDACTED',
    '--key-pass', 'pass:REDACTED',
    '--out', final_apk,
    aligned_apk
], capture_output=True, text=True)
if r6.returncode != 0:
    print("apksigner failed:", r6.stderr)
    exit(1)

print(f"SUCCESS! Signed APK created at: {final_apk}")
print(f"APK File Size: {os.path.getsize(final_apk):,} bytes")
