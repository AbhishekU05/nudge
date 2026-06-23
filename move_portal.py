import re

with open("app/page.tsx", "r") as f:
    content = f.read()

# Extract the Client Portal section
start_marker = "          {/* 4. Client Portal */}"
end_marker = "        </section>\n\n        {/* BENTO BOX GRID */}"

client_portal_idx = content.find(start_marker)
bento_idx = content.find(end_marker)

if client_portal_idx == -1 or bento_idx == -1:
    print("Could not find markers")
    exit(1)

# We want everything from start_marker to just before end_marker
client_portal_block = content[client_portal_idx:bento_idx].rstrip()

# Remove it from its current position
new_content = content[:client_portal_idx] + content[bento_idx:]

# We want to insert it right before:
#         {/* CORE FOUR SECTIONS */}
target_marker = "        {/* CORE FOUR SECTIONS */}"
target_idx = new_content.find(target_marker)

if target_idx == -1:
    print("Could not find target marker")
    exit(1)

# Wrap it in a section
wrapped_portal = f"""        {{/* CLIENT PORTAL SECTION */}}
        <section className="relative py-24 sm:py-32 bg-zinc-950 border-t border-white/5">
{client_portal_block}
        </section>

"""

final_content = new_content[:target_idx] + wrapped_portal + new_content[target_idx:]

with open("app/page.tsx", "w") as f:
    f.write(final_content)

print("Moved Client Portal successfully")
