import re

with open("app/features/page.tsx", "r") as f:
    content = f.read()

# Fix imports
if "Mail" not in content[:1000]:
    content = content.replace(
        "  User\n} from \"lucide-react\";",
        "  User,\n  Mail,\n  Users,\n  Activity,\n  AlertTriangle\n} from \"lucide-react\";"
    )

with open("app/features/page.tsx", "w") as f:
    f.write(content)

