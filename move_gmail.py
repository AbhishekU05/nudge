import re

with open("app/page.tsx", "r") as f:
    content = f.read()

# Markers for Gmail Integration
start_marker = "          {/* 3. Gmail Integration */}"
end_marker = "        </section>\n\n        {/* BENTO BOX GRID */}"

gmail_idx = content.find(start_marker)
bento_idx = content.find(end_marker)

if gmail_idx == -1 or bento_idx == -1:
    print("Could not find markers")
    exit(1)

# Extract Gmail Integration
gmail_block = content[gmail_idx:bento_idx].rstrip()

# Remove it from its current position
new_content = content[:gmail_idx] + content[bento_idx:]

# We want to insert it right after the Client Portal section ends
target_marker = "        {/* CORE FOUR SECTIONS */}"
target_idx = new_content.find(target_marker)

if target_idx == -1:
    print("Could not find target marker")
    exit(1)

# Wrap it in a section
wrapped_gmail = f"""        {{/* GMAIL INTEGRATION SECTION */}}
        <section className="relative py-24 sm:py-32 bg-zinc-950 border-t border-white/5">
{gmail_block}
        </section>

"""

final_content = new_content[:target_idx] + wrapped_gmail + new_content[target_idx:]

with open("app/page.tsx", "w") as f:
    f.write(final_content)

print("Moved Gmail Integration successfully")
