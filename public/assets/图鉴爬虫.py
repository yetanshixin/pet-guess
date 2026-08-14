import requests
import json
import re
import os
from lxml import html
import urllib.parse
import time
import random
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://wiki.biligame.com/rocom/"
STATS_URL = "https://wiki.biligame.com/rocom/精灵筛选"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://wiki.biligame.com/rocom/%E7%B2%BE%E7%81%B5%E7%AD%9B%E9%80%89',
    'Connection': 'keep-alive',
    'Cookie': 'Hm_lvt_1442156a0599c4005078ed0781dee5b9=1786010747; Hm_lpvt_1442156a0599c4005078ed0781dee5b9=1786348286; buvid_fp=dccf6638df1c6f3e0825a09319250ba1; b_nut=1786010732; buvid3=F033A8CF-7790-773A-37B9-F8E6305E138632067infoc; buvid4=E4EEC50B-CFFD-60F5-CE04-FD03187EA7A133129-026080618-x0sXegyVyrwm2w/bfo5Inw%3D%3D; Hm_lvt_cb50e488eca598646f26b3bf09b83ada=1786010739; HMACCOUNT=A7A61A382FE59A86; b_lsid=8DE6EF52_19FEA7F822C; Hm_lpvt_cb50e488eca598646f26b3bf09b83ada=1786348286'
}

# 提前创建好存放图片的文件夹
AVATAR_DIR = "images/avatars"
FULL_DIR = "images/full"
os.makedirs(AVATAR_DIR, exist_ok=True)
os.makedirs(FULL_DIR, exist_ok=True)


# === 读取本地已有数据 ===
def load_existing_data(filepath='petdex.json'):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"读取本地 {filepath} 失败: {e}")
    return []


# === 智能合并数据函数 ===
def merge_data(new_data, old_data):
    merged = new_data.copy()

    for key, old_val in old_data.items():
        new_val = merged.get(key)

        # === 针对“特性”进行按索引 [0] 和 [1] 独立的精准合并 ===
        if key == '特性':
            old_trait = old_val if isinstance(old_val, list) else []
            new_trait = new_val if isinstance(new_val, list) else []

            # 安全提取旧数据的 [0]特性名 和 [1]特性详情
            old_0 = old_trait[0] if len(old_trait) > 0 else ""
            old_1 = old_trait[1] if len(old_trait) > 1 else ""

            # 安全提取新数据的 [0]特性名 和 [1]特性详情
            new_0 = new_trait[0] if len(new_trait) > 0 else ""
            new_1 = new_trait[1] if len(new_trait) > 1 else ""

            # 独立补全：新数据有就用新的，新数据为空/缺失就保留旧的
            final_0 = new_0 if new_0 else old_0
            final_1 = new_1 if new_1 else old_1

            merged['特性'] = [final_0, final_1]
            continue  # 特性单独处理完毕，跳过下方的通用逻辑

        # 通用保护机制（针对 属性、蛋组、生命 等其他所有字段）
        if (new_val == 0 or new_val == "" or new_val == [] or new_val is None) and old_val:
            merged[key] = old_val

        if key not in merged:
            merged[key] = old_val

    return merged


def download_image(img_url, save_path, session):
    if not img_url: return ""
    if img_url.startswith("//"): img_url = "https:" + img_url
    try:
        # 断点续爬：虽然 JSON 是全量跑，但图片只要存在就不用重新下，节省大量时间
        if os.path.exists(save_path): return save_path
        res = session.get(img_url, timeout=30)
        if res.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(res.content)
            return save_path
    except Exception as e:
        print(f"  ❌ 图片下载失败: {img_url}, 错误: {e}")
    return img_url


def safe_int(val_list):
    if val_list and str(val_list[0]).strip().isdigit():
        return int(val_list[0].strip())
    return 0


def get_more_info(url, pet_info, session):
    try:
        pet_response = session.get(url, timeout=60)
        if pet_response.status_code != 200:
            print(f"[{pet_info['编号']}] {pet_info['名称']} 提取详情失败！状态码: {pet_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"[{pet_info['编号']}] {pet_info['名称']} 提取详情失败！异常: {e}")
        return

    pet_doc = html.fromstring(pet_response.text)

    描述_list = pet_doc.xpath('//*[@id="mw-content-text"]//span[@class="sprite-typename"]/text()')
    if 描述_list: pet_info["描述"] = 描述_list[0].strip()

    图片_list = pet_doc.xpath('//*[@id="mw-content-text"]//div[@class="tab-content active"]/img/@src')
    if 图片_list:
        img_url = 图片_list[0].strip()
        save_path = f"{FULL_DIR}/{pet_info['编号']}.png"
        download_image(img_url, save_path, session)

    介绍_list = pet_doc.xpath('//*[@id="mw-content-text"]//div[@class="sprite-info-desc"]/text()')
    if 介绍_list: pet_info["介绍"] = 介绍_list[0].strip()

    特性_list = pet_doc.xpath('//*[@id="mw-content-text"]//div[@class="sprite-trait-desc"]/text()')
    if 特性_list: pet_info["特性"][1] = 特性_list[0].strip()

    if pet_info['阶段'] > 1:
        当前阶段_list = pet_doc.xpath(
            f'//*[@id="mw-content-text"]//div[@class="sprite-evolve-section"][{pet_info["阶段"]}]')
        if 当前阶段_list and 当前阶段_list[0] is not None:
            当前阶段 = 当前阶段_list[0]
            当前进化_list = 当前阶段.xpath('./div[@class="sprite-evolve-main"]/div[@class="sprite-evolve-cond"]')
            if 当前进化_list and 当前进化_list[0] is not None:
                当前进化 = 当前进化_list[0]
                进化等级_list = 当前进化.xpath('./span[@class="sprite-evolve-level"]/text()')
                if 进化等级_list:
                    进化等级_str = re.search(r'\d+', 进化等级_list[0].strip())
                    if 进化等级_str: pet_info["进化等级"] = int(进化等级_str.group())
                进化方式_list = 当前进化.xpath('./span[@class="sprite-evolve-extra"]/text()')
                if 进化方式_list: pet_info["进化方式"] = 进化方式_list[0].strip()

    性别比例_list = pet_doc.xpath('//*[@id="mw-content-text"]//div[@class="sprite-ecology-value"]/text()')
    if 性别比例_list: pet_info["性别比例"] = 性别比例_list[0].strip()

    蛋组_list = pet_doc.xpath('//*[@id="mw-content-text"]//div[@class="sprite-ecology-tags"]/span')
    if 蛋组_list:
        for 蛋组 in 蛋组_list:
            组_list = 蛋组.xpath('./text()')
            if 组_list and 组_list[0].strip() != "未发现": pet_info["蛋组"].append(组_list[0].strip())

    print(f"[{pet_info['编号']}] {pet_info['名称']} 数据抓取及合并完毕...")


def save_all_pet(all_pet):
    # 按照编号排序，防止写入后乱序
    all_pet.sort(key=lambda x: x.get('编号', 0))
    with open('petdex.json', 'w', encoding='utf-8') as f:
        json.dump(all_pet, f, ensure_ascii=False, indent=2)
    print(f"成功保存 {len(all_pet)} 只精灵数据到 petdex.json！")


def main():
    session = requests.Session()
    session.headers.update(HEADERS)
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    # === 初始化：提取老数据并转为字典，以便快速匹配 ===
    old_list = load_existing_data()
    old_dict = {p.get('编号'): p for p in old_list if p.get('编号')}

    response = session.get(STATS_URL, timeout=60)
    if response.status_code != 200:
        print(f'网站打开失败！状态码: {response.status_code}')
        return

    document = html.fromstring(response.text)
    pet_list = document.xpath('//*[@id="mw-content-text"]//table/tbody/tr[@class="divsort"]')
    all_pet = []

    print("开始全量抓取数据并与本地比对，请耐心等待...")

    for pet in pet_list:
        pet_info = {
            '编号': 0, '名称': '', '描述': '', '介绍': '',
            '特性': ['', ''], '属性': [], '总种族值': 0,
            '生命': 0, '物攻': 0, '魔攻': 0, '物防': 0, '魔防': 0, '速度': 0,
            '阶段': 0, '进化等级': 0, '进化方式': '', '蛋组': [],
            '性别比例': '', '进化链': '', '有地区形态': False, '有首领形态': False, '有异色形态': False
        }

        编号_list = pet.xpath('./td[@class="dex-pet-number"]/text()')
        if not 编号_list: continue
        编号_str = re.search(r'\d+', 编号_list[0].strip())
        if not 编号_str: continue

        编号 = int(编号_str.group())
        形态_list = pet.xpath('./@data-param4')
        形态 = 形态_list[0].strip() if 形态_list else "原始形态"
        进化链_list = pet.xpath('./@data-dex-search')
        进化链_str = re.search(r'\S*?进化链', 进化链_list[0].strip() if 进化链_list else '')
        进化链 = 进化链_str.group() if 进化链_str else ''
        是主形态 = False
        主形态_list = pet.xpath('./@data-param5')
        if 主形态_list: 是主形态 = (主形态_list[0].strip() == "主形态")

        if 是主形态:
            pet_info['编号'] = 编号
            pet_info['进化链'] = 进化链
            头像_list = pet.xpath('./td[@class="dex-pet-table-portrait"]/a/img/@src')
            if 头像_list:
                img_url = 头像_list[0].strip()
                save_path = f"{AVATAR_DIR}/{编号}.png"
                download_image(img_url, save_path, session)

            阶段_list = pet.xpath('./@data-param1')
            if 阶段_list:
                阶段 = 阶段_list[0].strip()
                if 阶段 == '一阶':
                    pet_info['阶段'] = 1
                elif 阶段 == '二阶':
                    pet_info['阶段'] = 2
                elif 阶段 == '三阶':
                    pet_info['阶段'] = 3

            主属性_list = pet.xpath('./@data-param2')
            if 主属性_list: pet_info['属性'].append(主属性_list[0].strip())
            副属性_list = pet.xpath('./@data-param3')
            if 副属性_list: pet_info['属性'].append(副属性_list[0].strip())
            异色_list = pet.xpath('./@data-param6')
            if 异色_list: pet_info['有异色形态'] = (异色_list[0].strip() == "是")
            特性_list = pet.xpath('./td[5]/span/span/text()')
            if 特性_list: pet_info['特性'][0] = 特性_list[0].strip()

            pet_info['生命'] = safe_int(pet.xpath('./td[6]/text()'))
            pet_info['速度'] = safe_int(pet.xpath('./td[7]/text()'))
            pet_info['物攻'] = safe_int(pet.xpath('./td[8]/text()'))
            pet_info['魔攻'] = safe_int(pet.xpath('./td[9]/text()'))
            pet_info['物防'] = safe_int(pet.xpath('./td[10]/text()'))
            pet_info['魔防'] = safe_int(pet.xpath('./td[11]/text()'))
            pet_info['总种族值'] = safe_int(pet.xpath('./td[12]/text()'))

            if 形态 == "首领形态":
                pet_info['有首领形态'] = True
            elif 形态 == "地区形态":
                pet_info['有地区形态'] = True

            名称_list = pet.xpath('./td[@class="dex-pet-table-name"]//a/text()')
            if 名称_list:
                pet_info['名称'] = re.sub(r'（.*?）', '', 名称_list[0]).strip()
                INFO_URL = BASE_URL + urllib.parse.quote(名称_list[0].strip())

                # 去专属页面获取详情
                get_more_info(INFO_URL, pet_info, session)

                # === 核心操作：数据合并 ===
                if 编号 in old_dict:
                    pet_info = merge_data(pet_info, old_dict[编号])

                # 休眠防封
                time.sleep(random.uniform(1.5, 3.5))

            all_pet.append(pet_info)

        else:
            if 进化链:
                arr = [item for item in all_pet if item['进化链'] == 进化链]
                if arr:
                    for p in arr:
                        if 形态 == "首领形态":
                            p['有首领形态'] = True
                        elif 形态 == "地区形态":
                            p['有地区形态'] = True

    save_all_pet(all_pet)


if __name__ == "__main__":
    main()
