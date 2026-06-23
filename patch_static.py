import re

targets = [
    ("app/for-agencies/page.tsx", "ForAgenciesPage"),
    ("app/for-consultants/page.tsx", "ForConsultantsPage"),
    ("app/for-freelancers/page.tsx", "ForFreelancersPage"),
]

with open("app/page.tsx", "r") as f:
    template = f.read()

# Prepare template
# 1. We need to find the metadata block in page.tsx to replace
metadata_pattern = re.compile(r"export const metadata: Metadata = \{.*?\};", re.DOTALL)

# 2. Hero h1 and p
h1_pattern = re.compile(r"(<h1[^>]*>)(.*?)(</h1>)", re.DOTALL)
p_pattern = re.compile(r"(<p[^>]*className=\"mt-6 max-w-xl.*?>)(.*?)(</p>)", re.DOTALL)
p2_pattern = re.compile(r"<p[^>]*className=\"mt-4 max-w-xl.*?>.*?</p>\s*", re.DOTALL)

for filepath, func_name in targets:
    with open(filepath, "r") as f:
        content = f.read()
    
    # Extract metadata
    metadata_match = metadata_pattern.search(content)
    if not metadata_match:
        print(f"Metadata not found in {filepath}")
        continue
    metadata = metadata_match.group(0)
    
    # Extract h1
    h1_match = h1_pattern.search(content)
    if not h1_match:
        print(f"h1 not found in {filepath}")
        continue
    h1_inner = h1_match.group(2).strip()
    
    # Extract p
    p_match = p_pattern.search(content)
    if not p_match:
        print(f"p not found in {filepath}")
        continue
    p_inner = p_match.group(2).strip()
    
    # Build new content from template
    new_content = metadata_pattern.sub(metadata, template)
    
    # Replace function name
    new_content = re.sub(r"export default async function \w+\(", f"export default async function {func_name}(", new_content)
    
    # Replace h1 inner
    new_content = h1_pattern.sub(rf"\g<1>\n                  {h1_inner}\n                \g<3>", new_content, count=1)
    
    # Replace p inner
    new_content = p_pattern.sub(rf"\g<1>\n                  {p_inner}\n                \g<3>", new_content, count=1)
    
    # Remove p2
    new_content = p2_pattern.sub("", new_content, count=1)
    
    with open(filepath, "w") as f:
        f.write(new_content)
    print(f"Patched {filepath} successfully")
