for dir in app/use-case app/for app/integrations app/location; do
  for file in $dir/*/page.tsx; do
    echo "Patching $file"
    sed -i 's/export function generateMetadata({ params }: { params: { [a-zA-Z]*: string } }): Metadata/export async function generateMetadata({ params }: { params: Promise<{ '"$(basename $(dirname $file) | sed 's/\[//' | sed 's/\]//')"': string }> }): Promise<Metadata>/g' "$file"
    sed -i 's/export default function [a-zA-Z]*Page({ params }: { params: { [a-zA-Z]*: string } })/export default async function '"$(basename $(dirname $file) | sed 's/\[//' | sed 's/\]//' | tr '[:lower:]' '[:upper:]')"'_Page({ params }: { params: Promise<{ '"$(basename $(dirname $file) | sed 's/\[//' | sed 's/\]//')"': string }> })/g' "$file"
    sed -i 's/const data = [a-zA-Z]*\[params\.[a-zA-Z]*\];/const { '"$(basename $(dirname $file) | sed 's/\[//' | sed 's/\]//')"': paramValue } = await params;\n  const data = '"$(grep -o 'const data = [a-zA-Z]*' "$file" | cut -d' ' -f3 | head -n1)"'[paramValue];/g' "$file"
  done
done
