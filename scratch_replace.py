import re
with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace const clean = heading.replace(/^[\p{Emoji}\s]+/u, '').trim() || heading;
# With const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;

code = code.replace(
    r"const clean = heading.replace(/^[\p{Emoji}\s]+/u, '').trim() || heading;",
    r"const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;"
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)
