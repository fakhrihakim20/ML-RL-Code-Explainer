import cssutils
import logging

# Suppress cssutils warnings
cssutils.log.setLevel(logging.CRITICAL)

try:
    with open('styles.css', 'r', encoding='utf-8') as f:
        content = f.read()
    sheet = cssutils.parseString(content)
    print("CSS is valid")
except Exception as e:
    print(f"CSS Error: {e}")
