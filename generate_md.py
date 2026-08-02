import json
import os

db_path = '/Users/lanmuhang/Desktop/外网更新/management_db.json'
md_path = '/Users/lanmuhang/Desktop/外网更新/output_for_review.md'
output_path = '/Users/lanmuhang/Desktop/艾宾浩斯app/public/default_kb.md'

with open(db_path, 'r', encoding='utf-8') as f:
    db = json.load(f)

output_lines = []

for item in db:
    name = item.get('name', 'Unknown')
    output_lines.append(f"# {name}\n")
    
    if item.get('type') == 'concept':
        output_lines.append(f"**核心概念**：{item.get('core', '')}")
        output_lines.append(f"**适用场景**：{item.get('scene', '')}\n")
    elif item.get('type') == 'method':
        output_lines.append(f"**解决问题**：{item.get('solves', '')}")
        output_lines.append(f"**具体方法**：\n{item.get('method', '')}")
        output_lines.append(f"**应用建议**：{item.get('application', '')}\n")
    elif item.get('type') == 'brad_jacobs':
        output_lines.append(f"**核心原则**：{item.get('rule', '')}")
        output_lines.append(f"**职场映射**：{item.get('mapping', '')}\n")
    elif item.get('type') == 'psychology':
        output_lines.append(f"**心理学原理**：{item.get('principle', '')}")
        output_lines.append(f"**职场应用**：{item.get('application', '')}\n")
    else:
        output_lines.append(str(item) + "\n")

# Include the output_for_review.md
# We need to parse it because it has ## [1] titles which our parser uses # Title
with open(md_path, 'r', encoding='utf-8') as f:
    review_content = f.read()

import re
# Replace ## [1] Title with # [1] Title so our parser picks it up
review_content = re.sub(r'^##\s+\[\d+\]\s+(.*)', r'# \1', review_content, flags=re.MULTILINE)
output_lines.append("\n" + review_content)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"Generated {output_path} successfully!")
