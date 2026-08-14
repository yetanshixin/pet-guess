import json
import csv
import os


def export_json_to_csv(json_filepath='petdex.json', csv_filepath='petdex.csv'):
    if not os.path.exists(json_filepath):
        print(f"❌ 找不到文件: {json_filepath}，请先运行爬虫生成数据。")
        return

    print("正在读取 JSON 数据...")
    with open(json_filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print("JSON 数据为空！")
        return

    # 动态获取所有列名（表头），防止你以后在 JSON 里加了新字段而漏掉
    headers = []
    for item in data:
        for key in item.keys():
            if key not in headers:
                headers.append(key)

    print(f"检测到 {len(headers)} 列属性，正在生成 CSV...")

    # 重要：必须使用 'utf-8-sig' 编码，否则 Windows 下用 Excel 打开中文字符一定会乱码
    with open(csv_filepath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()

        for row in data:
            processed_row = {}
            for key in headers:
                val = row.get(key, "")

                # 美化输出格式：将 Python 的列表拼接为字符串（例如：["草", "毒"] -> "草-毒"）
                if isinstance(val, list):
                    processed_row[key] = "-".join(str(v) for v in val)

                # 将布尔值转换为 "是" 或 "否"
                elif isinstance(val, bool):
                    processed_row[key] = "是" if val else "否"

                else:
                    processed_row[key] = val

            writer.writerow(processed_row)

    print(f"✅ 成功将 {len(data)} 条精灵数据导出到 {csv_filepath}！")


if __name__ == "__main__":
    export_json_to_csv()
