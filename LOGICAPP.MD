# AwaniShop — Application Logic

Living document for business rules. Start with **Données de base**; Vente / Achats / Caisse come later.

---

## Données de base

Master data used by the rest of the shop: **Clients**, **Fournisseurs**, **Produits**, **Catégories**.

### Category

- `name` — single display name (e.g. Verre)
- `code` — exactly **3 uppercase letters**, unique (e.g. `GLS`)
- `nextProductSeq` — internal counter for product codes (starts at 1)

### Product

| Field | Rule |
|-------|------|
| `code` | Auto-generated: `{category.code}` + 4-digit seq → `GLS0001`. Immutable. |
| `name` | Required. Unique among **active** products (case-insensitive). |
| `qrCode` | Optional reference / barcode. |
| `category` | Required on create. **Cannot change** after create (code depends on it). |
| `isActive` | Soft delete / deactivate. Default `true`. |

**Create**
1. Category required.
2. Reject if an active product already has the same name.
3. Assign `code` from category `code` + `nextProductSeq`, then increment seq.

**Update**
- Allowed: `name`, `qrCode` only.
- Category is locked.

**Deactivate / Activate**
- Deactivate → `isActive: false` (name can be reused by a new product).
- Activate → reject if another **active** product already has the same name.

Removed from product (moved to Achats / Stock later): buy price, sell price, quantity, supplier link.

### Client

- `fullName` — required
- `phone` — optional / nullable
- `loyaltyPoints` — default 0 (award rules return with Vente)

### Fournisseur (Supplier)

- `fullName` — required
- `phone` — optional
- `location` — optional
- `nif` — optional
- `nis` — optional
- `rc` — optional (registre de commerce)
- `email` — optional

---

## Later slices (not implemented yet)

- Vente directe + rapport (CA, marge)
- Achats / lots / expiration
- Stock / inventaire with reasons
- Cassier (shift cash)
- Frais (expenses)
