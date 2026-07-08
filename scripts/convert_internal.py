#!/usr/bin/env python3
"""Parse 中医内科学 - final version with complete fix"""
import json, re, os

DATA_DIR = '/mnt/d/workspace/python/医学软件/data'
OUTPUT = '/mnt/d/workspace/python/医学软件/bcfz/data/internal_medicine.json'

id_counter = 0
def gen_id():
    global id_counter
    id_counter += 1
    return 'id_' + str(id_counter)

def is_artifact(t):
    if not t: return True
    if t.isdigit() and len(t) < 6: return True
    if t in ('中医内科学',): return True
    if t.startswith('![image]'): return True
    if t.startswith('http'): return True
    if t.startswith('<table') or t.startswith('</table'): return True
    return False

lines = []
for fname in ['中医内科学下篇1.md', '中医内科学下篇2.md']:
    path = os.path.join(DATA_DIR, fname)
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            lines.append(line.rstrip())

ch_markers = [
    (0, '肺系病证'), (2098, '心系病证'), (3157, '脑系病证'),
    (4807, '脾胃系病证'), (7183, '肝胆系病证'), (8803, '肾系病证'),
    (10206, '气血津液病证'), (13371, '肢体经络病证'),
]

sections = []
for i, line in enumerate(lines):
    t = line.strip()
    m = re.match(r'^##\s*第[一二三四五六七八九十百]+节\s*(.+)$', t)
    if m:
        name = m.group(1).strip().replace('\u3000', '').strip()
        sections.append({'line': i, 'name': name})

def assign_section(sec_line):
    best_ci = len(ch_markers) - 1
    for ci in range(len(ch_markers)):
        ch_line = ch_markers[ci][0]
        if sec_line >= ch_line: best_ci = ci
        if sec_line < ch_line and ch_line - sec_line < 100: best_ci = ci; break
    return best_ci

ch_groups = {ci: [] for ci in range(len(ch_markers))}
for sec in sections:
    ci = assign_section(sec['line'])
    ch_groups[ci].append(sec)

SECTION_PAT = re.compile(r'##\s*[（(]三[)）]\s*证治分类')
LINBEI_PAT = re.compile(r'(?:##\s*)?【临证备要】')
FIELD_PAT = re.compile(r'^(临床表现|证机概要|治法|代表方|常用药)[：:]')

# All known syndrome names - complete list
SYNDROME_NAMES = {
    # 肺系-感冒
    '风寒束表', '风热犯表', '暑湿伤表', '气虚感冒', '阴虚感冒', '阳虚感冒',
    # 肺系-咳嗽
    '风寒袭肺', '风热犯肺', '风燥伤肺', '痰湿蕴肺', '痰热郁肺', '肝火犯肺', '肺阴亏虚',
    # 肺系-哮病
    '寒哮', '热哮', '寒包热哮', '风痰哮', '虚哮', '哮喘脱证',
    '肺虚', '脾虚', '肾虚',
    # 肺系-喘证
    '风寒壅肺', '表寒肺热', '痰热郁肺', '痰浊阻肺', '肺气郁痹', '肺气虚耗', '肾虚不纳', '正虚喘脱',
    # 肺系-肺痈
    '初期', '成痈期', '溃脓期', '恢复期',
    # 肺系-肺痨
    '肺阴亏损', '虚火灼肺', '气阴耗伤', '阴阳两虚',
    # 肺系-肺胀
    '外寒内饮', '痰热郁肺', '痰蒙神窍', '痰瘀阻肺', '阳虚水泛', '肺肾气虚',
    # 肺系-肺痿
    '虚热', '虚寒',
    # 心系-心悸
    '心虚胆怯', '心血不足', '阴虚火旺', '心阳不振', '水饮凌心', '瘀阻心脉', '痰火扰心',
    # 心系-胸痹
    '心血瘀阻', '气滞心胸', '痰浊闭阻', '寒凝心脉', '气阴两虚', '心肾阴虚', '心肾阳虚',
    # 心系-心衰
    '气虚血瘀', '气阴两虚', '阳虚水泛', '喘脱危证',
    # 心系-不寐
    '肝火扰心', '痰热扰心', '心脾两虚', '心肾不交',
    # 脑系-头痛
    '风寒头痛', '风热头痛', '风湿头痛', '肝阳头痛', '血虚头痛', '气虚头痛', '痰浊头痛', '肾虚头痛', '瘀血头痛',
    # 脑系-眩晕
    '肝阳上亢', '痰湿中阻', '瘀血阻窍', '气血亏虚', '肾精不足',
    # 脑系-中风
    '风痰入络', '风阳上扰', '阴虚风动', '痰热腑实', '痰火瘀闭', '痰浊瘀闭',
    '风痰瘀阻', '气虚络瘀', '肝肾亏虚',
    # 脑系-痴呆
    '髓海不足', '脾肾亏虚', '气血不足', '瘀阻脑络', '心肝火旺', '热毒内盛', '痰浊阻窍',
    # 脑系-癫狂
    '痰气郁结', '心脾两虚', '痰火扰神', '痰热瘀结', '火盛伤阴',
    # 脑系-痫证
    '阳痫', '阴痫', '肝火痰热', '脾虚痰盛', '肝肾阴虚', '瘀阻脑络',
    # 脾胃-胃痛
    '寒邪客胃', '饮食伤胃', '肝气犯胃', '肝胃郁热', '湿热中阻', '瘀血停滞', '胃阴不足', '脾胃虚寒',
    # 脾胃-胃痞
    '饮食内停', '痰湿中阻', '湿热阻胃', '肝胃不和', '脾胃虚弱', '胃阴不足',
    # 脾胃-呕吐
    '外邪犯胃', '饮食停滞', '痰饮内阻', '肝气犯胃', '胃阴不足',
    # 脾胃-噎膈
    '痰气交阻', '津亏热结', '瘀血内结', '气虚阳微',
    # 脾胃-呃逆
    '胃中寒冷', '胃火上逆', '气机郁滞', '脾胃阳虚', '胃阴不足',
    # 脾胃-腹痛
    '寒邪内阻', '湿热壅滞', '饮食积滞', '肝郁气滞', '瘀血内停', '中虚脏寒',
    # 脾胃-泄泻
    '寒湿内盛', '湿热中阻', '食滞肠胃', '肝气乘脾', '脾胃虚弱', '肾阳虚衰',
    # 脾胃-痢疾
    '湿热痢', '疫毒痢', '寒湿痢', '阴虚痢', '虚寒痢', '休息痢',
    # 脾胃-便秘
    '热秘', '气秘', '冷秘', '气虚秘', '血虚秘', '阴虚秘', '阳虚秘',
    # 肝胆-胁痛
    '肝郁气滞', '肝胆湿热', '瘀血阻络', '肝络失养',
    # 肝胆-黄疸
    '热重于湿', '湿重于热', '胆腑郁热', '疫毒炽盛（急黄）', '寒湿阻遏', '脾虚湿滞',
    '湿热留恋', '肝脾不调', '气滞血瘀',
    # 肝胆-积聚
    '肝郁气滞', '食滞痰阻', '气滞血阻', '瘀血内结', '正虚瘀阻',
    # 肝胆-鼓胀
    '气滞湿阻', '水湿困脾', '湿热蕴结', '肝脾血瘀', '脾肾阳虚', '肝肾阴虚',
    '黄疸', '出血', '神昏',
    # 肝胆-瘿病
    '气郁痰阻', '痰结血瘀', '肝火旺盛', '心肝阴虚',
    # 肝胆-疟疾
    '正疟', '温疟', '寒疟', '热瘴', '冷瘴', '劳疟',
    # 肾系-水肿
    '风水相搏', '湿毒浸淫', '水湿浸渍', '湿热壅盛', '脾阳亏虚', '肾阳衰微', '瘀水互结',
    # 肾系-淋证
    '热淋', '石淋', '血淋', '气淋', '膏淋', '劳淋',
    # 肾系-癃闭
    '膀胱湿热', '肺热壅盛', '肝郁气滞', '浊瘀阻塞', '脾气不升', '肾阳衰惫', '肾阴亏耗',
    # 肾系-阳痿
    '肝气郁结', '湿热下注', '命门火衰', '心脾亏虚', '惊恐伤肾',
    # 肾系-遗精
    '君相火旺', '湿热下注', '劳伤心脾', '肾气不固',
    # 气血津液-郁证
    '肝气郁结', '气郁化火', '痰气郁结', '心神失养', '心脾两虚',
    # 气血津液-血证
    '热邪犯肺', '胃热炽盛', '肝火上炎', '气血两虚', '胃火炽盛', '阴虚火旺',
    '燥热伤肺', '肝火犯肺', '阴虚肺热', '胃热壅盛', '肝火犯胃', '气虚血溢',
    '肠道湿热', '热灼胃络', '气虚不摄', '脾胃虚寒', '下焦湿热', '肾虚火旺',
    '脾不统血', '肾气不固', '血热妄行', '气不摄血',
    # 气血津液-痰饮
    '脾阳虚弱', '饮留胃肠', '邪犯胸肺', '饮停胸胁', '络气不和', '阴虚内热', '寒饮伏肺', '脾肾阳虚',
    # 气血津液-消渴
    '上消', '胃热炽盛', '气阴亏虚', '肾阴亏虚', '阴阳两虚',
    # 气血津液-汗证
    '肺卫不固', '阴虚火旺', '心血不足', '邪热郁蒸',
    # 气血津液-内伤发热
    '阴虚发热', '血虚发热', '气虚发热', '阳虚发热', '气郁发热', '痰湿郁热', '血瘀发热',
    # 气血津液-厥证
    '气厥', '血厥', '痰厥', '食厥',
    # 气血津液-虚劳
    '肺气虚', '心气虚', '脾气虚', '肾气虚',
    '心血虚', '肝血虚',
    '肺阴虚', '心阴虚', '脾胃阴虚', '肝阴虚', '肾阴虚',
    '心阳虚', '脾阳虚', '肾阳虚',
    # 气血津液-肥胖
    '胃热火郁', '痰湿内盛', '气郁血瘀', '脾虚不运', '脾肾阳虚',
    # 气血津液-癌病
    '气郁痰瘀', '热毒炽盛', '湿热郁毒', '瘀毒内阻', '气阴两虚', '气血两虚',
    # 肢体经络-痹证
    '风寒湿痹', '风湿热痹', '寒热错杂', '痰瘀痹阻', '气血虚痹', '肝肾虚痹',
    # 肢体经络-痉证
    '邪壅经络', '肝经热盛', '阳明热盛', '心营热盛', '瘀血内阻', '痰浊阻滞', '阴血亏虚',
    # 肢体经络-痿证
    '肺热津伤', '湿热浸淫', '脾胃虚弱', '肝肾亏损', '脉络瘀阻',
    # 肢体经络-颤证
    '风阳内动', '痰热风动', '气血亏虚', '髓海不足', '阳气虚衰',
    # 肢体经络-腰痛
    '寒湿腰痛', '湿热腰痛', '瘀血腰痛', '肾阴虚', '肾阳虚',
}

HDR_PAT = re.compile(r'^(?:##\s*)?(?:(\d+)\.\s*|\((\d+)\)\s*)(.+)')

def extract_syndromes(start_line, section_end):
    syndromes = []
    
    zz_start = -1
    for i in range(start_line, section_end):
        if SECTION_PAT.match(lines[i].strip()): zz_start = i; break
    if zz_start < 0: return []
    
    lb_end = -1
    for i in range(zz_start + 1, section_end):
        if LINBEI_PAT.match(lines[i].strip()): lb_end = i; break
    if lb_end < 0: lb_end = section_end
    
    current = None
    current_field = None
    current_content = ''
    
    for i in range(zz_start + 1, lb_end):
        t = lines[i].strip()
        if is_artifact(t): continue
        
        m = HDR_PAT.match(t)
        name = m.group(3).strip() if m else None
        
        if name and name in SYNDROME_NAMES:
            if current and current_field:
                current['properties'][current_field] = current_content.strip()
            if current and current['properties']:
                syndromes.append(current)
            current = {'id': gen_id(), 'name': name, 'properties': {}}
            current_field = None
            current_content = ''
            continue
        
        if current:
            fm = FIELD_PAT.match(t)
            if fm:
                if current_field:
                    current['properties'][current_field] = current_content.strip()
                current_field = fm.group(1)
                current_content = t[fm.end():].strip()
            elif current_field:
                if current_content: current_content += '\n' + t
                else: current_content = t
    
    if current and current_field:
        current['properties'][current_field] = current_content.strip()
    if current and current['properties']:
        syndromes.append(current)
    
    return syndromes

result = {'categories': [], 'subCategories': [], 'herbs': [], 'searchIndex': []}

for ci, secs in ch_groups.items():
    ch_name = ch_markers[ci][1]
    cat = {'id': gen_id(), 'name': ch_name, 'subCategoryIds': []}
    result['categories'].append(cat)
    
    for si, sec in enumerate(secs):
        sub = {'id': gen_id(), 'name': sec['name'], 'categoryId': cat['id'], 'herbIds': []}
        result['subCategories'].append(sub)
        cat['subCategoryIds'].append(sub['id'])
        
        section_end = secs[si+1]['line'] if si+1 < len(secs) else (
            ch_markers[ci+1][0] if ci+1 < len(ch_markers) else len(lines))
        
        syndromes = extract_syndromes(sec['line'], section_end)
        
        for syn in syndromes:
            syn['subCategoryId'] = sub['id']
            syn['categoryId'] = cat['id']
            sub['herbIds'].append(syn['id'])
            result['herbs'].append(syn)
            for k, v in syn['properties'].items():
                result['searchIndex'].append({'type': k, 'text': v, 'itemId': syn['id'], 'dataType': 'internal'})
            result['searchIndex'].append({'type': 'name', 'text': syn['name'], 'itemId': syn['id'], 'dataType': 'internal'})

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Categories: {len(result['categories'])}")
print(f"SubCategories: {len(result['subCategories'])}")
print(f"Syndromes: {len(result['herbs'])}")
print(f"SearchIndex: {len(result['searchIndex'])}")

for ci, secs in ch_groups.items():
    ch_name = ch_markers[ci][1]
    for sec in secs:
        cat_id = [c['id'] for c in result['categories'] if c['name'] == ch_name][0]
        s = next(s for s in result['subCategories'] if s['name'] == sec['name'] and s['categoryId'] == cat_id)
        items = [h for h in result['herbs'] if h['id'] in s['herbIds']]
        names = [h['name'] for h in items]
        print(f"  {ch_name} > {sec['name']}: {len(items)} -> {names}")
