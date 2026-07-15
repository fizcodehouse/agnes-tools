#!/usr/bin/env python3
import base64
import json
import os
import time
import subprocess

# GitHub repo that already exists
OWNER = "fizcodehouse"
REPO = "agnes-tools"
BRANCH = "main"

# Author for commits
AUTHOR = {
    "name": "Fiz007",
    "email": "299874768+fizcodehouse@users.noreply.github.com"
}

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

def push_file(file_path, rel_path):
    content = read_file(file_path)
    b64_content = base64.b64encode(content.encode()).decode()
    
    # Check if file exists
    check_url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{rel_path}"
    result = subprocess.run(
        ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", check_url],
        capture_output=True
    )
    exists = result.stdout.decode().strip() != "404"
    
    if exists:
        # Get current sha
        sha_result = subprocess.run(
            ["curl", "-s", check_url],
            capture_output=True
        )
        sha_data = json.loads(sha_result.stdout.decode())
        current_sha = sha_data.get("sha", "")
    else:
        current_sha = ""
    
    payload = {
        "message": f"feat: update {rel_path}",
        "content": b64_content,
        "branch": BRANCH,
        "author": AUTHOR,
        "committer": AUTHOR
    }
    
    if current_sha:
        payload["sha"] = current_sha
    
    # Push via API
    push_url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{rel_path}"
    result = subprocess.run(
        ["curl", "-s", "-X", "PUT", push_url,
         "-H", "Content-Type: application/json",
         "-d", json.dumps(payload)],
        capture_output=True
    )
    
    response = json.loads(result.stdout.decode())
    print(f"{rel_path}: {'updated' if current_sha else 'created'} - {response.get('commit', {}).get('sha', 'error')[:7] if 'commit' in response else response.get('message', 'error')}")

# Push all source files (excluding .git and node_modules)
files = []
for root, dirs, filenames in os.walk('/workspace/projects/agnes-tools'):
    dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules']]
    for filename in filenames:
        full_path = os.path.join(root, filename)
        rel_path = full_path.replace('/workspace/projects/agnes-tools/', '')
        files.append((full_path, rel_path))

# Skip node_modules and .git
for full_path, rel_path in files:
    if 'node_modules' in rel_path or rel_path.startswith('.git'):
        continue
    push_file(full_path, rel_path)
    time.sleep(0.5)  # Rate limit

print("Done!")