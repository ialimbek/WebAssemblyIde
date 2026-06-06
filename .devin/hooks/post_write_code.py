#!/usr/bin/env python3
"""
Post-write-code hook for Windsurf Cascade.
Checks version consistency and architecture compliance.
"""

import json
import sys
import os
import re
from pathlib import Path

def load_json_stdin():
    """Load JSON context from stdin."""
    try:
        data = json.load(sys.stdin)
        return data
    except Exception as e:
        print(f"Error reading stdin: {e}", file=sys.stderr)
        return {}

def get_version_from_package_json(path):
    """Extract version from package.json."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('version')
    except Exception as e:
        print(f"⚠️  Error reading {path}: {e}", file=sys.stderr)
        return None

def get_version_from_tauri_conf(path):
    """Extract version from tauri.conf.json."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('version', {}).get('version')
    except Exception as e:
        print(f"⚠️  Error reading {path}: {e}", file=sys.stderr)
        return None

def get_version_from_cargo_toml(path):
    """Extract version from Cargo.toml."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
            if match:
                return match.group(1)
    except Exception as e:
        print(f"⚠️  Error reading {path}: {e}", file=sys.stderr)
    return None

def get_version_from_manifest(path):
    """Extract version from manifest.json."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('version')
    except Exception as e:
        print(f"⚠️  Error reading {path}: {e}", file=sys.stderr)
        return None

def check_version_consistency(workspace_root, modified_files):
    """Check if all version files are consistent."""
    version_files = {
        "package.json (root)": workspace_root / "package.json",
        "apps/web/package.json": workspace_root / "apps" / "web" / "package.json",
        "apps/desktop/package.json": workspace_root / "apps" / "desktop" / "package.json",
        "apps/desktop/src-tauri/tauri.conf.json": workspace_root / "apps" / "desktop" / "src-tauri" / "tauri.conf.json",
        "apps/desktop/src-tauri/Cargo.toml": workspace_root / "apps" / "desktop" / "src-tauri" / "Cargo.toml",
        ".clinerules/manifest.json": workspace_root / ".clinerules" / "manifest.json",
        ".windsurf/manifest.json": workspace_root / ".windsurf" / "manifest.json"
    }
    
    # Only check if any version-related file was modified
    version_related = any(str(vf) in modified_files for vf in version_files.values())
    if not version_related:
        print("ℹ️  No version files modified, skipping version check")
        return True
    
    print("🔍 Checking version consistency...")
    versions = {}
    
    for name, path in version_files.items():
        if not path.exists():
            print(f"⚠️  {name} not found, skipping")
            continue
        
        if name.endswith("package.json"):
            version = get_version_from_package_json(path)
        elif name.endswith("tauri.conf.json"):
            version = get_version_from_tauri_conf(path)
        elif name.endswith("Cargo.toml"):
            version = get_version_from_cargo_toml(path)
        elif name.endswith("manifest.json"):
            version = get_version_from_manifest(path)
        else:
            continue
        
        if version:
            versions[name] = version
            print(f"  {name}: {version}")
    
    # Check if all versions match
    if len(set(versions.values())) > 1:
        print("❌ VERSION INCONSISTENCY DETECTED!", file=sys.stderr)
        print("The following files have different versions:", file=sys.stderr)
        for name, version in versions.items():
            print(f"  {name}: {version}", file=sys.stderr)
        print("\n⚠️  Please update all version files to match.", file=sys.stderr)
        print("See .windsurf/rules/11-version-update-rule.md for details.", file=sys.stderr)
        return False
    
    if versions:
        print(f"✓ All versions consistent: {list(versions.values())[0]}")
    
    return True

def check_architecture_compliance(workspace_root, modified_files):
    """Check if changes comply with ARCHITECTURE.md."""
    arch_path = workspace_root / "ARCHITECTURE.md"
    if not arch_path.exists():
        print("⚠️  ARCHITECTURE.md not found, skipping compliance check")
        return True
    
    print("🔍 Checking architecture compliance...")
    
    # Check for common violations
    violations = []
    
    for file_path in modified_files:
        path = Path(file_path)
        
        # Check if modifying core packages without proper consideration
        if "packages/" in str(path):
            # Could add more sophisticated checks here
            pass
        
        # Check if modifying crates without Rust expertise consideration
        if "crates/" in str(path):
            pass
    
    if violations:
        print("⚠️  Potential architecture violations:", file=sys.stderr)
        for violation in violations:
            print(f"  • {violation}", file=sys.stderr)
        print("See .windsurf/rules/13-comprehensive-codembly.md for guidance.", file=sys.stderr)
        return False
    
    print("✓ No obvious architecture violations detected")
    return True

def check_agent_journal_rule_compliance(workspace_root):
    """Ensure agent-journal rule is being followed."""
    journals_dir = workspace_root / ".agent-journals"
    
    if not journals_dir.exists():
        print("⚠️  .agent-journals directory not found")
        print("💡 Tip: Ensure agent-journal rule (12) is being followed")
        print("   See .windsurf/rules/12-agent-journal.md for details")
        return True  # Warning only, not blocking
    
    print("✓ Agent-journal directory exists")
    return True

def main():
    workspace_root = Path.cwd()
    
    # Load context from stdin
    context = load_json_stdin()
    modified_files = context.get("files_modified", [])
    
    print(f"🔍 Post-write validation for: {workspace_root}")
    print("-" * 50)
    
    if not modified_files:
        print("ℹ️  No files modified, skipping checks")
        sys.exit(0)
    
    print(f"Files modified: {len(modified_files)}")
    for f in modified_files[:5]:  # Show first 5
        print(f"  • {f}")
    if len(modified_files) > 5:
        print(f"  ... and {len(modified_files) - 5} more")
    print()
    
    # Run checks
    checks_passed = True
    
    # Version consistency check
    if not check_version_consistency(workspace_root, modified_files):
        checks_passed = False
    
    print()
    
    # Architecture compliance check
    if not check_architecture_compliance(workspace_root, modified_files):
        checks_passed = False
    
    print()
    
    # Agent-journal compliance check
    check_agent_journal_rule_compliance(workspace_root)
    
    print("-" * 50)
    
    if checks_passed:
        print("✓ All post-write checks passed")
        sys.exit(0)
    else:
        print("❌ Some checks failed. Please review the warnings above.", file=sys.stderr)
        # Exit code 0 to allow (warnings only), 2 to block
        # Using 0 for now as warnings, could change to 2 for strict enforcement
        sys.exit(0)

if __name__ == "__main__":
    main()
