import re

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the broken mermaid block backticks inside SYSTEM_PROMPT_VISUAL
text = text.replace('Wrap in a ```mermaid', 'Wrap in a \\`\\`\\`mermaid')
text = text.replace('/\\\[([^\\\]"]+)\\\]/g', '/\\[([^\\]"]+)\\]/g')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)
