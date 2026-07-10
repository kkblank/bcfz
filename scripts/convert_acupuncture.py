#!/usr/bin/env python3
"""Parse 针灸学.md → acupuncture.json"""
import json, re, os

INPUT = '/Users/fxy/Downloads/python/医学软件/data/针灸学.md'
OUTPUT = '/Users/fxy/Downloads/python/医学软件/bcfz/data/acupuncture.json'

with open(INPUT, 'r', encoding='utf-8') as f:
    lines = [line.rstrip('\n') for line in f.readlines()]

id_counter = 0
def gen_id():
    global id_counter
    id_counter += 1
    return 'id_' + str(id_counter)

def is_artifact(t):
    if not t: return True
    if t.isdigit() and len(t) < 6: return True
    if t in ('第七章 针灸治疗各论', '针灸学'): return True
    if t.startswith('![image]'): return True
    if t.startswith('http'): return True
    return False

def clean_line(t):
    """Remove ## prefix from content lines that were marked by OCR as headings."""
    return re.sub(r'^#{1,2}\s+', '', t)

# ========================
# 1. Find section boundaries
# ========================
SEC_PAT = re.compile(r'^#{1,2}\s*第[一二三四五六]节\s*(.+)')
sections = []  # [(line_idx, section_name), ...]
for i, line in enumerate(lines):
    m = SEC_PAT.match(line)
    if m:
        name = m.group(1).strip()
        sections.append((i, name))

# Handle 损容性皮肤病: merge into 第六节 (last regular section)
SUNRONG_PAT = re.compile(r'^#{1,2}\s*损容性皮肤病')
sunrong_start = None
for i, line in enumerate(lines):
    if SUNRONG_PAT.match(line):
        sunrong_start = i
        break

result = {'categories': [], 'subCategories': [], 'herbs': [], 'searchIndex': []}

def add_search(item_id, dtype, text, data_type='acupuncture'):
    if text and not text.isspace():
        result['searchIndex'].append({
            'type': dtype, 'text': text,
            'itemId': item_id, 'dataType': data_type
        })

# ========================
# 2. Define helper: is a ## line a disease header?
# ========================
# Disease headers are ## lines that are NOT:
#  - Section markers (第n节)
#  - Property markers (【...】)
#  - Numbered sub-sections (digit. content or （一） content)
#  - OCR content lines masquerading as headings (主穴..., 操作...)
DIS_HEADER_BLACKLIST = re.compile(
    r'^(?:'
    r'第[一二三四五六]节\s*'
    r'|【[^】]+】'
    r'|\d+[.．、]'
    r'|主症'
    r'|主穴'
    r'|操作'
    r'|方义'
    r')'
)

def is_disease_header(text):
    """Check if a ## heading designates a new disease."""
    t = text.strip()
    if not t.startswith('#'):
        return False
    # Extract the heading content after # markers
    content = re.sub(r'^#{1,2}\s*', '', t)
    return not DIS_HEADER_BLACKLIST.match(content)

def parse_section(section_start, section_end):
    """Extract diseases from a section's line range."""
    # Collect all disease header line indices
    disease_starts = []
    for i in range(section_start, section_end):
        line = lines[i]
        if not line.startswith('#'):
            continue
        if is_disease_header(line):
            disease_starts.append(i)

    diseases = []
    for di, ds_line in enumerate(disease_starts):
        de_line = disease_starts[di + 1] if di + 1 < len(disease_starts) else section_end
        disease_name = re.sub(r'^#{1,2}\s*', '', lines[ds_line].strip()).strip()
        if not disease_name:
            continue

        # Extract properties from content
        props = extract_properties(ds_line + 1, de_line)
        diseases.append({'name': disease_name, 'properties': props})

    return diseases

PROP_PAT = re.compile(r'^#{0,2}\s*【([^】]+)】')

def extract_properties(start, end):
    """Extract properties (概述, 辨证, 治疗, 按语) from disease content."""
    # Find all property header positions
    prop_headers = []  # [(line_idx, prop_name), ...]
    for i in range(start, end):
        t = lines[i].strip()
        m = PROP_PAT.match(t)
        if m:
            name = m.group(1)
            if name in ('辨证', '治疗', '按语'):
                prop_headers.append((i, name))

    if not prop_headers:
        # No structured properties; everything goes to 概述
        content_lines = []
        for i in range(start, end):
            t = lines[i].strip()
            if not is_artifact(t):
                content_lines.append(t)
        overview = '\n'.join(content_lines)
        return {'概述': overview} if overview.strip() else {}

    props = {}

    # Overview: content before first property header
    first_prop_line = prop_headers[0][0]
    overview_lines = []
    for i in range(start, first_prop_line):
        t = lines[i].strip()
        if is_artifact(t):
            continue
        # Clean ## prefix if present
        cleaned = clean_line(t)
        if cleaned:
            overview_lines.append(cleaned)
    overview_text = '\n'.join(overview_lines).strip()
    if overview_text:
        props['概述'] = overview_text

    # Each property: from its header to the next property header or end
    for pi, (ph_line, ph_name) in enumerate(prop_headers):
        next_prop_line = prop_headers[pi + 1][0] if pi + 1 < len(prop_headers) else end
        content_lines = []
        for i in range(ph_line + 1, next_prop_line):
            t = lines[i].strip()
            if is_artifact(t):
                continue
            cleaned = clean_line(t)
            if cleaned:
                content_lines.append(cleaned)
        content_text = '\n'.join(content_lines).strip()
        if content_text:
            props[ph_name] = content_text

    return props

# ========================
# 3. Process each section
# ========================
for si, (sec_line, sec_name) in enumerate(sections):
    # Section end: next section line, or sunrong_start, or EOF
    if si + 1 < len(sections):
        sec_end = sections[si + 1][0]
    elif sunrong_start is not None:
        sec_end = sunrong_start
    else:
        sec_end = len(lines)

    # Create category
    cat = {'id': gen_id(), 'name': sec_name, 'subCategoryIds': []}
    result['categories'].append(cat)

    # Parse diseases in this section
    diseases = parse_section(sec_line + 1, sec_end)

    if not diseases:
        continue

    # Create one subCategory for this section
    sub = {'id': gen_id(), 'name': sec_name + ' | 病症列表', 'categoryId': cat['id'], 'herbIds': []}
    result['subCategories'].append(sub)
    cat['subCategoryIds'].append(sub['id'])

    for disease in diseases:
        if not disease['properties']:
            continue
        herb = {
            'id': gen_id(),
            'name': disease['name'],
            'subCategoryId': sub['id'],
            'categoryId': cat['id'],
            'properties': disease['properties']
        }
        sub['herbIds'].append(herb['id'])
        result['herbs'].append(herb)

        # Add to search index
        add_search(herb['id'], 'name', herb['name'])
        for k, v in herb['properties'].items():
            add_search(herb['id'], k, v)

# ========================
# 4. Handle 损容性皮肤病 → merge into last section (第六节)
# ========================
if sunrong_start is not None and result['categories']:
    last_cat = result['categories'][-1]  # should be 第六节
    last_sub = next((s for s in result['subCategories'] if s['categoryId'] == last_cat['id']), None)

    # Parse diseases from 损容性皮肤病 to EOF
    extra_diseases = parse_section(sunrong_start, len(lines))

    if last_sub and extra_diseases:
        for disease in extra_diseases:
            if not disease['properties']:
                continue
            herb = {
                'id': gen_id(),
                'name': disease['name'],
                'subCategoryId': last_sub['id'],
                'categoryId': last_cat['id'],
                'properties': disease['properties']
            }
            last_sub['herbIds'].append(herb['id'])
            result['herbs'].append(herb)
            add_search(herb['id'], 'name', herb['name'])
            for k, v in herb['properties'].items():
                add_search(herb['id'], k, v)

# ========================
# 5. Output
# ========================
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Categories: {len(result['categories'])}")
print(f"SubCategories: {len(result['subCategories'])}")
print(f"Diseases: {len(result['herbs'])}")
print(f"SearchIndex: {len(result['searchIndex'])}")
for cat in result['categories']:
    subs = [s for s in result['subCategories'] if s['categoryId'] == cat['id']]
    total = sum(len(s['herbIds']) for s in subs)
    print(f"  {cat['name']}: {total} diseases")
    # Print disease names for the first category
    for sub in subs[:1]:
        herbs_in_sub = [h for h in result['herbs'] if h['id'] in sub['herbIds']]
        for h in herbs_in_sub:
            props = list(h['properties'].keys())
            print(f"    - {h['name']}  [props: {props}]")
