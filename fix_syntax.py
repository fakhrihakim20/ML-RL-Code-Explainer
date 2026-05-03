import re

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace \` with `
text = text.replace(r'\`', '`')
# Replace \${ with ${
text = text.replace(r'\${', '${')
# Replace \\p with \p
text = text.replace(r'\\p', r'\p')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)
