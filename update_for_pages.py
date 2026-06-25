import re

targets = [
    ("app/for-agencies/page.tsx", "ForAgenciesPage"),
    ("app/for-consultants/page.tsx", "ForConsultantsPage"),
    ("app/for-freelancers/page.tsx", "ForFreelancersPage"),
]

with open("app/page.tsx", "r") as f:
    template = f.read()

metadata_pattern = re.compile(r"export const metadata: Metadata = \{.*?\};", re.DOTALL)

h1_pattern = re.compile(r"(<h1[^>]*>)(.*?)(</h1>)", re.DOTALL)
p_pattern = re.compile(r"(<p[^>]*className=\"mt-6[^>]*>)(.*?)(</p>)", re.DOTALL)

for filepath, func_name in targets:
    with open(filepath, "r") as f:
        content = f.read()
    
    metadata_match = metadata_pattern.search(content)
    if not metadata_match:
        print(f"Metadata not found in {filepath}")
        continue
    metadata = metadata_match.group(0)
    
    h1_match = h1_pattern.search(content)
    if not h1_match:
        print(f"h1 not found in {filepath}")
        continue
    h1_inner = h1_match.group(2).strip()
    
    p_match = p_pattern.search(content)
    if not p_match:
        print(f"p not found in {filepath}")
        continue
    p_inner = p_match.group(2).strip()
    
    new_content = metadata_pattern.sub(metadata, template)
    new_content = re.sub(r"export default async function \w+\(", f"export default async function {func_name}(", new_content)
    new_content = h1_pattern.sub(rf"\g<1>\n              {h1_inner}\n            \g<3>", new_content, count=1)
    new_content = p_pattern.sub(rf"\g<1>\n              {p_inner}\n            \g<3>", new_content, count=1)
    
    with open(filepath, "w") as f:
        f.write(new_content)
    print(f"Patched {filepath} successfully")
