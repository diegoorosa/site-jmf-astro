#!/usr/bin/env python3
"""
SEO On-Page Massive Audit (P4)
Analyzes all pages in src/pages/ and src/content/blog/ for:
- Title length (35-65 characters)
- Meta Description length (120-165 characters)
- JSON-LD Schema presence
- OpenGraph tags (og:title, og:description, og:url, og:image) - inferred from frontmatter
- Images without alt attribute
- Broken internal links

Automatically fixes:
- Title length (truncates to 65 if too long, removes '...')
- Description length (truncates to 165 if too long)
- Removes literal '...' from titles
"""

import os
import re
from pathlib import Path
import sys

# ---- Configuration ----
PAGES_DIR = Path("src/pages")
BLOG_DIR = Path("src/content/blog")

# Title and description limits
TITLE_MIN = 35
TITLE_MAX = 65
DESC_MIN = 120
DESC_MAX = 165

# ---- Helper Functions ----

def get_existing_routes():
    """
    Build a set of all existing routes in the site (without leading/trailing slashes and without file extensions).
    Returns a set of strings representing routes.
    """
    routes = set()
    # Pages in src/pages
    for astro_file in PAGES_DIR.rglob("*.astro"):
        # Get relative path from PAGES_DIR
        rel_path = astro_file.relative_to(PAGES_DIR)
        # If it's index.astro, the route is the parent directory
        if astro_file.name == "index.astro":
            route_str = str(rel_path.parent).replace(os.sep, "/")
        else:
            # Remove the .astro extension
            route_str = str(rel_path.with_suffix("")).replace(os.sep, "/")
        # Normalize: remove leading slash if present (since we are building from root)
        if route_str.startswith("/"):
            route_str = route_str[1:]
        # Remove trailing slash if present
        if route_str.endswith("/"):
            route_str = route_str[:-1]
        # Empty string represents the root
        routes.add(route_str if route_str != "" else "")

    # Blog posts in src/content/blog
    for md_file in BLOG_DIR.rglob("*.md"):
        rel_path = md_file.relative_to(BLOG_DIR)
        if md_file.name == "index.md":
            route_str = str(rel_path.parent).replace(os.sep, "/")
        else:
            route_str = str(rel_path.with_suffix("")).replace(os.sep, "/")
        if route_str.startswith("/"):
            route_str = route_str[1:]
        if route_str.endswith("/"):
            route_str = route_str[:-1]
        routes.add(route_str if route_str != "" else "")

    return routes

def extract_frontmatter(content):
    """
    Extracts frontmatter from content (if it starts with ---).
    Returns (frontmatter_string, rest_of_content).
    """
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            return parts[1], parts[2]
    return "", content


def extract_layout_props(content, file_ext):
    """
    Extracts title, description, and other SEO props from Layout component call in .astro files.
    Looks for pattern: <Layout title="..." description="..." ...>
    """
    props = {}
    if file_ext != ".astro":
        return props

    # Find the Layout component call
    layout_pattern = r'<Layout\s+([^>]*)>'
    match = re.search(layout_pattern, content, re.DOTALL)
    if match:
        attrs = match.group(1)
        # Extract title
        title_match = re.search(r'title\s*=\s*["\']([^"\']+)["\']', attrs)
        if title_match:
            props['title'] = title_match.group(1)
        # Extract description
        desc_match = re.search(r'description\s*=\s*["\']([^"\']+)["\']', attrs)
        if desc_match:
            props['description'] = desc_match.group(1)
        # Extract canonical
        canon_match = re.search(r'canonical\s*=\s*["\']([^"\']+)["\']', attrs)
        if canon_match:
            props['canonical'] = canon_match.group(1)
        # Extract ogUrl
        ogurl_match = re.search(r'ogUrl\s*=\s*["\']([^"\']+)["\']', attrs)
        if ogurl_match:
            props['ogUrl'] = ogurl_match.group(1)
        # Extract ogImage
        ogimg_match = re.search(r'ogImage\s*=\s*["\']([^"\']+)["\']', attrs)
        if ogimg_match:
            props['ogImage'] = ogimg_match.group(1)
        # Extract schema (as a note that it exists)
        if 'schema' in attrs:
            props['schema_present'] = True

    return props

def parse_frontmatter(fm_string):
    """
    Parses a simple frontmatter string (key: value per line) into a dict.
    Handles only simple string values (no multi-line or complex YAML).
    """
    fm_dict = {}
    for line in fm_string.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            # Remove quotes if present
            if value.startswith('"') and value.endswith('"') and len(value) >= 2:
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'") and len(value) >= 2:
                value = value[1:-1]
            fm_dict[key] = value
    return fm_dict

def check_title(title):
    """Returns a list of issues with the title."""
    issues = []
    if title is None:
        issues.append("Title is missing")
        return issues
    if len(title) < TITLE_MIN:
        issues.append(f"Title too short ({len(title)} < {TITLE_MIN})")
    if len(title) > TITLE_MAX:
        issues.append(f"Title too long ({len(title)} > {TITLE_MAX})")
    if '...' in title:
        issues.append("Title contains literal '...'")
    return issues

def check_description(desc):
    """Returns a list of issues with the description."""
    issues = []
    if desc is None:
        issues.append("Description is missing")
        return issues
    if len(desc) < DESC_MIN:
        issues.append(f"Description too short ({len(desc)} < {DESC_MIN})")
    if len(desc) > DESC_MAX:
        issues.append(f"Description too long ({len(desc)} > {DESC_MAX})")
    return issues

def fix_title(title):
    """Removes '...' from title. Does NOT auto-truncate mid-word."""
    if title is None:
        return None
    # Remove literal '...' and replace with space, then collapse spaces
    fixed = title.replace('...', ' ').strip()
    fixed = re.sub(r'\s+', ' ', fixed)
    # Do NOT auto-truncate — let the user rewrite manually
    return fixed

def fix_description(desc):
    """Does NOT auto-truncate descriptions. Only warns about length."""
    # Do NOT auto-truncate — let the user rewrite manually
    return desc

def extract_images_alt(content, file_ext):
    """
    Returns a list of tuples (alt_text, full_match) for images found in content.
    For markdown: ![alt](url)
    For Astro/HTML: <img ... alt="alt" ...>
    """
    images = []
    if file_ext == ".md":
        # Markdown image: ![alt](url)
        pattern = r'!\[([^\]]*)\]\([^)]+\)'
        for match in re.finditer(pattern, content):
            alt = match.group(1)
            images.append((alt, match.group(0)))
    elif file_ext == ".astro":
        # HTML/img tag: <img ... alt="alt" ...>
        # We look for <img> tags and then extract the alt attribute
        # This is a simple regex and might not catch all cases (e.g., alt with single quotes, no alt, etc.)
        img_pattern = r'<img[^>]*>'
        for img_tag in re.findall(img_pattern, content, re.IGNORECASE):
            # Extract alt attribute
            alt_match = re.search(r'alt\s*=\s*["\']([^"\']*)["\']', img_tag, re.IGNORECASE)
            alt = alt_match.group(1) if alt_match else ""
            images.append((alt, img_tag))
    return images

def extract_links(content, file_ext):
    """
    Returns a list of link URLs found in content.
    We look for:
      - Markdown: [text](url)
      - HTML: <a href="url">
      - We ignore mailto:, tel:, http://, https://
    """
    links = []
    if file_ext == ".md":
        # Markdown link: [text](url)
        pattern = r'\[([^\]]*)\]\(([^)]+)\)'
        for match in re.finditer(pattern, content):
            url = match.group(2)
            links.append(url)
    # For both .md and .astro, look for HTML <a> tags
    a_pattern = r'<a[^>]*href\s*=\s*["\']([^"\']*)["\'][^>]*>'
    for match in re.finditer(a_pattern, content, re.IGNORECASE):
        url = match.group(1)
        links.append(url)
    # Note: We are not handling <Link> from @astrojs/link because it's not standard HTML.
    return links

def is_internal_link(url):
    """Returns True if the link is internal (not external like http, mailto, etc.)."""
    if not url:
        return False
    url = url.strip()
    # External schemes
    if url.lower().startswith(('http:', 'https:', 'mailto:', 'tel:', 'ftp:')):
        return False
    # Consider everything else as internal for now (including root-relative, relative, etc.)
    return True

def normalize_link_for_check(link):
    """
    Normalizes a link for checking against existing_routes.
    Steps:
      - Remove leading slash if present (we treat root as '')
      - Remove query string and fragment
      - Remove trailing slash if present
    Returns the normalized string.
    """
    if not link:
        return ""
    # Remove query and fragment
    link = link.split('?')[0]
    link = link.split('#')[0]
    # Remove leading slash
    if link.startswith('/'):
        link = link[1:]
    # Remove trailing slash
    if link.endswith('/'):
        link = link[:-1]
    return link

def check_link_exists(normalized_link, existing_routes):
    """
    Checks if a normalized link exists in existing_routes.
    Special case: empty string represents the root.
    """
    # Normalized link might be empty (for root)
    if normalized_link == "":
        return "" in existing_routes
    return normalized_link in existing_routes

def apply_fixes_astro(file_path, content, new_title, new_desc):
    """
    Applies title/description fixes to an .astro file by updating the Layout props.
    """
    # We need to update the title="..." and description="..." in the Layout component
    # We'll do a regex replacement
    def replace_layout_attr(attrs_str):
        # Replace title
        attrs_str = re.sub(
            r'(title\s*=\s*)["\']([^"\']+)["\']',
            lambda m: f'{m.group(1)}"{new_title}"',
            attrs_str
        )
        # Replace description
        attrs_str = re.sub(
            r'(description\s*=\s*)["\']([^"\']+)["\']',
            lambda m: f'{m.group(1)}"{new_desc}"',
            attrs_str
        )
        return attrs_str

    # Find and replace in the Layout component call
    new_content = re.sub(
        r'(<Layout\s+)([^>]*)>',
        lambda m: f'{m.group(1)}{replace_layout_attr(m.group(2))}>',
        content,
        count=1  # Only replace the first Layout call
    )

    try:
        file_path.write_text(new_content, encoding="utf-8")
        print(f"  Fixed: {file_path}")
    except Exception as e:
        print(f"  ERROR writing {file_path}: {e}")


def apply_fixes_md(file_path, fm_string, rest, new_title, new_desc):
    """
    Applies title/description fixes to a markdown file by updating frontmatter.
    """
    lines = fm_string.splitlines()
    new_lines = []
    title_found = False
    desc_found = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('title:'):
            new_lines.append(f'title: "{new_title}"')
            title_found = True
        elif stripped.startswith('description:'):
            new_lines.append(f'description: "{new_desc}"')
            desc_found = True
        else:
            new_lines.append(line)
    # If title or description were not found, we add them at the end of the frontmatter
    if not title_found:
        new_lines.append(f'title: "{new_title}"')
    if not desc_found:
        new_lines.append(f'description: "{new_desc}"')
    new_fm_string = "\n".join(new_lines)
    # Reconstruct the file
    new_content = f"---\n{new_fm_string}\n---\n{rest}"
    # Write back
    try:
        file_path.write_text(new_content, encoding="utf-8")
        print(f"  Fixed: {file_path}")
    except Exception as e:
        print(f"  ERROR writing {file_path}: {e}")


def main():
    print("=== SEO On-Page Massive Audit (P4) ===")
    print(f"Scanning {PAGES_DIR} and {BLOG_DIR}...\n")

    # Precompute existing routes for link checking
    existing_routes = get_existing_routes()
    print(f"Found {len(existing_routes)} existing routes in the site.\n")

    # Collect all files to process
    files_to_process = []
    files_to_process.extend(PAGES_DIR.rglob("*.astro"))
    files_to_process.extend(BLOG_DIR.rglob("*.md"))

    print(f"Found {len(files_to_process)} files to audit.\n")

    # We'll track files that need fixing (title/description)
    # Each entry is a dict with: file_path, file_type, content/rest, new_title, new_desc
    files_to_fix = []

    for file_path in files_to_process:
        print(f"Auditing: {file_path}")
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            print(f"  ERROR reading file: {e}")
            continue

        file_ext = file_path.suffix.lower()

        # Extract frontmatter
        fm_string, rest = extract_frontmatter(content)
        fm_dict = parse_frontmatter(fm_string)

        # Get title and description
        # For .astro files, first try Layout props, then fall back to frontmatter
        # For .md files, use frontmatter
        title = None
        description = None
        schema_present = False
        og_image = None
        og_url = None

        if file_ext == ".astro":
            # Try extracting from Layout component
            layout_props = extract_layout_props(content, file_ext)
            title = layout_props.get('title')
            description = layout_props.get('description')
            og_image = layout_props.get('ogImage')
            og_url = layout_props.get('ogUrl')
            schema_present = layout_props.get('schema_present', False)
            # Also check frontmatter for other props
            if not title:
                title = fm_dict.get('title')
            if not description:
                description = fm_dict.get('description')
            if not og_image:
                og_image = fm_dict.get('ogImage')
            if not og_url:
                og_url = fm_dict.get('ogUrl')
            if not schema_present:
                schema_present = 'schema' in fm_dict
        else:
            # .md files - use frontmatter
            title = fm_dict.get('title')
            description = fm_dict.get('description')
            og_image = fm_dict.get('ogImage')
            og_url = fm_dict.get('ogUrl')
            schema_present = 'schema' in fm_dict

        # Check title and description
        title_issues = check_title(title)
        desc_issues = check_description(description)

        # Check for images without alt
        images = extract_images_alt(rest, file_ext)
        images_without_alt = [(alt, full) for alt, full in images if not alt.strip()]

        # Extract and check internal links
        links = extract_links(rest, file_ext)
        broken_links = []
        for link in links:
            if is_internal_link(link):
                normalized = normalize_link_for_check(link)
                if not check_link_exists(normalized, existing_routes):
                    broken_links.append(link)

        # Report issues
        if title_issues:
            print(f"  TITLE ISSUES: {', '.join(title_issues)}")
        if desc_issues:
            print(f"  DESCRIPTION ISSUES: {', '.join(desc_issues)}")
        if not schema_present:
            print(f"  INFO: No schema prop found (using default from Layout)")
        if og_image is None:
            print(f"  INFO: No ogImage specified (using default from Layout)")
        if og_url is None:
            print(f"  INFO: No ogUrl specified (using default from Layout)")
        if images_without_alt:
            print(f"  IMAGES WITHOUT ALT: {len(images_without_alt)} image(s)")
            for alt, full in images_without_alt[:3]:  # Show first 3
                print(f"    - {full[:50]}...")
            if len(images_without_alt) > 3:
                print(f"    ... and {len(images_without_alt) - 3} more")
        if broken_links:
            print(f"  BROKEN INTERNAL LINKS: {len(broken_links)} link(s)")
            for link in broken_links[:3]:
                print(f"    - {link}")
            if len(broken_links) > 3:
                print(f"    ... and {len(broken_links) - 3} more")

        # Determine if we need to fix title or description
        fix_needed = False
        new_title = title
        new_desc = description

        if title_issues:
            fixed_title = fix_title(title)
            if fixed_title != title:
                fix_needed = True
                new_title = fixed_title
                print(f"  -> Fixing title: '{title}' -> '{fixed_title}'")
            else:
                # Title has length issues but no auto-fix available — warn only
                for issue in title_issues:
                    if 'too long' in issue or 'too short' in issue:
                        print(f"  [WARN] {issue} — manual rewrite required (script does not auto-truncate)")

        if desc_issues:
            fixed_desc = fix_description(description)
            if fixed_desc != description:
                fix_needed = True
                new_desc = fixed_desc
                print(f"  -> Fixing description: '{description}' -> '{fixed_desc}'")
            else:
                # Description has length issues but no auto-fix — warn only
                for issue in desc_issues:
                    if 'too long' in issue or 'too short' in issue:
                        print(f"  [WARN] {issue} — manual rewrite required (script does not auto-truncate)")

        if fix_needed:
            files_to_fix.append({
                'file_path': file_path,
                'file_type': file_ext,
                'content': content,
                'fm_string': fm_string,
                'rest': rest,
                'new_title': new_title,
                'new_desc': new_desc,
            })
        else:
            print(f"  -> No fixes needed for title/description.")
        print()

    # Now apply fixes
    if files_to_fix:
        print(f"=== Applying fixes to {len(files_to_fix)} files ===")
        for fix in files_to_fix:
            file_path = fix['file_path']
            file_type = fix['file_type']
            if file_type == ".astro":
                apply_fixes_astro(file_path, fix['content'], fix['new_title'], fix['new_desc'])
            elif file_type == ".md":
                apply_fixes_md(file_path, fix['fm_string'], fix['rest'], fix['new_title'], fix['new_desc'])
    else:
        print("No files required title/description fixes.")

    print("\n=== Audit complete ===")

if __name__ == "__main__":
    main()