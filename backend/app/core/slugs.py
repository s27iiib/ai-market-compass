def slug_to_symbol(slug: str) -> str:
    """Mirrors slugToSymbol in src/lib/mock-data.ts, e.g. "xau-usd" -> "XAU/USD"."""
    return slug.replace("-", "/").upper()
