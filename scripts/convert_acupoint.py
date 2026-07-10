#!/usr/bin/env python3
"""Parse 针灸穴位.md → acupoints.json v2 (fixed regex for no-space-after-dot)."""
import json, re, os

OUTPUT = '/Users/fxy/Downloads/python/医学软件/bcfz/data/acupoints.json'
INPUT = '/Users/fxy/Downloads/python/医学软件/data/针灸穴位.md'

with open(INPUT, 'r', encoding='utf-8') as f:
    lines = [line.rstrip('\n') for line in f.readlines()]

id_counter = 0
def gen_id():
    global id_counter
    id_counter += 1
    return 'id_' + str(id_counter)

# Section detection
SECTION_PAT = re.compile(r'^#{1,2}\s*(第[一二三四五六七八九十百]+节\s*.+)$')
section_boundaries = [(i, m.group(1).strip()) for i, line in enumerate(lines)
                       for m in [SECTION_PAT.match(line)] if m]
section_boundaries = [(ln, n) for ln, n in section_boundaries if '十四节' not in n]

# Subcategory detection
DU_REN_PAT = re.compile(r'^##\s*[一二]+[、，]\s*(督脉及其腧穴|任脉及其腧穴)')
BENJING_PAT = re.compile(r'^#{1,2}\s*[（(]?[四4][）)]?[、，]?\s*本经腧穴.*')
BODY_REGION_PAT = re.compile(r'^##\s*[一二三四五]+[、，]\s*(头颈部穴|胸腹部穴|背部穴|上肢部穴|下肢部穴)')

# FIXED: use \.\s* instead of \.\s+
ACU_PAT = re.compile(
    r'^(?:#{1,2}\s*)?(\d+)\.\s*'
    r'([^*（(\\]+?)'
    r'(?:[\\\\\*]*\s*[（(]'
    r'[^）)]+'
    r'[）)])'
)

PROP_PAT = re.compile(r'^(?:##\s*)?【(定位|解剖|主治|操作)】(.+)')

result = {'categories': [], 'subCategories': [], 'herbs': [], 'searchIndex': []}

def is_artifact(t):
    if not t or t.isspace(): return True
    if t.isdigit(): return True
    if t.startswith('![image]'): return True
    if t.startswith('http'): return True
    if t.startswith('图3-'): return True
    return False

def add_search(item_id, dtype, text, data_type='acupoint'):
    if text and not text.isspace():
        result['searchIndex'].append({
            'type': dtype, 'text': text,
            'itemId': item_id, 'dataType': data_type
        })

def parse_acupoints(start_line, end_line):
    acupoints = []
    current = None
    current_field = None
    current_content = ''

    for i in range(start_line, min(end_line, len(lines))):
        t = lines[i].strip()
        if is_artifact(t):
            continue

        m = ACU_PAT.match(lines[i])
        if m:
            if current:
                if current_field:
                    current['properties'][current_field] = current_content.strip()
                if current['properties']:
                    acupoints.append(current)
            raw_name = m.group(2).strip()
            name = raw_name.rstrip('\\').strip()
            if not name:
                continue
            current = {'id': gen_id(), 'name': name, 'properties': {}}
            current_field = None
            current_content = ''
            continue

        pm = PROP_PAT.match(t)
        if pm:
            if current:
                if current_field:
                    current['properties'][current_field] = current_content.strip()
                current_field = pm.group(1)
                current_content = pm.group(2).strip()
            continue

        if current and current_field:
            if current_content:
                current_content += '\n' + t
            else:
                current_content = t

    if current:
        if current_field:
            current['properties'][current_field] = current_content.strip()
        if current['properties']:
            acupoints.append(current)
    return acupoints

# Main parsing loop
for si, (sec_line, sec_name) in enumerate(section_boundaries):
    section_end = section_boundaries[si+1][0] if si+1 < len(section_boundaries) else len(lines)
    cat = {'id': gen_id(), 'name': sec_name, 'subCategoryIds': []}
    result['categories'].append(cat)

    if '十三节' in sec_name:
        du_line = ren_line = None
        for j in range(sec_line, section_end):
            rm = DU_REN_PAT.match(lines[j])
            if rm:
                sn = rm.group(1)
                if '督脉' in sn and du_line is None: du_line = j
                elif '任脉' in sn and ren_line is None: ren_line = j
        sub_boundaries = [(sln, snm) for sln, snm in [(du_line, '督脉及其腧穴'), (ren_line, '任脉及其腧穴')] if sln is not None]

        for sbi, (sub_line, sub_name) in enumerate(sub_boundaries):
            sub_end = sub_boundaries[sbi+1][0] if sbi+1 < len(sub_boundaries) else section_end
            sub = {'id': gen_id(), 'name': sub_name, 'categoryId': cat['id'], 'herbIds': []}
            result['subCategories'].append(sub)
            cat['subCategoryIds'].append(sub['id'])

            bj_line = None
            for j in range(sub_line, sub_end):
                if BENJING_PAT.match(lines[j]): bj_line = j; break
            if bj_line is None: continue

            acu_end = sub_end
            for j in range(bj_line + 1, sub_end):
                if '穴歌' in lines[j]: acu_end = j; break

            acupoints = parse_acupoints(bj_line + 1, acu_end)
            for ap in acupoints:
                ap['subCategoryId'] = sub['id']
                ap['categoryId'] = cat['id']
                sub['herbIds'].append(ap['id'])
                result['herbs'].append(ap)
                add_search(ap['id'], 'name', ap['name'])
                for k, v in ap['properties'].items():
                    add_search(ap['id'], k, v)

    elif '十五节' in sec_name:
        regions = []
        for j in range(sec_line, section_end):
            rm = BODY_REGION_PAT.match(lines[j])
            if rm: regions.append((j, rm.group(1).strip()))
        for ri, (r_line, r_name) in enumerate(regions):
            r_end = regions[ri+1][0] if ri+1 < len(regions) else section_end
            sub = {'id': gen_id(), 'name': r_name, 'categoryId': cat['id'], 'herbIds': []}
            result['subCategories'].append(sub)
            cat['subCategoryIds'].append(sub['id'])
            acupoints = parse_acupoints(r_line + 1, r_end)
            for ap in acupoints:
                ap['subCategoryId'] = sub['id']
                ap['categoryId'] = cat['id']
                sub['herbIds'].append(ap['id'])
                result['herbs'].append(ap)
                add_search(ap['id'], 'name', ap['name'])
                for k, v in ap['properties'].items():
                    add_search(ap['id'], k, v)

    else:
        bj_line = None
        for j in range(sec_line, section_end):
            if BENJING_PAT.match(lines[j]): bj_line = j; break
        if bj_line is None: continue

        sub = {'id': gen_id(), 'name': '本经腧穴', 'categoryId': cat['id'], 'herbIds': []}
        result['subCategories'].append(sub)
        cat['subCategoryIds'].append(sub['id'])

        acu_end = section_end
        for j in range(bj_line + 1, section_end):
            if '穴歌' in lines[j]: acu_end = j; break

        acupoints = parse_acupoints(bj_line + 1, acu_end)
        for ap in acupoints:
            ap['subCategoryId'] = sub['id']
            ap['categoryId'] = cat['id']
            sub['herbIds'].append(ap['id'])
            result['herbs'].append(ap)
            add_search(ap['id'], 'name', ap['name'])
            for k, v in ap['properties'].items():
                add_search(ap['id'], k, v)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Categories: {len(result['categories'])}")
print(f"SubCategories: {len(result['subCategories'])}")
print(f"Acupoints: {len(result['herbs'])}")
print(f"SearchIndex: {len(result['searchIndex'])}")
for cat in result['categories']:
    subs = [s for s in result['subCategories'] if s['categoryId'] == cat['id']]
    total = sum(len(s['herbIds']) for s in subs)
    print(f"  {cat['name']}: {total} pts")
