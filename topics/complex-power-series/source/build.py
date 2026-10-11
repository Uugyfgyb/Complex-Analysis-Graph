#!/usr/bin/env python3
"""Rebuild the offline lesson from the supplied editable sources."""
from pathlib import Path
import re

here = Path(__file__).resolve().parent
topic = here.parent
template = (here / "page-template.html").read_text(encoding="utf-8")
app = (here / "app.js").read_text(encoding="utf-8")
css = (here / "vendor/katex.min.css").read_text(encoding="utf-8")
js = (here / "vendor/katex.min.js").read_text(encoding="utf-8")

assert "/*APP_JS*/" in template
assert "<!--KATEX_CSS-->" in template
assert "<!--KATEX_JS-->" in template
page = template.replace("/*APP_JS*/", app)
page = page.replace("<!--KATEX_CSS-->", "<style>\n" + css + "\n</style>")
page = page.replace("<!--KATEX_JS-->", "<script>\n" + js + "\n</script>")
assert not re.search(r'(?:src|href)="https?://[^\"]*"|@import', page)
assert len(list((topic / "katex-fonts").glob("*.woff2"))) == 20
out = topic / "index.html"
out.write_text(page, encoding="utf-8")
print(out, len(page.encode("utf-8")), "bytes")
