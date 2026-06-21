import os
import json
import os
import json

base_dir = "/media/shad0w/Data1/Abhi_Data/Data/Programming_II/Projects/email_reminder/nudge/app"

categories = [
    {
        "folder": "alternatives",
        "title": "Duely Alternatives & Comparisons",
        "desc": "Compare Duely with other invoice tracking and accounts receivable tools.",
        "data_key": "competitors",
        "prefix": "alternatives/duely-vs-"
    },
    {
        "folder": "for",
        "title": "Duely for Your Industry",
        "desc": "See how Duely helps specific industries manage their collections workflow.",
        "data_key": "industries",
        "prefix": "for/"
    },
    {
        "folder": "integrations",
        "title": "Duely Integrations",
        "desc": "Connect Duely with your favorite accounting and invoicing software.",
        "data_key": "integrations",
        "prefix": "integrations/"
    },
    {
        "folder": "location",
        "title": "Duely by Location",
        "desc": "Explore how businesses around the world use Duely to get paid faster.",
        "data_key": "locations",
        "prefix": "location/"
    },
    {
        "folder": "use-case",
        "title": "Duely Use Cases",
        "desc": "Discover the different ways you can use Duely to optimize your cash flow.",
        "data_key": "useCases",
        "prefix": "use-case/"
    }
]

template = """import SEOIndexTemplate from "@/components/site/seo-index-template";
import { __DATA_KEY__ } from "@/lib/seo-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "__TITLE__ | Duely",
  description: "__DESC__",
};

export default function Page() {
  const links = Object.keys(__DATA_KEY__).map(key => ({
    href: `/__PREFIX__${key}`,
    label: __DATA_KEY__[key].title,
    description: __DATA_KEY__[key].metaDescription
  }));

  return (
    <SEOIndexTemplate 
      title="__TITLE__"
      description="__DESC__"
      links={links}
    />
  );
}
"""

for cat in categories:
    folder_path = os.path.join(base_dir, cat['folder'])
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, "page.tsx")
    
    content = template.replace("__DATA_KEY__", cat['data_key']).replace("__TITLE__", cat['title']).replace("__DESC__", cat['desc']).replace("__PREFIX__", cat['prefix'])
    
    with open(file_path, 'w') as f:
        f.write(content)

print("Generated index pages.")
