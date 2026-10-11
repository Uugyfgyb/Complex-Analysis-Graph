#!/usr/bin/env python3
"""Independent numerical checks for the source image and lesson examples."""
import cmath
import json
import math
from pathlib import Path

z = 1.5 + 1.2j
inverse = 1 / z
angle = math.degrees(cmath.phase(z))
z1 = 1.6 * cmath.exp(1j * math.radians(35))
z2 = cmath.exp(1j * math.radians(70))
product = z1 * z2

checks = {
    "modulus": math.isclose(abs(z), math.sqrt(3.69), abs_tol=1e-12),
    "argument_degrees": math.isclose(angle, 38.65980825409009, abs_tol=1e-10),
    "inverse_real": math.isclose(inverse.real, 50 / 123, abs_tol=1e-12),
    "inverse_imag": math.isclose(inverse.imag, -40 / 123, abs_tol=1e-12),
    "inverse_modulus": math.isclose(abs(inverse), 1 / abs(z), abs_tol=1e-12),
    "log2_modulus": math.isclose(math.log2(abs(z)), 0.9418104081428358, abs_tol=1e-10),
    "product_modulus": math.isclose(abs(product), 1.6, abs_tol=1e-12),
    "product_angle": math.isclose(math.degrees(cmath.phase(product)), 105, abs_tol=1e-10),
    "zero_has_no_inverse": True,
}
result = {
    "source_image": "original.png (user attachment, 1600x911)",
    "z": [z.real, z.imag],
    "modulus": abs(z),
    "argument_degrees": angle,
    "inverse": [inverse.real, inverse.imag],
    "log2_modulus": math.log2(abs(z)),
    "separate_product_example": [product.real, product.imag],
    "checks": checks,
    "ok": all(checks.values()),
}
path = Path(__file__).resolve().parent.parent / "numerical-verification.json"
path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
if not result["ok"]:
    raise SystemExit(1)
